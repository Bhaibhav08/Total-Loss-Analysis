const {
    getStores,
    getProducts,
    getTransactions,
    getInventory,
} = require("./data.service");

function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}

function getStoreAIContext(storeId) {
    const stores = getStores();
    const products = getProducts();
    const transactions = getTransactions();
    const inventory = getInventory();

    const store = stores.find(
        (item) => item.store_id === storeId
    );

    if (!store) {
        return null;
    }

    const storeTransactions = transactions.filter(
        (transaction) =>
            transaction.store_id === storeId
    );

    const storeInventory = inventory.filter(
        (item) =>
            item.store_id === storeId
    );

    const returnTransactions =
        storeTransactions.filter(
            (transaction) =>
                transaction.transaction_type === "RETURN"
        );

    const refundTransactions =
        storeTransactions.filter(
            (transaction) =>
                transaction.transaction_type === "REFUND"
        );

    const totalTransactions =
        storeTransactions.length;

    const returnRate =
        totalTransactions > 0
            ? (returnTransactions.length /
                totalTransactions) *
            100
            : 0;

    const refundRate =
        totalTransactions > 0
            ? (refundTransactions.length /
                totalTransactions) *
            100
            : 0;

    const returnValue =
        returnTransactions.reduce(
            (total, transaction) =>
                total +
                number(transaction.amount) *
                number(transaction.quantity),
            0
        );

    const refundValue =
        refundTransactions.reduce(
            (total, transaction) =>
                total +
                number(transaction.amount) *
                number(transaction.quantity),
            0
        );

    const shrinkageValue =
        storeInventory.reduce(
            (total, item) =>
                total +
                number(item.discrepancy_value),
            0
        );

    const discrepancyQuantity =
        storeInventory.reduce(
            (total, item) =>
                total +
                number(item.discrepancy_quantity),
            0
        );

    const totalLoss =
        returnValue +
        refundValue +
        shrinkageValue;

    // Product-level return analysis
    const productMap = new Map(
        products.map((product) => [
            product.product_id,
            product,
        ])
    );

    const productReturns = {};

    returnTransactions.forEach(
        (transaction) => {
            if (!productReturns[transaction.product_id]) {
                productReturns[transaction.product_id] = {
                    count: 0,
                    value: 0,
                };
            }

            productReturns[
                transaction.product_id
            ].count += number(transaction.quantity);

            productReturns[
                transaction.product_id
            ].value +=
                number(transaction.amount) *
                number(transaction.quantity);
        }
    );

    const topReturnedProducts = Object.entries(
        productReturns
    )
        .map(([productId, data]) => {
            const product =
                productMap.get(productId);

            return {
                product_id: productId,
                product_name:
                    product?.product_name || productId,
                category:
                    product?.category || "Unknown",
                return_count: data.count,
                return_value: Math.round(data.value),
            };
        })
        .sort(
            (a, b) =>
                b.return_value - a.return_value
        )
        .slice(0, 5);

    // Employee analysis
    const employeeActivity = {};

    storeTransactions.forEach(
        (transaction) => {
            const employeeId =
                transaction.employee_id;

            if (!employeeActivity[employeeId]) {
                employeeActivity[employeeId] = {
                    transactions: 0,
                    returns: 0,
                    refunds: 0,
                };
            }

            employeeActivity[employeeId]
                .transactions++;

            if (
                transaction.transaction_type ===
                "RETURN"
            ) {
                employeeActivity[employeeId]
                    .returns++;
            }

            if (
                transaction.transaction_type ===
                "REFUND"
            ) {
                employeeActivity[employeeId]
                    .refunds++;
            }
        }
    );

    const employeePatterns = Object.entries(
        employeeActivity
    )
        .map(([employeeId, data]) => ({
            employee_id: employeeId,
            ...data,
        }))
        .sort(
            (a, b) =>
                b.returns +
                b.refunds -
                (a.returns + a.refunds)
        );

    return {
        analysis_type: "TOTAL_LOSS_INVESTIGATION",

        store: {
            store_id: store.store_id,
            store_name: store.store_name,
            region: store.region,
        },

        financial_impact: {
            total_loss: Math.round(totalLoss),
            return_loss: Math.round(returnValue),
            refund_loss: Math.round(refundValue),
            shrinkage_loss: Math.round(
                shrinkageValue
            ),
        },

        transaction_metrics: {
            total_transactions: totalTransactions,
            return_count:
                returnTransactions.length,
            refund_count:
                refundTransactions.length,
            return_rate: Number(
                returnRate.toFixed(2)
            ),
            refund_rate: Number(
                refundRate.toFixed(2)
            ),
        },

        inventory_metrics: {
            discrepancy_quantity:
                discrepancyQuantity,
            discrepancy_value:
                Math.round(shrinkageValue),
        },

        top_returned_products:
            topReturnedProducts,

        employee_patterns:
            employeePatterns.slice(0, 5),

        instruction: `
You are the Total Loss Analyst for a retail organization.

Analyze the provided store-level loss intelligence.

Identify:
1. The most important loss drivers.
2. Unusual return or refund patterns.
3. Inventory discrepancies.
4. Products that require investigation.
5. Employee transaction patterns that may require review.
6. The likely business impact.
7. Recommended next actions.

Do not accuse employees or customers of fraud.
Use terms such as "suspicious", "unusual", "requires investigation", or "potential risk".

Return a concise management-ready investigation summary.
Separate observed facts from recommendations.
`,
    };
}

function getNetworkAIContext() {
    const stores = getStores();
    const products = getProducts();
    const transactions = getTransactions();
    const inventory = getInventory();

    const returnTransactions = transactions.filter(t => t.transaction_type === "RETURN");
    const refundTransactions = transactions.filter(t => t.transaction_type === "REFUND");

    const totalTransactions = transactions.length;

    const returnRate = totalTransactions > 0 ? (returnTransactions.length / totalTransactions) * 100 : 0;
    const refundRate = totalTransactions > 0 ? (refundTransactions.length / totalTransactions) * 100 : 0;

    const returnValue = returnTransactions.reduce((total, t) => total + number(t.amount) * number(t.quantity), 0);
    const refundValue = refundTransactions.reduce((total, t) => total + number(t.amount) * number(t.quantity), 0);
    const shrinkageValue = inventory.reduce((total, item) => total + number(item.discrepancy_value), 0);
    const discrepancyQuantity = inventory.reduce((total, item) => total + number(item.discrepancy_quantity), 0);

    const totalLoss = returnValue + refundValue + shrinkageValue;

    return {
        analysis_type: "NETWORK_TOTAL_LOSS",
        stores_analyzed: stores.length,
        financial_impact: {
            total_loss: Math.round(totalLoss),
            return_loss: Math.round(returnValue),
            refund_loss: Math.round(refundValue),
            shrinkage_loss: Math.round(shrinkageValue)
        },
        transaction_metrics: {
            total_transactions: totalTransactions,
            return_count: returnTransactions.length,
            refund_count: refundTransactions.length,
            return_rate: Number(returnRate.toFixed(2)),
            refund_rate: Number(refundRate.toFixed(2))
        },
        inventory_metrics: {
            discrepancy_quantity: discrepancyQuantity,
            discrepancy_value: Math.round(shrinkageValue)
        }
    };
}

module.exports = {
    getStoreAIContext,
    getNetworkAIContext
};