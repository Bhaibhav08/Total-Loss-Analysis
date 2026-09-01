const express = require("express");

const {
    getDashboardSummary,
} = require("../services/loss.service");

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const summary =
            getDashboardSummary();

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to generate dashboard data",
        });
    }
});

module.exports = router;