const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// --------------------------------------------------
// Helper functions
// --------------------------------------------------

function writeCsv(filename, headers, rows) {
    const content = [
        headers.join(","),
        ...rows.map((row) =>
            headers
                .map((header) => {
                    const value = row[header] ?? "";
                    const stringValue = String(value);

                    if (
                        stringValue.includes(",") ||
                        stringValue.includes('"') ||
                        stringValue.includes("\n")
                    ) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }

                    return stringValue;
                })
                .join(",")
        ),
    ].join("\n");

    fs.writeFileSync(path.join(dataDir, filename), content, "utf8");
}

// --------------------------------------------------
// Stores
// --------------------------------------------------

const stores = [
    {
        store_id: "S001",
        store_name: "Mumbai Central",
        region: "West",
    },
    {
        store_id: "S002",
        store_name: "Delhi Select City",
        region: "North",
    },
    {
        store_id: "S003",
        store_name: "Bangalore Forum",
        region: "South",
    },
    {
        store_id: "S004",
        store_name: "Chennai Express",
        region: "South",
    },
    {
        store_id: "S005",
        store_name: "Hyderabad Central",
        region: "South",
    },
    {
        store_id: "S006",
        store_name: "Pune Phoenix",
        region: "West",
    },
    {
        store_id: "S007",
        store_name: "Kolkata Square",
        region: "East",
    },
    {
        store_id: "S008",
        store_name: "Ahmedabad One",
        region: "West",
    },
    {
        store_id: "S009",
        store_name: "Jaipur Central",
        region: "North",
    },
    {
        store_id: "S010",
        store_name: "Noida Mall",
        region: "North",
    },
    {
        store_id: "S011",
        store_name: "Gurgaon Select",
        region: "North",
    },
    {
        store_id: "S012",
        store_name: "Bangalore Tech Park",
        region: "South",
    },
];

// --------------------------------------------------
// Products
// --------------------------------------------------

const products = [
    {
        product_id: "P101",
        product_name: "Premium Running Shoes",
        category: "Footwear",
        unit_price: 4999,
        unit_cost: 2800,
    },
    {
        product_id: "P102",
        product_name: "Classic Denim Jacket",
        category: "Apparel",
        unit_price: 3499,
        unit_cost: 1900,
    },
    {
        product_id: "P103",
        product_name: "Smart Fitness Watch",
        category: "Electronics",
        unit_price: 7999,
        unit_cost: 5100,
    },
    {
        product_id: "P104",
        product_name: "Wireless Earbuds Pro",
        category: "Electronics",
        unit_price: 5999,
        unit_cost: 3600,
    },
    {
        product_id: "P105",
        product_name: "Leather Backpack",
        category: "Accessories",
        unit_price: 2999,
        unit_cost: 1600,
    },
    {
        product_id: "P106",
        product_name: "Cotton Casual Shirt",
        category: "Apparel",
        unit_price: 1499,
        unit_cost: 750,
    },
    {
        product_id: "P107",
        product_name: "Sports Hoodie",
        category: "Apparel",
        unit_price: 2299,
        unit_cost: 1200,
    },
    {
        product_id: "P108",
        product_name: "Bluetooth Speaker",
        category: "Electronics",
        unit_price: 3999,
        unit_cost: 2300,
    },
    {
        product_id: "P109",
        product_name: "Travel Sneakers",
        category: "Footwear",
        unit_price: 3299,
        unit_cost: 1800,
    },
    {
        product_id: "P110",
        product_name: "Polarized Sunglasses",
        category: "Accessories",
        unit_price: 1999,
        unit_cost: 950,
    },
];

// --------------------------------------------------
// Transactions
// --------------------------------------------------

const transactions = [];

const transactionTypes = [
    "SALE",
    "SALE",
    "SALE",
    "SALE",
    "RETURN",
    "REFUND",
    "VOID",
    "DISCOUNT",
];

const employees = [
    "E001",
    "E002",
    "E003",
    "E004",
    "E005",
    "E006",
];

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function randomDate() {
    const start = new Date("2026-08-01T00:00:00");
    const end = new Date("2026-08-28T23:59:59");

    const date = new Date(
        start.getTime() +
        Math.random() * (end.getTime() - start.getTime())
    );

    return date.toISOString().slice(0, 10);
}

let transactionCounter = 1;

// Normal transaction data
for (let i = 0; i < 500; i++) {
    const store = randomItem(stores);
    const product = randomItem(products);

    const transactionType = randomItem(transactionTypes);

    let amount = product.unit_price;

    if (transactionType === "DISCOUNT") {
        amount = Math.round(product.unit_price * 0.8);
    }

    transactions.push({
        transaction_id: `T${String(transactionCounter++).padStart(5, "0")}`,
        date: randomDate(),
        store_id: store.store_id,
        product_id: product.product_id,
        transaction_type: transactionType,
        amount,
        quantity: 1,
        employee_id: randomItem(employees),
        customer_id: `C${String(
            Math.floor(Math.random() * 200) + 1
        ).padStart(4, "0")}`,
    });
}

// --------------------------------------------------
// INTENTIONAL ANOMALY #1
// Store S012 has excessive returns
// --------------------------------------------------

for (let i = 0; i < 60; i++) {
    const product =
        i % 2 === 0
            ? products.find((p) => p.product_id === "P104")
            : products.find((p) => p.product_id === "P103");

    transactions.push({
        transaction_id: `T${String(transactionCounter++).padStart(5, "0")}`,
        date: randomDate(),
        store_id: "S012",
        product_id: product.product_id,
        transaction_type: "RETURN",
        amount: product.unit_price,
        quantity: 1,
        employee_id: "E006",
        customer_id: `C${String(
            Math.floor(Math.random() * 30) + 1
        ).padStart(4, "0")}`,
    });
}

// --------------------------------------------------
// INTENTIONAL ANOMALY #2
// Store S007 has unusual high-value refunds
// --------------------------------------------------

for (let i = 0; i < 25; i++) {
    const product = products.find(
        (p) => p.product_id === "P103"
    );

    transactions.push({
        transaction_id: `T${String(transactionCounter++).padStart(5, "0")}`,
        date: randomDate(),
        store_id: "S007",
        product_id: product.product_id,
        transaction_type: "REFUND",
        amount: product.unit_price,
        quantity: 1,
        employee_id: "E005",
        customer_id: `C${String(
            Math.floor(Math.random() * 20) + 1
        ).padStart(4, "0")}`,
    });
}

// --------------------------------------------------
// Inventory
// --------------------------------------------------

const inventory = [];

let inventoryCounter = 1;

for (const store of stores) {
    for (const product of products) {
        const expectedQuantity =
            Math.floor(Math.random() * 80) + 40;

        let actualQuantity =
            expectedQuantity - Math.floor(Math.random() * 3);

        // ------------------------------------------------
        // INTENTIONAL ANOMALY #3
        // Store S012 has large inventory discrepancies
        // ------------------------------------------------

        if (store.store_id === "S012") {
            actualQuantity =
                expectedQuantity -
                (Math.floor(Math.random() * 10) + 8);
        }

        inventory.push({
            inventory_id: `INV${String(
                inventoryCounter++
            ).padStart(5, "0")}`,
            date: "2026-08-28",
            store_id: store.store_id,
            product_id: product.product_id,
            expected_quantity: expectedQuantity,
            actual_quantity: actualQuantity,
            unit_cost: product.unit_cost,
            discrepancy_quantity:
                expectedQuantity - actualQuantity,
            discrepancy_value:
                (expectedQuantity - actualQuantity) *
                product.unit_cost,
        });
    }
}

// --------------------------------------------------
// Write files
// --------------------------------------------------

writeCsv(
    "stores.csv",
    ["store_id", "store_name", "region"],
    stores
);

writeCsv(
    "products.csv",
    [
        "product_id",
        "product_name",
        "category",
        "unit_price",
        "unit_cost",
    ],
    products
);

writeCsv(
    "transactions.csv",
    [
        "transaction_id",
        "date",
        "store_id",
        "product_id",
        "transaction_type",
        "amount",
        "quantity",
        "employee_id",
        "customer_id",
    ],
    transactions
);

writeCsv(
    "inventory.csv",
    [
        "inventory_id",
        "date",
        "store_id",
        "product_id",
        "expected_quantity",
        "actual_quantity",
        "unit_cost",
        "discrepancy_quantity",
        "discrepancy_value",
    ],
    inventory
);

console.log("======================================");
console.log("Retail dataset generated successfully");
console.log("======================================");
console.log(`Stores: ${stores.length}`);
console.log(`Products: ${products.length}`);
console.log(`Transactions: ${transactions.length}`);
console.log(`Inventory records: ${inventory.length}`);
console.log("");
console.log("Files created:");
console.log("- data/stores.csv");
console.log("- data/products.csv");
console.log("- data/transactions.csv");
console.log("- data/inventory.csv");
console.log("");
console.log("Intentional scenarios:");
console.log("1. Store S012 has unusually high returns.");
console.log("2. Store S007 has unusually high-value refunds.");
console.log("3. Store S012 has large inventory discrepancies.");