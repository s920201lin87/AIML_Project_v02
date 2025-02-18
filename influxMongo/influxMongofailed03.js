// const mongodb = require("mongodb");
// const Influx = require("influx");
// const fs = require("fs");

// // MongoDB 設置
// const mongoUrl = "mongodb://localhost:27017";
// const mongoDbName = "Data";
// const mongoCollectionName = "batteries";

// // InfluxDB 設置
// const influx = new Influx.InfluxDB({
//   host: "localhost",
//   database: "AIML_06",
// });

// // 批量插入大小
// const BATCH_SIZE = 100;
// // 最大重試次數
// const MAX_RETRIES = 3;
// // 延遲函數
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// (async () => {
//   let mongoClient;
//   let totalInserted = 0;
//   let failedBatches = [];a
//   let processedCount = 0;

//   try {
//     // 連接 MongoDB
//     mongoClient = await mongodb.MongoClient.connect(mongoUrl, { useNewUrlParser: true });
//     console.log("Connected to MongoDB");

//     const db = mongoClient.db(mongoDbName);
//     const collection = db.collection(mongoCollectionName);

//     // 確保 InfluxDB 資料庫存在
//     const databases = await influx.getDatabaseNames();
//     if (!databases.includes("AIML_06")) {
//       await influx.createDatabase("AIML_06");
//       console.log("InfluxDB database 'AIML_06' created.");
//     }

//     // 遍歷 MongoDB 數據
//     const cursor = collection.find({}, { timeout: false, noCursorTimeout: true }).batchSize(BATCH_SIZE);
//     console.log("Fetching data from MongoDB...");

//     let batch = [];
//     while (await cursor.hasNext()) {
//       const doc = await cursor.next();
//       processedCount++;

//       // 每 10,000 筆輸出進度
//       if (processedCount % 10000 === 0) {
//         console.log(`Processed ${processedCount} documents so far...`);
//       }

//       // 檢查時間戳有效性
//       if (!doc.time) {
//         console.error(`Skipped document due to missing 'time': ${JSON.stringify(doc)}`);
//         continue;
//       }

//       const randomOffset = Math.floor(Math.random() * 1000000);

//       const point = {
//         measurement: "batteries",
//         tags: { cell: doc.cell || "unknown" },
//         fields: {
//           cycle: doc.cycle || 0,
//           file: doc.file || "unknown",
//           voltage: doc.voltage || 0,
//           charge: doc.charge || 0,
//           temperature: doc.temperature || 0,
//         },
//         timestamp: new Date(doc.time).getTime() * 1e6 + randomOffset,
//       };

//       batch.push(point);

//       if (batch.length >= BATCH_SIZE) {
//         await writeBatchWithRetry(batch, failedBatches);
//         totalInserted += batch.length;
//         batch = [];
//       }
//     }

//     // 寫入剩餘數據
//     if (batch.length > 0) {
//       await writeBatchWithRetry(batch, failedBatches);
//       totalInserted += batch.length;
//     }

//     console.log(`Data migration completed. Total points written: ${totalInserted}`);

//     // 重試失敗的批次
//     if (failedBatches.length > 0) {
//       console.log(`Retrying ${failedBatches.length} failed batches...`);
//       for (const batch of failedBatches) {
//         await writeBatchWithRetry(batch, [], true);
//       }
//     }
//   } catch (err) {
//     console.error("Error during data migration:", err);
//   } finally {
//     if (mongoClient) {
//       mongoClient.close();
//       console.log("MongoDB connection closed.");
//     }
//   }
// })();

// // 寫入批次並進行重試
// async function writeBatchWithRetry(batch, failedBatches, isRetry = false) {
//   let retries = 0;
//   while (retries <= MAX_RETRIES) {
//     try {
//       await influx.writePoints(batch);
//       console.log(`Successfully written ${batch.length} points. Retries: ${retries}`);
//       return;
//     } catch (err) {
//       retries++;
//       console.error(`Error writing batch (attempt ${retries}): ${err.message}`);
//       if (retries > MAX_RETRIES) {
//         console.error(`Failed after ${MAX_RETRIES} retries. Saving batch to failed_batches.log.`);
//         fs.appendFileSync("failed_batches.log", JSON.stringify(batch) + "\n");
//         if (!isRetry) failedBatches.push(batch);
//       } else {
//         await sleep(500); // 重試前等待 500ms
//       }
//     }
//   }
// }
const mongodb = require("mongodb");
const Influx = require("influx");
const fs = require("fs");

// MongoDB 設置
const mongoUrl = "mongodb://localhost:27017";
const mongoDbName = "Data";
const mongoCollectionName = "batteries";

// InfluxDB 設置
const influx = new Influx.InfluxDB({
  host: "localhost",
  database: "AIML_06",
});

// 批量插入大小
const BATCH_SIZE = 100;
// 最大重試次數
const MAX_RETRIES = 3;
// 延遲函數
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 主程式
(async () => {
  let mongoClient;
  let totalInserted = 0;
  let processedCount = 0;
  let failedBatches = [];

  try {
    // 連接 MongoDB
    mongoClient = await mongodb.MongoClient.connect(mongoUrl, { useNewUrlParser: true });
    console.log("Connected to MongoDB");

    const db = mongoClient.db(mongoDbName);
    const collection = db.collection(mongoCollectionName);

    // 確保 InfluxDB 資料庫存在
    const databases = await influx.getDatabaseNames();
    if (!databases.includes("AIML_06")) {
      await influx.createDatabase("AIML_06");
      console.log("InfluxDB database 'AIML_06' created.");
    }

    // 遍歷 MongoDB 數據
    const cursor = collection.find({}, { timeout: false, noCursorTimeout: true }).batchSize(BATCH_SIZE);
    console.log("Fetching data from MongoDB...");

    let batch = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      processedCount++;

      // 每 10,000 筆輸出進度
      if (processedCount % 10000 === 0) {
        console.log(`Processed ${processedCount} documents so far...`);
      }

      // 檢查時間戳有效性
      if (!doc.time) {
        console.error(`Skipped document due to missing 'time': ${JSON.stringify(doc)}`);
        continue;
      }

      // 為時間戳增加隨機微秒偏移，確保唯一性
      const randomOffset = Math.floor(Math.random() * 1000000000); // 0 到 1,000,000 微秒

      const point = {
        measurement: "batteries",
        tags: { cell: doc.cell || "unknown" },
        fields: {
          cycle: doc.cycle || 0,
          file: doc.file || "unknown",
          voltage: doc.voltage || 0,
          charge: doc.charge || 0,
          temperature: doc.temperature || 0,
        },
        timestamp: new Date(doc.time).getTime() * 1e6 + randomOffset, // 確保時間唯一
      };

      batch.push(point);

      if (batch.length >= BATCH_SIZE) {
        await writeBatchWithRetry(batch, failedBatches);
        totalInserted += batch.length;
        console.log(`Total inserted so far: ${totalInserted}`);
        batch = [];
      }
    }

    // 寫入剩餘數據
    if (batch.length > 0) {
      await writeBatchWithRetry(batch, failedBatches);
      totalInserted += batch.length;
    }

    console.log(`Data migration completed. Total points written: ${totalInserted}`);

    // 重試失敗的批次
    if (failedBatches.length > 0) {
      console.log(`Retrying ${failedBatches.length} failed batches...`);
      for (const batch of failedBatches) {
        await writeBatchWithRetry(batch, [], true);
      }
    }
  } catch (err) {
    console.error("Error during data migration:", err);
  } finally {
    if (mongoClient) {
      mongoClient.close();
      console.log("MongoDB connection closed.");
    }
  }
})();

// 寫入批次並進行重試
async function writeBatchWithRetry(batch, failedBatches, isRetry = false) {
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      await influx.writePoints(batch);
      console.log(`Successfully written ${batch.length} points. Retries: ${retries}`);
      return;
    } catch (err) {
      retries++;
      console.error(`Error writing batch (attempt ${retries}): ${err.message}`);
      if (retries > MAX_RETRIES) {
        console.error(`Failed after ${MAX_RETRIES} retries. Saving batch to failed_batches.log.`);
        fs.appendFileSync("failed_batches.log", JSON.stringify(batch) + "\n");
        if (!isRetry) failedBatches.push(batch);
      } else {
        await sleep(1000); // 重試前等待 1 秒
      }
    }
  }
}
