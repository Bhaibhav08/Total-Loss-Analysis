const express = require("express");

const {
    getStoreAIContext,
} = require("../services/ai-context.service");
const { 
    generateAIAnalysis, 
    executeAavaWorkflow, 
    getInventoryCsvString 
} = require("../services/aava.service");

const router = express.Router();

router.get("/context/:storeId", (req, res) => {
    try {
        const context = getStoreAIContext(req.params.storeId);

        if (!context) {
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        res.json({
            success: true,
            data: context,
        });
    } catch (error) {
        console.error("AI context error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to generate AI context",
        });
    }
});

// Endpoint to run AAVA workflow with custom uploaded CSV or store ID
router.post("/workflow/analyze", async (req, res) => {
    try {
        const { csvContent, storeId } = req.body || {};
        const result = await executeAavaWorkflow({ csvContent, storeId });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Workflow execution endpoint error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to execute AAVA workflow",
        });
    }
});

// Analyze store endpoint
router.all("/analyze/:storeId", async (req, res) => {
    try {
        const analysis = await generateAIAnalysis(req.params.storeId);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Store not found for AI analysis",
            });
        }

        res.json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error("AI analysis error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to complete AI analysis",
        });
    }
});

module.exports = router;
