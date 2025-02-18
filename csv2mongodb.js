const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongodb = require('mongodb');

// 資料夾結構
const BASE_DIR = path.join(__dirname, 'data'); // data 根目錄
const CELL_FOLDERS = ['Cell1', 'Cell2', 'Cell3', 'Cell4', 'Cell5', 'Cell6', 'Cell7', 'Cell8'];
const FILE_TYPES = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv']; // CSV 檔案名稱

// MongoDB 寫入邏輯
async function writeDataToMongoDB() {
    const MONGO_URI = "mongodb://localhost:27017";
    const DB_NAME = "battery_data";
    const COLLECTION_NAME = "records";

    const client = await mongodb.MongoClient.connect(MONGO_URI, { useUnifiedTopology: true });
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    try {
        for (const cell of CELL_FOLDERS) {
            const cellPath = path.join(BASE_DIR, cell);

            // 檢查 Cell 資料夾是否存在
            if (!fs.existsSync(cellPath)) {
                console.error(`Cell folder not found: ${cell}`);
                continue;
            }

            const cycFolders = fs.readdirSync(cellPath).filter((folder) => folder.startsWith('cyc'));

            for (const cyc of cycFolders) {
                const cycPath = path.join(cellPath, cyc);

                for (const fileType of FILE_TYPES) {
                    const filePath = path.join(cycPath, fileType);

                    // 檢查 CSV 檔案是否存在
                    if (!fs.existsSync(filePath)) {
                        console.warn(`File not found: ${filePath}`);
                        continue;
                    }

                    console.log(`Processing file: ${filePath}`);

                    // 流式讀取 CSV 檔案並寫入 MongoDB
                    const records = [];
                    await new Promise((resolve, reject) => {
                        fs.createReadStream(filePath)
                            .pipe(csv(['Time', 'Voltage', 'Charge', 'Temperature']))
                            .on('data', (row) => {
                                // 忽略第一行欄位名稱
                                if (row.Time === 'Time' && row.Voltage === 'Voltage' && row.Charge === 'Charge' && row.Temperature === 'Temperature') {
                                    return;
                                }

                                // 檢查是否有缺失值並過濾
                                if (!row.Time || !row.Voltage || !row.Charge || !row.Temperature) {
                                    console.warn(`Invalid row in ${filePath}: ${JSON.stringify(row)}`);
                                    return;
                                }

                                // 將資料推入陣列
                                records.push({
                                    cell,
                                    cycle: cyc,
                                    file_type: path.basename(fileType, '.csv'),
                                    time: row.Time,
                                    voltage: parseFloat(row.Voltage),
                                    charge: parseFloat(row.Charge),
                                    temperature: parseFloat(row.Temperature),
                                });
                            })
                            .on('end', async () => {
                                if (records.length > 0) {
                                    await collection.insertMany(records, { ordered: false });
                                    console.log(`Inserted ${records.length} records from ${filePath}`);
                                }
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error(`Error reading file: ${filePath}`, err);
                                reject(err);
                            });
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error during MongoDB write operation:", err);
    } finally {
        client.close();
        console.log("MongoDB connection closed.");
    }
}

// 主程序
(async () => {
    try {
        await writeDataToMongoDB();
    } catch (err) {
        console.error("Error during execution:", err);
    } finally {
        process.exit();
    }
})();
