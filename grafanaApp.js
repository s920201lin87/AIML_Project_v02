const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3001;

app.use(express.json());

const uri = "mongodb://localhost:27017"; // 替換為你的 MongoDB 連接地址
const client = new MongoClient(uri);

app.post("/query", async (req, res) => {
  const { database, collection, query } = req.body;
  try {
    await client.connect();
    const db = client.db(database);
    const results = await db.collection(collection).find(query).toArray();
    res.json(results);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
