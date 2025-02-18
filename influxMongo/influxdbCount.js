

//===================================1=======================
const Influx = require('influx');

const influx = new Influx.InfluxDB({
  host: 'localhost',
  port: 8086,
  database: 'AIML_06',
  // 增加 requestTimeout 以延長查詢超時（此為範例值，可自行調整）
  options: { requestTimeout: 300000 } // 5 分鐘
});

// 在使用此查詢前，請先在 Influx CLI (e.g. influx shell) 中測試，
// 確認能正常回傳結果且不會當機。若資料過於龐大，可考慮以下方法：
// 1. 使用更精簡的查詢（例如增加 time range filter）
// 2. 使用 InfluxDB 1.x 或確保 2.x 啟用 1.x 相容模式。
// 3. 若仍需 COUNT，大量資料可能需更久時間或更高資源，適度延長 requestTimeout。
const query = 'SELECT COUNT("voltage") AS total FROM "batteries"';

influx.query(query)
  .then(result => {
    if (result && result.length > 0) {
      console.log(`Total number of points in "batteries": ${result[0].total}`);
    } else {
      console.log('No results found.');
    }
  })
  .catch(err => {
    console.error('Error querying InfluxDB:', err);
  });
//=======================================2=======================================
// const Influx = require('influx');

// const influx = new Influx.InfluxDB({
//   host: 'localhost',
//   port: 8086,    // 根據你的實際主機位置修改
//   database: 'AIML_06'   // 資料庫名稱
// });

// // 選擇一個 field （例如 "voltage"）來計算筆數
// // COUNT("voltage") 會回傳該 measurement 中有幾筆資料點擁有此欄位
// const query = 'SELECT COUNT("voltage") AS total FROM "batteries"';

// influx.query(query)
//   .then(result => {
//     if (result && result.length > 0) {
//       console.log(`Total number of points in "batteries": ${result[0].total}`);
//     } else {
//       console.log('No results found.');
//     }
//   })
//   .catch(err => {
//     console.error('Error querying InfluxDB:', err);
//   });
