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

function calculateRiskScore({
    returnRate,
    refundRate,
    shrinkageValue,
}) {
    let score = 0;

    // High return activity
    if (returnRate >= 20) {
        score += 35;
    } else if (returnRate >= 10) {
        score += 20;
    } else if (returnRate >= 5) {
        score += 10;
    }

    // High refund activity
    if (refundRate >= 10) {
        score += 30;
    } else if (refundRate >= 5) {
        score += 20;
    } else if (refundRate >= 2) {
        score += 10;
    }

    // Inventory discrepancy
    if (shrinkageValue >= 50000) {
        score += 35;
    } else if (shrinkageValue >= 25000) {
        score += 25;
    } else if (shrinkageValue >= 10000) {
        score += 15;
    }

    return Math.min(score, 100);
}

function getInvestigations() {
    const stores = getStores();
    const products = getProducts();
    const transactions = getTransactions();
    const inventory = getInventory();

    const investigations = [];

    for (const store of stores) {
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

        let returnValue = 0;
        let refundValue = 0;
        let shrinkageValue = 0;
        let discrepancyQuantity = 0;

        returnTransactions.forEach(
            (transaction) => {
                returnValue +=
                    number(transaction.amount) *
                    number(transaction.quantity);
            }
        );

        refundTransactions.forEach(
            (transaction) => {
                refundValue +=
                    number(transaction.amount) *
                    number(transaction.quantity);
            }
        );

        storeInventory.forEach((item) => {
            shrinkageValue += number(
                item.discrepancy_value
            );

            discrepancyQuantity += number(
                item.discrepancy_quantity
            );
        });

        const totalLoss =
            returnValue +
            refundValue +
            shrinkageValue;

        const riskScore = calculateRiskScore({
            returnRate,
            refundRate,
            shrinkageValue,
        });

        let riskLevel = "LOW";

        if (riskScore >= 70) {
            riskLevel = "CRITICAL";
        } else if (riskScore >= 45) {
            riskLevel = "HIGH";
        } else if (riskScore >= 20) {
            riskLevel = "MEDIUM";
        }

        const reasons = [];

        if (returnRate >= 10) {
            reasons.push(
                `High return rate of ${returnRate.toFixed(
                    1
                )}%`
            );
        }

        if (refundRate >= 5) {
            reasons.push(
                `Elevated refund rate of ${refundRate.toFixed(
                    1
                )}%`
            );
        }

        if (shrinkageValue >= 10000) {
            reasons.push(
                `Inventory discrepancy worth ₹${Math.round(
                    shrinkageValue
                ).toLocaleString("en-IN")}`
            );
        }

        if (reasons.length === 0) {
            continue;
        }

        investigations.push({
            store_id: store.store_id,
            store_name: store.store_name,
            region: store.region,

            risk_score: riskScore,
            risk_level: riskLevel,

            total_loss: Math.round(totalLoss),

            loss_breakdown: {
                returns: Math.round(returnValue),
                refunds: Math.round(refundValue),
                shrinkage: Math.round(shrinkageValue),
            },

            metrics: {
                total_transactions: totalTransactions,
                return_count: returnTransactions.length,
                refund_count: refundTransactions.length,
                return_rate: Number(
                    returnRate.toFixed(2)
                ),
                refund_rate: Number(
                    refundRate.toFixed(2)
                ),
                discrepancy_quantity:
                    discrepancyQuantity,
            },

            reasons,

            recommended_actions: [
                "Review recent return and refund transactions.",
                "Verify inventory counts for high-risk products.",
                "Check employee activity associated with unusual transactions.",
                "Investigate repeated patterns before approving further refunds.",
            ],
        });
    }

    return investigations.sort(
        (a, b) =>
            b.risk_score - a.risk_score
    );
}

function getInvestigationByStore(storeId) {
    const investigations =
        getInvestigations();

    return (
        investigations.find(
            (item) =>
                item.store_id === storeId
        ) || null
    );
}

module.exports = {
    getInvestigations,
    getInvestigationByStore,
};