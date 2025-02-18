const fs = require("fs");
const Influx = require("influx");
const csv = require("csv-parser");
const path = require("path");
const os = require("os");

// InfluxDB 設置
const influx = new Influx.InfluxDB({
    host: "localhost",
    database: "battery_data",
    pool: { max: 10, min: 2 }, // 降低最大連線池，減少資源消耗
});

// 批量插入大小
let BATCH_SIZE = 50; // 降低初始批次大小
const MAX_RETRIES = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dataDir = "./data"; // 資料夾路徑

(async () => {
    let totalInserted = 0;
    let failedBatches = [];

    try {
        const databases = await influx.getDatabaseNames();
        if (!databases.includes("battery_data")) {
            await influx.createDatabase("battery_data");
            console.log("InfluxDB database 'battery_data' created.");
        }

        const files = getAllCsvFiles(dataDir);

        // 逐檔案逐步處理，避免同時大量佔用資源
        for (const file of files) {
            await processCsvFile(file, failedBatches);
        }

        console.log(
            `CSV data migration completed. Total points written: ${totalInserted}`
        );
    } catch (err) {
        console.error("Error during CSV data migration:", err);
    }
})();

// 遞迴獲取所有 CSV 檔案
function getAllCsvFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllCsvFiles(filePath));
        } else if (file.endsWith(".csv")) {
            results.push(filePath);
        }
    });
    return results;
}

// 處理單個 CSV 檔案
async function processCsvFile(filePath, failedBatches) {
    let batch = [];
    let totalInserted = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                const timestamp =
                    Date.now() * 1000000 + Math.floor(Math.random() * 1000000000);
                const point = {
                    measurement: "records",
                    tags: {
                        cell: path.basename(path.dirname(path.dirname(filePath))),
                        cycle: path.basename(path.dirname(filePath)),
                        file: path.basename(filePath, ".csv"), // 從檔案名獲取 file
                    },
                    fields: {
                        cycle: parseFloat(row.cycle) || 0,
                        voltage: parseFloat(row.voltage) || 0,
                        charge: parseFloat(row.charge) || 0,
                        temperature: parseFloat(row.temperature) || 0,
                    },
                    timestamp: timestamp,
                };

                batch.push(point);

                if (batch.length >= BATCH_SIZE) {
                    writeBatchWithRetry(batch, failedBatches).then(() => {
                        totalInserted += batch.length;
                        console.log(`Total inserted so far: ${totalInserted}`);
                        batch = [];
                    });
                }
            })
            .on("end", async () => {
                if (batch.length > 0) {
                    await writeBatchWithRetry(batch, failedBatches);
                    totalInserted += batch.length;
                }
                resolve();
            })
            .on("error", reject);
    });
}

// 批次寫入 InfluxDB，失敗重試
async function writeBatchWithRetry(batch, failedBatches, isRetry = false) {
    let retries = 0;
    while (retries <= MAX_RETRIES) {
        try {
            await influx.writePoints(batch);
            console.log(
                `Successfully written ${batch.length} points. Retries: ${retries}`
            );
            return;
        } catch (err) {
            retries++;
            console.error(`Error writing batch (attempt ${retries}): ${err.message}`);
            if (retries > MAX_RETRIES) {
                console.error(
                    `Failed after ${MAX_RETRIES} retries. Saving batch to failed_batches.log.`
                );
                fs.appendFileSync("failed_batches.log", JSON.stringify(batch) + "\n");
                if (!isRetry) failedBatches.push(batch);
            } else {
                console.log("Reducing batch size and retrying...");
                BATCH_SIZE = Math.max(20, Math.floor(BATCH_SIZE / 2)); // 逐步減少批次大小
                await sleep(2000); // 增加重試延遲時間
            }
        }
    }
}
