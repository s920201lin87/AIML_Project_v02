const Influx = require("influx");

// 配置 InfluxDB 客戶端
const influx = new Influx.InfluxDB({
    host: "localhost",
    database: "battery_data",  // 與寫入程式碼一致的數據庫名稱
});

// 查詢數據函數
async function queryInfluxData(cellName, startTime, endTime, limit = 100) {
    try {
        console.log(`Querying data for cell: ${cellName}`);

        // 組建查詢語句
        const query = `
            SELECT "voltage", "charge", "temperature"
            FROM "records"
            WHERE "cell" = '${cellName}'
            AND time >= '${startTime}'
            AND time <= '${endTime}'
            ORDER BY time DESC
            LIMIT ${limit}
        `;

        // 執行查詢
        const results = await influx.query(query);

        if (results.length === 0) {
            console.log("No data found for the specified condition.");
        } else {
            console.log(`Retrieved ${results.length} rows:`);
            results.forEach((row, index) => {
                console.log(`Row ${index + 1}:`, row);
            });
        }
    } catch (error) {
        console.error("Error querying data from InfluxDB:", error);
    }
}

// 查詢條件
const cellName = "cell1";  // 電池名稱
const startTime = "2024-01-01T00:00:00Z";  // 開始時間
const endTime = new Date().toISOString();  // 結束時間 (當前時間)
const limit = 50;

// 執行查詢
queryInfluxData(cellName, startTime, endTime, limit);

// const Influx = require('influx');

// // 配置 InfluxDB 客戶端
// const influx = new Influx.InfluxDB({
//     host: 'localhost',          // InfluxDB 的伺服器地址
//     database: 'battery_data',   // 數據庫名稱
//     port: 8086,                 // 默認端口
// });

// // 查詢數據
// async function queryData() {
//     try {
//         console.log('Querying data from InfluxDB...');

//         // 設定查詢條件為過去 24 小時
//         // const query = `
//         //     SELECT "voltage", "charge", "temperature"
//         //     FROM "battery_data_measurement"
//         //     WHERE time > now() - 24h
//         // `;
//         const query = `SELECT "voltage", "charge", "temperature"
//         FROM "battery_data_measurement"
//         LIMIT 10`;


//         const results = await influx.query(query);

//         // 打印查詢結果
//         console.log(`Retrieved ${results.length} rows`);
//         results.forEach((row, index) => {
//             console.log(`Row ${index + 1}:`, row);
//         });
//     } catch (error) {
//         console.error('Error querying data from InfluxDB:', error);
//     }
// }

// // 執行查詢
// queryData();
