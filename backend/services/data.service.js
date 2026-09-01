const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const embedded = require("../data/embedded-data");

const DATA_DIR = path.join(__dirname, "..", "data");

function readCsv(filename, fallbackKey) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8");
            return parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        }
    } catch (e) {
        console.warn(`[Data Service] Falling back to embedded dataset for ${filename}:`, e.message);
    }

    // Serverless-safe embedded fallback
    return embedded[fallbackKey] || [];
}

function getStores() {
    return readCsv("stores.csv", "stores");
}

function getProducts() {
    return readCsv("products.csv", "products");
}

function getTransactions() {
    return readCsv("transactions.csv", "transactions");
}

function getInventory() {
    return readCsv("inventory.csv", "inventory");
}

module.exports = {
    getStores,
    getProducts,
    getTransactions,
    getInventory,
};