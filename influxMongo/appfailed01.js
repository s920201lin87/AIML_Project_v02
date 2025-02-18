// console.log("讀取程式")
// const MongoClient = require('mongodb').MongoClient;
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');

// // MongoDB 配置
// const MONGO_URI = 'mongodb://localhost:27017/Data'; // MongoDB 2.x 版本的連接字串

// MongoClient.connect(MONGO_URI, (err, db) => {
//     if (err) {
//         console.error('無法連接到 MongoDB：', err);
//         return;
//     }

//     console.log('已連接到 MongoDB！');
//     const collection = db.collection('batteries'); // 指定集合

//     // 指定資料夾路徑
//     const dataDir = path.join(__dirname, 'data');
//     const cells = fs.readdirSync(dataDir).filter(folder => folder.startsWith('Cell'));

//     // 遍歷 Cell 資料夾
//     cells.forEach(cell => {
//         const cellDir = path.join(dataDir, cell);

//         // 遍歷 cycXXXX 資料夾
//         const cycles = fs.readdirSync(cellDir).filter(folder => folder.startsWith('cyc'));
//         cycles.forEach(cycle => {
//             const cycleDir = path.join(cellDir, cycle);

//             // 遍歷四個 CSV 檔案
//             const csvFiles = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv'];
//             csvFiles.forEach(csvFile => {
//                 const csvPath = path.join(cycleDir, csvFile);

//                 if (fs.existsSync(csvPath)) {
//                     // 解析 CSV 檔案並插入資料
//                     processCsv(csvPath, cell, cycle, csvFile, collection);
//                 }
//             });
//         });
//     });

//     console.log('資料處理完成！');
// });

// // 處理單個 CSV 檔案
// function processCsv(filePath, cell, cycle, csvFile, collection) {
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
//                 temperature: parseFloat(row.Temperature)
//             };

//             // 插入資料到 MongoDB
//             collection.insert(document, (err, result) => {
//                 if (err) {
//                     console.error('插入資料失敗：', err);
//                 }
//             });
//         })
//         .on('end', () => {
//             console.log(`完成解析並插入檔案：${filePath}`);
//         })
//         .on('error', (err) => {
//             console.error(`處理檔案時發生錯誤：${filePath}`, err);
//         });
// }


// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const { MongoClient } = require('mongodb');

// // MongoDB 配置
// const MONGO_URI = 'mongodb://localhost:27017'; // 替換為你的 MongoDB 連接字串
// const DATABASE_NAME = 'Data'; // 資料庫名稱
// const COLLECTION_NAME = 'batteries'; // 集合名稱

// // 初始化 MongoDB 客戶端
// const client = new MongoClient(MONGO_URI);

// async function main() {
//     try {
//         // 連接到 MongoDB
//         await client.connect();
//         const db = client.db(DATABASE_NAME);
//         const collection = db.collection(COLLECTION_NAME);

//         // 指定資料夾路徑
//         const dataDir = path.join(__dirname, 'data');

//         // 遍歷 Cell 資料夾
//         const cells = fs.readdirSync(dataDir).filter(folder => folder.startsWith('Cell'));

//         for (const cell of cells) {
//             const cellDir = path.join(dataDir, cell);

//             // 遍歷 cycXXXX 資料夾
//             const cycles = fs.readdirSync(cellDir).filter(folder => folder.startsWith('cyc'));
//             for (const cycle of cycles) {
//                 const cycleDir = path.join(cellDir, cycle);

//                 // 遍歷四個 CSV 檔案
//                 const csvFiles = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv'];
//                 for (const csvFile of csvFiles) {
//                     const csvPath = path.join(cycleDir, csvFile);

//                     if (fs.existsSync(csvPath)) {
//                         // 解析 CSV 檔案並批量插入資料
//                         await processCsv(csvPath, cell, cycle, csvFile, collection);
//                     }
//                 }
//             }
//         }

//         console.log('資料處理完成！');
//     } catch (error) {
//         console.error('執行期間發生錯誤：', error);
//     } finally {
//         await client.close();
//     }
// }

// // 處理單個 CSV 檔案
// async function processCsv(filePath, cell, cycle, csvFile, collection) {
//     let batch = [];
//     const batchSize = 100; // 每次插入 100 筆
//     return new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//             .pipe(csv())
//             .on('data', (row) => {
//                 batch.push({
//                     cell: cell,
//                     cycle: cycle,
//                     file: csvFile,
//                     time: parseFloat(row.Time),
//                     voltage: parseFloat(row.Voltage),
//                     charge: parseFloat(row.Charge),
//                     temperature: parseFloat(row.Temperature),
//                 });

//                 // 如果達到批量大小，則插入
//                 if (batch.length >= batchSize) {
//                     collection.insertMany(batch, (err) => {
//                         if (err) {
//                             console.error('批量插入失敗：', err);
//                         }
//                     });
//                     batch = [];
//                 }
//             })
//             .on('end', () => {
//                 // 插入剩餘的資料
//                 if (batch.length > 0) {
//                     collection.insertMany(batch, (err) => {
//                         if (err) {
//                             console.error('剩餘資料插入失敗：', err);
//                         }
//                     });
//                 }
//                 console.log(`完成解析並插入檔案：${filePath}`);
//                 resolve();
//             })
//             .on('error', (err) => {
//                 console.error(`處理檔案時發生錯誤：${filePath}`, err);
//                 reject(err);
//             });
//     });
// }

// // 執行主程式
// main();
