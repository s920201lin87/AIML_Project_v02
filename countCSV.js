const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 資料夾結構
const BASE_DIR = path.join(__dirname, 'data'); // data 根目錄
const CELL_FOLDERS = ['Cell1', 'Cell2', 'Cell3', 'Cell4', 'Cell5', 'Cell6', 'Cell7', 'Cell8'];
const FILE_TYPES = ['C1ch.csv', 'C1dc.csv', 'OCVch.csv', 'OCVdc.csv']; // CSV 檔案名稱

// 檢查所有 CSV 檔案總共有幾列（扣除欄位名稱）並檢查是否有缺失值或空白行
async function countTotalRowsAndValidate() {
    let totalRows = 0;
    let invalidRows = 0;
    let columnsWithMissingValues = { Time: 0, Voltage: 0, Charge: 0, Temperature: 0 };

    for (const cell of CELL_FOLDERS) {
        const cellPath = path.join(BASE_DIR, cell);

        // 檢查 Cell 資料夾是否存在
        if (!fs.existsSync(cellPath)) {
            console.error(`Cell folder not found: ${cell}`);
            continue;
        }

        const cycFolders = fs.readdirSync(cellPath).filter((folder) => folder.startsWith('cyc'));

        for (const cyc of cycFolders) {
            const cycPath = path.join(cellPath, cyc);

            for (const fileType of FILE_TYPES) {
                const filePath = path.join(cycPath, fileType);

                // 檢查 CSV 檔案是否存在
                if (!fs.existsSync(filePath)) {
                    console.warn(`File not found: ${filePath}`);
                    continue;
                }

                console.log(`Processing file: ${filePath}`);

                // 流式讀取 CSV 檔案，計算行數並檢查資料完整性
                await new Promise((resolve, reject) => {
                    let rowCount = 0;

                    fs.createReadStream(filePath)
                        .pipe(csv(['Time', 'Voltage', 'Charge', 'Temperature']))
                        .on('data', (row) => {
                            rowCount++;

                            // 檢查是否有缺失值或空白欄位
                            let hasMissingValue = false;
                            if (!row.Time) {
                                columnsWithMissingValues.Time++;
                                hasMissingValue = true;
                            }
                            if (!row.Voltage) {
                                columnsWithMissingValues.Voltage++;
                                hasMissingValue = true;
                            }
                            if (!row.Charge) {
                                columnsWithMissingValues.Charge++;
                                hasMissingValue = true;
                            }
                            if (!row.Temperature) {
                                columnsWithMissingValues.Temperature++;
                                hasMissingValue = true;
                            }

                            if (hasMissingValue) {
                                console.warn(`Invalid row in ${filePath}: ${JSON.stringify(row)}`);
                                invalidRows++;
                            }
                        })
                        .on('end', () => {
                            totalRows += rowCount - 1; // 扣除欄位名稱
                            console.log(`${filePath}: ${rowCount - 1} valid rows, ${invalidRows} invalid rows so far`);
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error(`Error reading file: ${filePath}`, err);
                            reject(err);
                        });
                });
            }
        }
    }

    console.log(`Total valid rows across all CSV files: ${totalRows}`);
    console.log(`Total invalid rows across all CSV files: ${invalidRows}`);
    console.log(`Columns with missing values: ${JSON.stringify(columnsWithMissingValues)}`);
}

// 主程序
(async () => {
    try {
        await countTotalRowsAndValidate();
    } catch (err) {
        console.error("Error during row counting and validation:", err);
    } finally {
        process.exit();
    }
})();
