const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MongoClient = require('mongodb').MongoClient;

// MongoDB 配置
const MONGO_URI = 'mongodb://localhost:27017/Data'; // 替換為你的 MongoDB 連接字串
const COLLECTION_NAME = 'batteries'; // 集合名稱

MongoClient.connect(MONGO_URI, (err, db) => {
    if (err) {
        console.error('無法連接到 MongoDB：', err);
        return;
    }

    console.log('已連接到 MongoDB！');
    const collection = db.collection(COLLECTION_NAME); // 指定集合

    // 指定資料夾路徑
    const dataDir = path.join(__dirname, 'data');

    // 遍歷每個 Cell 資料夾
    const cells = fs.readdirSync(dataDir).filter(folder => folder.startsWith('Cell'));
    const tasks = []; // 儲存所有處理檔案的 Promise

    cells.forEach(cell => {
        const cellDir = path.join(dataDir, cell);

        // 遍歷 cycXXXX 資料夾
        const cycles = fs.readdirSync(cellDir).filter(folder => folder.startsWith('cyc'));
        cycles.forEach(cycle => {
            const cycleDir = path.join(cellDir, cycle);

            // 遍歷四個 CSV 檔案
            const csvFiles = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv'];
            csvFiles.forEach(csvFile => {
                const csvPath = path.join(cycleDir, csvFile);

                if (fs.existsSync(csvPath)) {
                    // 處理 CSV 檔案，並將 Promise 儲存到 tasks 陣列
                    tasks.push(processCsv(csvPath, cell, cycle, csvFile, collection));
                }
            });
        });
    });

    // 等待所有檔案處理完成
    Promise.all(tasks)
        .then(() => {
            console.log('所有資料已成功插入到 MongoDB！');
            db.close();
        })
        .catch(err => {
            console.error('處理期間發生錯誤：', err);
            db.close();
        });
});

// 處理單個 CSV 檔案
function processCsv(filePath, cell, cycle, csvFile, collection) {
    return new Promise((resolve, reject) => {
        const data = []; // 暫存 CSV 資料

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // 解析每一行資料並推入 data 陣列
                data.push({
                    cell: cell,
                    cycle: cycle,
                    file: csvFile,
                    time: parseFloat(row.Time),
                    voltage: parseFloat(row.Voltage),
                    charge: parseFloat(row.Charge),
                    temperature: parseFloat(row.Temperature)
                });
            })
            .on('end', () => {
                // 當 CSV 解析完成後，一次性插入資料
                if (data.length > 0) {
                    collection.insertMany(data, (err, result) => {
                        if (err) {
                            console.error(`插入檔案 ${filePath} 的資料失敗：`, err);
                            reject(err);
                        } else {
                            console.log(`完成插入檔案 ${filePath} 的 ${result.insertedCount} 筆資料`);
                            resolve();
                        }
                    });
                } else {
                    resolve(); // 沒有資料也需標記為完成
                }
            })
            .on('error', (err) => {
                console.error(`處理檔案 ${filePath} 時發生錯誤：`, err);
                reject(err);
            });
    });
}
