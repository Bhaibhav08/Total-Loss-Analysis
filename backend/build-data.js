const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const DATA_DIR = path.join(__dirname, "data");

function read(filename) {
    const p = path.join(DATA_DIR, filename);
    return parse(fs.readFileSync(p, "utf8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}

const stores = read("stores.csv");
const products = read("products.csv");
const transactions = read("transactions.csv");
const inventory = read("inventory.csv");

const outContent = `// Pre-bundled static dataset for zero-latency serverless deployment
module.exports = {
  stores: ${JSON.stringify(stores, null, 2)},
  products: ${JSON.stringify(products, null, 2)},
  transactions: ${JSON.stringify(transactions, null, 2)},
  inventory: ${JSON.stringify(inventory, null, 2)}
};
`;

fs.writeFileSync(path.join(__dirname, "data", "embedded-data.js"), outContent);
console.log("embedded-data.js generated successfully!");
