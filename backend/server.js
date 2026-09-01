const express = require("express");
const cors = require("cors");
require("dotenv").config();

const dashboardRoutes = require("./routes/dashboard.routes");
const investigationRoutes = require("./routes/investigation.routes");
const baselineRoutes = require("./routes/baseline.routes");
const aiRoutes = require("./routes/ai.routes");
const dataRoutes = require("./routes/data.routes");
const aavaToolRoutes = require("./routes/aava-tool.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get(["/api/health", "/health"], (req, res) => {
    res.json({
        success: true,
        message: "Total Loss Intelligence API is running",
    });
});

// Mount routes for both standard server and Vercel serverless rewrites
app.use(["/api/dashboard", "/dashboard"], dashboardRoutes);
app.use(["/api/investigations", "/investigations"], investigationRoutes);
app.use(["/api/baseline", "/baseline"], baselineRoutes);
app.use(["/api/ai", "/ai"], aiRoutes);
app.use(["/api/data", "/data"], dataRoutes);
app.use(["/api/aava-tool", "/aava-tool"], aavaToolRoutes);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;