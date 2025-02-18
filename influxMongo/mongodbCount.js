const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'Data';
const collectionName = 'batteries';

MongoClient.connect(url, function(err, client) {
  if (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  console.log('Connected to MongoDB');
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // 取得集合總筆數
  collection.count({}, function(err, count) {
    if (err) {
      console.error('Error counting documents:', err);
    } else {
      console.log(`Total number of documents in "${collectionName}": ${count}`);
    }

    // 顯示完畢後關閉連線
    client.close();
  });
});
