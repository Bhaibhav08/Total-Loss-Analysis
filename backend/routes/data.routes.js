const express = require("express");
const {
    getTransactions,
    getInventory,
    getProducts,
} = require("../services/data.service");

const router = express.Router();

router.get("/transactions", (req, res) => {
    try {
        const transactions = getTransactions();
        res.json({
            success: true,
            count: transactions.length,
            data: transactions.slice(0, 100), // Return top 100 for fast UI loading
        });
    } catch (error) {
        console.error("Transactions endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load transactions data",
        });
    }
});

router.get("/inventory", (req, res) => {
    try {
        const inventory = getInventory();
        res.json({
            success: true,
            count: inventory.length,
            data: inventory,
        });
    } catch (error) {
        console.error("Inventory endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load inventory data",
        });
    }
});

router.get("/products", (req, res) => {
    try {
        const products = getProducts();
        res.json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error("Products endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load products data",
        });
    }
});

router.get("/export/:storeId", (req, res) => {
    try {
        const storeId = req.params.storeId;
        const transactions = getTransactions().filter(t => t.store_id === storeId);
        const inventory = getInventory().filter(i => i.store_id === storeId);
        const products = getProducts();

        let csvData = "=== TRANSACTIONS ===\n";
        if (transactions.length > 0) {
            const txKeys = Object.keys(transactions[0]);
            csvData += txKeys.join(",") + "\n";
            transactions.forEach(tx => {
                csvData += txKeys.map(k => `"${tx[k] || ''}"`).join(",") + "\n";
            });
        } else {
            csvData += "No transactions found.\n";
        }

        csvData += "\n=== INVENTORY ===\n";
        if (inventory.length > 0) {
            const invKeys = Object.keys(inventory[0]);
            csvData += invKeys.join(",") + "\n";
            inventory.forEach(inv => {
                csvData += invKeys.map(k => `"${inv[k] || ''}"`).join(",") + "\n";
            });
        } else {
            csvData += "No inventory records found.\n";
        }

        csvData += "\n=== PRODUCTS ===\n";
        if (products.length > 0) {
            const prodKeys = Object.keys(products[0]);
            csvData += prodKeys.join(",") + "\n";
            products.forEach(prod => {
                csvData += prodKeys.map(k => `"${prod[k] || ''}"`).join(",") + "\n";
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Store_${storeId}_Data.csv"`);
        res.send(csvData);

    } catch (error) {
        console.error("Export endpoint error:", error);
        res.status(500).send("Unable to generate export data");
    }
});

module.exports = router;
