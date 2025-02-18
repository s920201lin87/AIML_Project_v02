const mongodb = require("mongodb");
const Influx = require("influx");

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

(async () => {
  let mongoClient;
  let totalInserted = 0;

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
    const cursor = collection.find({}, { timeout: false }).batchSize(1000);
    console.log("Fetching data from MongoDB...");

    let batch = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // 構建 InfluxDB 點數據，添加隨機微秒偏移
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
        timestamp: doc.time 
          ? new Date(doc.time).getTime() * 1e6 + Math.floor(Math.random() * 1000) // time 存在時加微秒偏移
          : Date.now() * 1e6 + Math.floor(Math.random() * 1000), // time 缺失時用當前時間加偏移
      };

      batch.push(point);

      // 批量寫入到 InfluxDB
      if (batch.length >= BATCH_SIZE) {
        try {
          await influx.writePoints(batch);
          totalInserted += batch.length;
          console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
        } catch (err) {
          console.error(`Error writing batch to InfluxDB: ${err.message}`);
        }
        batch = [];
      }
    }

    // 寫入剩餘數據
    if (batch.length > 0) {
      try {
        await influx.writePoints(batch);
        totalInserted += batch.length;
        console.log(`Successfully written ${batch.length} points. Total: ${totalInserted}`);
      } catch (err) {
        console.error(`Error writing final batch to InfluxDB: ${err.message}`);
      }
    }

    console.log(`Data migration completed. Total points written: ${totalInserted}`);
  } catch (err) {
    console.error("Error during data migration:", err);
  } finally {
    if (mongoClient) {
      mongoClient.close();
      console.log("MongoDB connection closed.");
    }
  }
})();

// const mongodb = require("mongodb");
// const Influx = require("influx");

// // MongoDB 設置
// const mongoUrl = "mongodb://localhost:27017";
// const mongoDbName = "Data";
// const mongoCollectionName = "batteries";

// // InfluxDB 設置
// const influx = new Influx.InfluxDB({
//   host: "localhost",
//   database: "AIML_06", // 替換為您的 InfluxDB 資料庫名稱
// });

// // 批量插入大小
// const BATCH_SIZE = 1000;

// // 主程序
// (async () => {
//   let mongoClient;

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

//     // 獲取 MongoDB 數據
//     const cursor = collection.find({});
//     console.log("Fetching data from MongoDB...");

//     let batch = [];
//     while (await cursor.hasNext()) {
//       const doc = await cursor.next();

//       // 構建 InfluxDB 點數據
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
//         timestamp: new Date(doc.time).getTime() * 1e6, // 時間轉為納秒
//       };

//       batch.push(point);

//       // 批量寫入到 InfluxDB
//       if (batch.length >= BATCH_SIZE) {
//         console.log(`Writing ${batch.length} points to InfluxDB...`);
//         await influx.writePoints(batch);
//         batch = [];
//       }
//     }

//     // 寫入剩餘數據
//     if (batch.length > 0) {
//       console.log(`Writing ${batch.length} points to InfluxDB...`);
//       await influx.writePoints(batch);
//     }

//     console.log("Data migration completed successfully!");
//   } catch (err) {
//     console.error("Error during data migration:", err);
//   } finally {
//     if (mongoClient) {
//       mongoClient.close();
//       console.log("MongoDB connection closed.");
//     }
//   }
// })();
