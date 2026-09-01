const express = require("express");

const {
    getBaseline,
} = require("../services/baseline.service");

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const baseline = getBaseline();

        res.json({
            success: true,
            data: baseline,
        });
    } catch (error) {
        console.error(
            "Baseline error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to calculate retail baseline",
        });
    }
});

module.exports = router;