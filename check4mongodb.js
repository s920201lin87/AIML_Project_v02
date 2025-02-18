const mongodb = require('mongodb');

// MongoDB 配置
const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "battery_data";
const COLLECTION_NAME = "records";

// 檢查 MongoDB 中的資料是否合法
async function checkMongoDBData() {
    const client = await mongodb.MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    try {
        console.log("Fetching data from MongoDB for validation...");
        const cursor = collection.find();

        let totalRecords = 0;
        let invalidRecords = 0;

        while (await cursor.hasNext()) {
            const record = await cursor.next();
            totalRecords++;

            // 驗證資料是否合法
            const hasInvalidFields =
                !record.time || isNaN(new Date(record.time).getTime()) ||
                !record.cell || typeof record.cell !== "string" ||
                !record.cycle || typeof record.cycle !== "string" ||
                !record.file_type || typeof record.file_type !== "string" ||
                isNaN(record.voltage) ||
                isNaN(record.charge) ||
                isNaN(record.temperature);

            if (hasInvalidFields) {
                invalidRecords++;
                console.warn(`Invalid record found: ${JSON.stringify(record)}`);
            }
        }

        console.log(`Total records: ${totalRecords}`);
        console.log(`Invalid records: ${invalidRecords}`);
        console.log(`Valid records: ${totalRecords - invalidRecords}`);
    } catch (err) {
        console.error("Error during MongoDB data validation:", err);
    } finally {
        client.close();
        console.log("MongoDB connection closed.");
    }
}

// 主程序
(async () => {
    try {
        await checkMongoDBData();
    } catch (err) {
        console.error("Error during execution:", err);
    } finally {
        process.exit();
    }
})();
