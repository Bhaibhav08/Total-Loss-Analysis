const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const DATA_DIR = path.join(__dirname, "..", "data");

function readCsv(filename) {
    const filePath = path.join(DATA_DIR, filename);

    const fileContent = fs.readFileSync(filePath, "utf8");

    return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}

function getStores() {
    return readCsv("stores.csv");
}

function getProducts() {
    return readCsv("products.csv");
}

function getTransactions() {
    return readCsv("transactions.csv");
}

function getInventory() {
    return readCsv("inventory.csv");
}

module.exports = {
    getStores,
    getProducts,
    getTransactions,
    getInventory,
};