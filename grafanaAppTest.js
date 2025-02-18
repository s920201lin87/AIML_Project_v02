const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3001; // API 监听的端口
const mongoUri = 'mongodb://localhost:27017'; // MongoDB URI

let db; // 用于存储数据库连接

// 连接到 MongoDB
MongoClient.connect(mongoUri, (err, client) => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // 如果无法连接，退出程序
    }

    db = client.db('Data'); // 替换为你的实际数据库名称
    console.log('Connected to MongoDB');
});

// 定义 API 路由，返回所有 Cell1 的数据
app.get('/data', async (req, res) => {
    if (!db) {
        res.status(500).send('Database not initialized');
        return;
    }

    const collection = db.collection('batteries'); // 替换为实际集合名称

    try {
        // 查询所有 Cell1 的数据
        const query = { cell: 'Cell1' }; // 查询条件，仅返回 cell 字段为 'Cell1' 的记录
        const data = await collection.find(query).toArray();
        res.json(data); // 返回 JSON 数据
    } catch (err) {
        res.status(500).send(err.toString());
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`API is running on http://localhost:${port}`);
});

// const express = require('express');
// const MongoClient = require('mongodb').MongoClient;

// const app = express();
// const port = 3001; // API 监听的端口
// const mongoUri = 'mongodb://localhost:27017'; // MongoDB URI

// let db; // 用于存储数据库连接

// // 连接到 MongoDB
// MongoClient.connect(mongoUri, (err, client) => {
//     if (err) {
//         console.error('Failed to connect to MongoDB:', err);
//         process.exit(1); // 如果无法连接，退出程序
//     }

//     db = client.db('Data'); // 替换为你的实际数据库名称
//     console.log('Connected to MongoDB');
// });
// app.get('/data', async (req, res) => {
//     const limit = parseInt(req.query.limit) || 100; // 获取 limit 参数
//     const collection = db.collection('batteries'); // 替换为实际集合名称

//     const data = await collection.find({}).limit(limit).toArray();
//     res.json(data); // 返回 JSON 数据
// });

// // 定义 API 路由
// app.get('/data', (req, res) => {
//     if (!db) {
//         res.status(500).send('Database not initialized');
//         return;
//     }

//     const collection = db.collection('batteries'); // 替换为实际集合名称

//     // 查询 MongoDB 数据，仅返回前 100 条记录
//     collection.find({}).limit(100).toArray((err, data) => {
//         if (err) {
//             res.status(500).send(err.toString());
//         } else {
//             res.json(data); // 返回 JSON 数据
//         }
//     });
// });

// // 启动服务器
// app.listen(port, () => {
//     console.log(`API is running on http://localhost:${port}`);
// });





// const express = require('express');
// const MongoClient = require('mongodb').MongoClient;

// const app = express();
// const port = 3001; // API 监听的端口
// const mongoUri = 'mongodb://localhost:27017'; // MongoDB URI

// let db; // 用于存储数据库连接

// // 连接到 MongoDB
// MongoClient.connect(mongoUri, (err, client) => {
//     if (err) {
//         console.error('Failed to connect to MongoDB:', err);
//         process.exit(1); // 如果无法连接，退出程序
//     }

//     db = client.db('Data'); // 替换为你的实际数据库名称
//     console.log('Connected to MongoDB');
// });

// // 定义 API 路由，支持查询 Cell1 的数据
// app.get('/data', async (req, res) => {
//     if (!db) {
//         res.status(500).send('Database not initialized');
//         return;
//     }

//     const limit = parseInt(req.query.limit) || 100; // 每次返回的记录数，默认 100
//     const page = parseInt(req.query.page) || 1; // 当前页码，默认第一页
//     const skip = (page - 1) * limit; // 跳过的记录数

//     const collection = db.collection('batteries'); // 替换为实际集合名称

//     try {
//         // 查询 Cell1 的数据
//         const query = { cell: 'Cell1' }; // 查询条件，仅返回 cell 字段为 'Cell1' 的记录
//         const data = await collection.find(query).skip(skip).limit(limit).toArray();
//         res.json(data); // 返回 JSON 数据
//     } catch (err) {
//         res.status(500).send(err.toString());
//     }
// });

// // 启动服务器
// app.listen(port, () => {
//     console.log(`API is running on http://localhost:${port}`);
// });
