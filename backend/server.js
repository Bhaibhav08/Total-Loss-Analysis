const express = require("express");
const cors = require("cors");
require("dotenv").config();

const dashboardRoutes = require("./routes/dashboard.routes");
const investigationRoutes =
    require("./routes/investigation.routes");
const baselineRoutes = require("./routes/baseline.routes");
const aiRoutes = require("./routes/ai.routes");
const dataRoutes = require("./routes/data.routes");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message:
            "Total Loss Intelligence API is running",
    });
});

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/investigations",
    investigationRoutes
);

app.use(
    "/api/baseline",
    baselineRoutes
);

app.use(
    "/api/ai",
    aiRoutes
);

app.use(
    "/api/data",
    dataRoutes
);

const aavaToolRoutes = require("./routes/aava-tool.routes");
app.use(
    "/api/aava-tool",
    aavaToolRoutes
);


if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(
            `Backend running on http://localhost:${PORT}`
        );
    });
}

module.exports = app;