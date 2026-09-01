const express = require("express");

const {
    getInvestigations,
    getInvestigationByStore,
} = require("../services/investigation.service");

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const investigations =
            getInvestigations();

        res.json({
            success: true,
            count: investigations.length,
            data: investigations,
        });
    } catch (error) {
        console.error(
            "Investigation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to generate investigations",
        });
    }
});

router.get("/:storeId", (req, res) => {
    try {
        const investigation =
            getInvestigationByStore(
                req.params.storeId
            );

        if (!investigation) {
            return res.status(404).json({
                success: false,
                message:
                    "No investigation found for this store",
            });
        }

        res.json({
            success: true,
            data: investigation,
        });
    } catch (error) {
        console.error(
            "Store investigation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to generate store investigation",
        });
    }
});

module.exports = router;