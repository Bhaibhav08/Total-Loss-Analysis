const {
    getStores,
    getTransactions,
    getInventory,
} = require("./data.service");

function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}

function getBaseline() {
    const stores = getStores();
    const transactions = getTransactions();
    const inventory = getInventory();

    const storeMetrics = stores.map((store) => {
        const storeTransactions = transactions.filter(
            (transaction) =>
                transaction.store_id === store.store_id
        );

        const storeInventory = inventory.filter(
            (item) =>
                item.store_id === store.store_id
        );

        const totalTransactions =
            storeTransactions.length;

        const returns = storeTransactions.filter(
            (transaction) =>
                transaction.transaction_type === "RETURN"
        );

        const refunds = storeTransactions.filter(
            (transaction) =>
                transaction.transaction_type === "REFUND"
        );

        const returnRate =
            totalTransactions > 0
                ? (returns.length / totalTransactions) * 100
                : 0;

        const refundRate =
            totalTransactions > 0
                ? (refunds.length / totalTransactions) * 100
                : 0;

        const shrinkage = storeInventory.reduce(
            (total, item) =>
                total + number(item.discrepancy_value),
            0
        );

        return {
            store_id: store.store_id,
            return_rate: returnRate,
            refund_rate: refundRate,
            shrinkage,
        };
    });

    const averageReturnRate =
        storeMetrics.reduce(
            (sum, store) =>
                sum + store.return_rate,
            0
        ) / storeMetrics.length;

    const averageRefundRate =
        storeMetrics.reduce(
            (sum, store) =>
                sum + store.refund_rate,
            0
        ) / storeMetrics.length;

    const averageShrinkage =
        storeMetrics.reduce(
            (sum, store) =>
                sum + store.shrinkage,
            0
        ) / storeMetrics.length;

    return {
        average_return_rate:
            Number(averageReturnRate.toFixed(2)),

        average_refund_rate:
            Number(averageRefundRate.toFixed(2)),

        average_shrinkage:
            Math.round(averageShrinkage),

        stores_analyzed: stores.length,
    };
}

module.exports = {
    getBaseline,
};