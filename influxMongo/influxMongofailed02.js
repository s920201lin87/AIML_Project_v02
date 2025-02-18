// const mongodb = require("mongodb");
// const Influx = require("influx");

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
// const BATCH_SIZE = 1000;

// // 延遲函數
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// (async () => {
//   let mongoClient;
//   let totalInserted = 0;

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
//     const cursor = collection.find({}, { timeout: false }).batchSize(1000);
//     console.log("Fetching data from MongoDB...");

//     let batch = [];
//     while (await cursor.hasNext()) {
//       const doc = await cursor.next();

//       // 隨機微秒偏移，確保時間戳唯一性
//       const randomOffset = Math.floor(Math.random() * 1000000); // 0 到 1,000,000 微秒

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
//         timestamp: doc.time 
//           ? new Date(doc.time).getTime() * 1e6 + randomOffset
//           : Date.now() * 1e6 + randomOffset, // 使用當前時間加隨機偏移
//       };

//       batch.push(point);

//       // 批量寫入到 InfluxDB
//       if (batch.length >= BATCH_SIZE) {
//         try {
//           await influx.writePoints(batch);
//           totalInserted += batch.length;
//           console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
//           await sleep(100); // 延遲 100 毫秒，減輕 InfluxDB 壓力
//         } catch (err) {
//           console.error(`Error writing batch: ${err.message}, retrying...`);
//           try {
//             await influx.writePoints(batch); // 重試一次
//             console.log(`Retry successful for batch.`);
//           } catch (retryErr) {
//             console.error(`Retry failed: ${retryErr.message}`);
//           }
//         }
//         batch = [];
//       }
//     }

//     // 寫入剩餘數據
//     if (batch.length > 0) {
//       try {
//         await influx.writePoints(batch);
//         totalInserted += batch.length;
//         console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
//       } catch (err) {
//         console.error(`Error writing final batch: ${err.message}, retrying...`);
//         try {
//           await influx.writePoints(batch); // 重試一次
//           console.log(`Retry successful for final batch.`);
//         } catch (retryErr) {
//           console.error(`Retry failed: ${retryErr.message}`);
//         }
//       }
//     }

//     console.log(`Data migration completed. Total points written: ${totalInserted}`);
//   } catch (err) {
//     console.error("Error during data migration:", err);
//   } finally {
//     if (mongoClient) {
//       mongoClient.close();
//       console.log("MongoDB connection closed.");
//     }
//   }
// })();
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
const BATCH_SIZE = 1000;

// 延遲函數
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  let mongoClient;
  let totalInserted = 0;
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
    const cursor = collection.find({}, { timeout: false, noCursorTimeout: true }).batchSize(1000);
    console.log("Fetching data from MongoDB...");

    let batch = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // 檢查時間戳有效性
      if (!doc.time) {
        console.error(`Skipped document due to missing 'time': ${JSON.stringify(doc)}`);
        continue;
      }

      const randomOffset = Math.floor(Math.random() * 1000000);

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
        timestamp: new Date(doc.time).getTime() * 1e6 + randomOffset,
      };

      batch.push(point);

      if (batch.length >= BATCH_SIZE) {
        try {
          await influx.writePoints(batch);
          totalInserted += batch.length;
          console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
          await sleep(50);
        } catch (err) {
          console.error(`Error writing batch: ${err.message}`);
          failedBatches.push(batch);
          fs.appendFileSync("failed_batches.log", JSON.stringify(batch) + "\n");
        }
        batch = [];
      }
    }

    if (batch.length > 0) {
      try {
        await influx.writePoints(batch);
        totalInserted += batch.length;
        console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
      } catch (err) {
        console.error(`Error writing final batch: ${err.message}`);
        failedBatches.push(batch);
        fs.appendFileSync("failed_batches.log", JSON.stringify(batch) + "\n");
      }
    }

    console.log(`Data migration completed. Total points written: ${totalInserted}`);
    if (failedBatches.length > 0) {
      console.log(`Some batches failed to write. Check 'failed_batches.log' for details.`);
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
