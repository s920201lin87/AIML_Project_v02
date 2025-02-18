const express = require('express');
const MongoClient = require('mongodb').MongoClient; // 正確的引入方式
const app = express();
const port = 5000;

// MongoDB 連接 URL 和資料庫名稱
const url = 'mongodb://localhost:27017'; // 替換為你的 MongoDB 連接 URL
const dbName = 'Data';    // 替換為你的資料庫名稱

// 創建 MongoDB 客戶端
const client = new MongoClient(url);

// 根路由處理，返回簡單的消息
app.get('/', (req, res) => {
  res.send('Hello World!');  // 返回 "Hello World" 作為首頁響應
});

// 當 API 被請求時，從 MongoDB 讀取資料並返回 JSON
app.get('/data', (req, res) => {
  client.connect((err) => {
    if (err) {
      console.error('Failed to connect to the database', err);
      return res.status(500).send('Error connecting to the database');
    }

    const db = client.db(dbName);
    const collection = db.collection('batteries'); // 替換為你的集合名稱

    collection.find().limit(20).toArray((err, data) => {
      if (err) {
        console.error('Error fetching data', err);
        return res.status(500).send('Error fetching data');
      }

      res.json(data);  // 返回資料作為 JSON 格式
    });
  });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
