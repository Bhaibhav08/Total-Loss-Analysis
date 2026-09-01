const {
    getStores,
    getProducts,
    getTransactions,
    getInventory,
} = require("./data.service");

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

function getDashboardSummary() {
    const stores = getStores();
    const products = getProducts();
    const transactions = getTransactions();
    const inventory = getInventory();

    const productMap = new Map(
        products.map((product) => [
            product.product_id,
            product,
        ])
    );

    let returnLoss = 0;
    let refundLoss = 0;

    const returnTransactions = transactions.filter(
        (transaction) =>
            transaction.transaction_type === "RETURN"
    );

    const refundTransactions = transactions.filter(
        (transaction) =>
            transaction.transaction_type === "REFUND"
    );

    returnTransactions.forEach((transaction) => {
        returnLoss +=
            toNumber(transaction.amount) *
            toNumber(transaction.quantity);
    });

    refundTransactions.forEach((transaction) => {
        refundLoss +=
            toNumber(transaction.amount) *
            toNumber(transaction.quantity);
    });

    let shrinkLoss = 0;

    inventory.forEach((item) => {
        shrinkLoss += toNumber(item.discrepancy_value);
    });

    const totalLoss =
        returnLoss +
        refundLoss +
        shrinkLoss;

    const storeLossMap = new Map();

    inventory.forEach((item) => {
        const value = toNumber(item.discrepancy_value);

        const current =
            storeLossMap.get(item.store_id) || 0;

        storeLossMap.set(
            item.store_id,
            current + value
        );
    });

    returnTransactions.forEach((transaction) => {
        const value =
            toNumber(transaction.amount) *
            toNumber(transaction.quantity);

        const current =
            storeLossMap.get(transaction.store_id) || 0;

        storeLossMap.set(
            transaction.store_id,
            current + value
        );
    });

    refundTransactions.forEach((transaction) => {
        const value =
            toNumber(transaction.amount) *
            toNumber(transaction.quantity);

        const current =
            storeLossMap.get(transaction.store_id) || 0;

        storeLossMap.set(
            transaction.store_id,
            current + value
        );
    });

    const topStores = Array.from(
        storeLossMap.entries()
    )
        .map(([storeId, loss]) => {
            const store = stores.find(
                (item) => item.store_id === storeId
            );

            return {
                store_id: storeId,
                store_name:
                    store?.store_name || storeId,
                loss: Math.round(loss),
            };
        })
        .sort((a, b) => b.loss - a.loss)
        .slice(0, 5);

    const productReturnMap = new Map();

    returnTransactions.forEach((transaction) => {
        const current =
            productReturnMap.get(
                transaction.product_id
            ) || {
                returns: 0,
                amount: 0,
            };

        current.returns += toNumber(
            transaction.quantity
        );

        current.amount +=
            toNumber(transaction.amount) *
            toNumber(transaction.quantity);

        productReturnMap.set(
            transaction.product_id,
            current
        );
    });

    const topReturnProducts = Array.from(
        productReturnMap.entries()
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
                return_count: data.returns,
                return_value: Math.round(data.amount),
            };
        })
        .sort(
            (a, b) =>
                b.return_value - a.return_value
        )
        .slice(0, 5);

    return {
        total_loss: Math.round(totalLoss),

        loss_breakdown: {
            returns: Math.round(returnLoss),
            refunds: Math.round(refundLoss),
            shrinkage: Math.round(shrinkLoss),
        },

        counts: {
            stores: stores.length,
            products: products.length,
            transactions: transactions.length,
            inventory_records: inventory.length,
        },

        top_loss_stores: topStores,

        top_return_products: topReturnProducts,
    };
}

function getStoreAnalysis(storeId) {
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

    const storeTransactions =
        transactions.filter(
            (transaction) =>
                transaction.store_id === storeId
        );

    const storeInventory =
        inventory.filter(
            (item) =>
                item.store_id === storeId
        );

    let returnLoss = 0;
    let refundLoss = 0;

    let returnCount = 0;
    let refundCount = 0;

    storeTransactions.forEach(
        (transaction) => {
            const amount =
                toNumber(transaction.amount) *
                toNumber(transaction.quantity);

            if (
                transaction.transaction_type ===
                "RETURN"
            ) {
                returnLoss += amount;
                returnCount += toNumber(
                    transaction.quantity
                );
            }

            if (
                transaction.transaction_type ===
                "REFUND"
            ) {
                refundLoss += amount;
                refundCount += toNumber(
                    transaction.quantity
                );
            }
        }
    );

    let shrinkLoss = 0;
    let discrepancyQuantity = 0;

    storeInventory.forEach((item) => {
        shrinkLoss += toNumber(
            item.discrepancy_value
        );

        discrepancyQuantity += toNumber(
            item.discrepancy_quantity
        );
    });

    const totalLoss =
        returnLoss +
        refundLoss +
        shrinkLoss;

    const productMap = new Map(
        products.map((product) => [
            product.product_id,
            product,
        ])
    );

    const suspiciousProducts = [];

    storeTransactions
        .filter(
            (transaction) =>
                transaction.transaction_type ===
                "RETURN"
        )
        .forEach((transaction) => {
            const product =
                productMap.get(
                    transaction.product_id
                );

            suspiciousProducts.push({
                product_id:
                    transaction.product_id,
                product_name:
                    product?.product_name ||
                    transaction.product_id,
                amount: Math.round(
                    toNumber(transaction.amount)
                ),
            });
        });

    return {
        store,
        total_loss: Math.round(totalLoss),

        loss_breakdown: {
            returns: Math.round(returnLoss),
            refunds: Math.round(refundLoss),
            shrinkage: Math.round(shrinkLoss),
        },

        return_count: returnCount,
        refund_count: refundCount,
        discrepancy_quantity:
            discrepancyQuantity,

        inventory_records:
            storeInventory.length,

        return_transactions:
            suspiciousProducts.slice(0, 20),
    };
}

module.exports = {
    getDashboardSummary,
    getStoreAnalysis,
};