const mongodb = require('mongodb');

// 配置
const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "battery_data";
const COLLECTION_NAME = "records";

async function countNegativeTimestamps() {
    const client = await mongodb.MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    try {
        // 查找 time 小於 Unix 紀元 (2440587.5) 的數據並計數
        const result = await collection.find({
            time: { $lt: 2440587.5 }  // 過濾儒略日小於 Unix 紀元的數據
        }).count();
        
        console.log(`Negative timestamp records count: ${result}`);
    } catch (err) {
        console.error("Error during MongoDB query:", err);
    } finally {
        client.close();
        console.log("MongoDB connection closed.");
    }
}

countNegativeTimestamps();
