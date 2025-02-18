// // const fs = require('fs');
// // const path = require('path');
// // const csv = require('csv-parser');
// // const { MongoClient } = require('mongodb');

// // // MongoDB 配置
// // const MONGO_URI = 'mongodb://localhost:27017'; // 替換為你的 MongoDB 連接字串
// // const DATABASE_NAME = 'Data'; // 資料庫名稱
// // const COLLECTION_NAME = 'batteries'; // 集合名稱

// // // 初始化 MongoDB 客戶端
// // const client = new MongoClient(MONGO_URI);

// // async function main() {
// //     try {
// //         // 連接到 MongoDB
// //         await client.connect();
// //         const db = client.db(DATABASE_NAME);
// //         const collection = db.collection(COLLECTION_NAME);

// //         console.log('已連接到 MongoDB！');

// //         // 指定資料夾路徑
// //         const dataDir = path.join(__dirname, 'data');
// //         const cells = fs.readdirSync(dataDir).filter(folder => folder.startsWith('Cell'));

// //         for (const cell of cells) {
// //             const cellDir = path.join(dataDir, cell);

// //             // 遍歷 cycXXXX 資料夾
// //             const cycles = fs.readdirSync(cellDir).filter(folder => folder.startsWith('cyc'));
// //             for (const cycle of cycles) {
// //                 const cycleDir = path.join(cellDir, cycle);

// //                 // 遍歷四個 CSV 檔案
// //                 const csvFiles = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv'];
// //                 for (const csvFile of csvFiles) {
// //                     const csvPath = path.join(cycleDir, csvFile);

// //                     if (fs.existsSync(csvPath)) {
// //                         // 逐行解析 CSV 並插入資料
// //                         await processCsv(csvPath, cell, cycle, csvFile, collection);
// //                     }
// //                 }
// //             }
// //         }

// //         console.log('所有資料已成功處理並插入！');
// //     } catch (error) {
// //         console.error('執行期間發生錯誤：', error);
// //     } finally {
// //         await client.close();
// //     }
// // }

// // // 處理單個 CSV 檔案
// // async function processCsv(filePath, cell, cycle, csvFile, collection) {
// //     return new Promise((resolve, reject) => {
// //         fs.createReadStream(filePath)
// //             .pipe(csv())
// //             .on('data', async (row) => {
// //                 const document = {
// //                     cell: cell,
// //                     cycle: cycle,
// //                     file: csvFile,
// //                     time: parseFloat(row.Time),
// //                     voltage: parseFloat(row.Voltage),
// //                     charge: parseFloat(row.Charge),
// //                     temperature: parseFloat(row.Temperature),
// //                 };

// //                 try {
// //                     // 逐行插入資料
// //                     await collection.insertOne(document);
// //                 } catch (err) {
// //                     console.error('插入資料失敗：', err);
// //                 }
// //             })
// //             .on('end', () => {
// //                 console.log(`完成處理檔案：${filePath}`);
// //                 resolve();
// //             })
// //             .on('error', (err) => {
// //                 console.error(`處理檔案時發生錯誤：${filePath}`, err);
// //                 reject(err);
// //             });
// //     });
// // }

// // // 執行主程式
// // main();
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const MongoClient = require('mongodb').MongoClient;

// // MongoDB 配置
// const MONGO_URI = 'mongodb://localhost:27017'; // 替換為你的 MongoDB 連接字串
// const DATABASE_NAME = 'Data'; // 資料庫名稱
// const COLLECTION_NAME = 'batteries'; // 集合名稱

// function main() {
//     // 連接到 MongoDB
//     MongoClient.connect(MONGO_URI, (err, client) => {
//         if (err) {
//             console.error('無法連接到 MongoDB：', err);
//             return;
//         }

//         console.log('已連接到 MongoDB！');
//         const db = client.db(DATABASE_NAME);
//         const collection = db.collection(COLLECTION_NAME);

//         // 指定資料夾路徑
//         const dataDir = path.join(__dirname, 'data');
//         const cells = fs.readdirSync(dataDir).filter(folder => folder.startsWith('Cell'));

//         processCells(cells, dataDir, collection, () => {
//             console.log('所有資料已成功處理並插入！');
//             db.close(); // 關閉資料庫連接
//         });
//     });
// }

// // 遍歷 Cell 資料夾
// function processCells(cells, dataDir, collection, callback) {
//     let processed = 0;
//     cells.forEach((cell) => {
//         const cellDir = path.join(dataDir, cell);

//         // 遍歷 cycXXXX 資料夾
//         const cycles = fs.readdirSync(cellDir).filter(folder => folder.startsWith('cyc'));
//         cycles.forEach((cycle) => {
//             const cycleDir = path.join(cellDir, cycle);

//             // 遍歷四個 CSV 檔案
//             const csvFiles = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv'];
//             csvFiles.forEach((csvFile) => {
//                 const csvPath = path.join(cycleDir, csvFile);

//                 if (fs.existsSync(csvPath)) {
//                     processCsv(csvPath, cell, cycle, csvFile, collection, () => {
//                         processed++;
//                         if (processed === cells.length) {
//                             callback();
//                         }
//                     });
//                 }
//             });
//         });
//     });
// }

// // 處理單個 CSV 檔案
// function processCsv(filePath, cell, cycle, csvFile, collection, callback) {
//     fs.createReadStream(filePath)
//         .pipe(csv())
//         .on('data', (row) => {
//             const document = {
//                 cell: cell,
//                 cycle: cycle,
//                 file: csvFile,
//                 time: parseFloat(row.Time),
//                 voltage: parseFloat(row.Voltage),
//                 charge: parseFloat(row.Charge),
//                 temperature: parseFloat(row.Temperature),
//             };

//             // 插入資料
//             collection.insert(document, (err) => {
//                 if (err) {
//                     console.error('插入資料失敗：', err);
//                 }
//             });
//         })
//         .on('end', () => {
//             console.log(`完成處理檔案：${filePath}`);
//             callback();
//         })
//         .on('error', (err) => {
//             console.error(`處理檔案時發生錯誤：${filePath}`, err);
//             callback();
//         });
// }

// // 執行主程式
// main();
