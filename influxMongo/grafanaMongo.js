const express = require('express');
const MongoClient = require('mongodb').MongoClient; // 引入舊版的 MongoClient
const app = express();
const port = 5000;

// MongoDB 連接 URL 和資料庫名稱
const url = 'mongodb://localhost:27017'; // 替換為你的 MongoDB 連接 URL
const dbName = 'Data';                   // 替換為你的資料庫名稱
let db;                                  // 用於儲存 MongoDB 資料庫連接

// 1. 連接 MongoDB (舊版用 callback)
MongoClient.connect(url, (err, client) => { // 移除 useUnifiedTopology 參數
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // 連接失敗時退出程式
  }

  console.log('Connected to MongoDB');
  db = client.db(dbName); // 將資料庫連接儲存到變數中
});

// 2. 根路由處理，返回簡單的消息
app.get('/', (req, res) => {
  res.send('Hello World!'); // 返回 "Hello World" 作為首頁響應
});

// 3. 從 MongoDB 獲取資料並返回 JSON
app.get('/data', (req, res) => {
  if (!db) {
    return res.status(500).send('Database connection is not ready yet');
  }

  const collection = db.collection('batteries'); // 替換為你的集合名稱

  // 使用 callback 查詢資料
  collection.find({}).limit(20).toArray((err, data) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Error fetching data');
    }

    res.json(data); // 返回 MongoDB 中的資料作為 JSON
  });
});

// 4. 啟動伺服器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
