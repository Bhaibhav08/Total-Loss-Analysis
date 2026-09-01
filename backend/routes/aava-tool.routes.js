const express = require("express");
const { getNetworkAIContext, getStoreAIContext } = require("../services/ai-context.service");

const router = express.Router();

// Get full network context for AAVA agents
router.get("/network", (req, res) => {
    try {
        const context = getNetworkAIContext();
        res.json({
            success: true,
            data: context
        });
    } catch (error) {
        console.error("Error generating network AI context:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Get specific store context for AAVA agents
router.get("/store/:storeId", (req, res) => {
    try {
        const context = getStoreAIContext(req.params.storeId);
        if (!context) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        res.json({
            success: true,
            data: context
        });
    } catch (error) {
        console.error("Error generating store AI context:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
