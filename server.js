const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sequelize, connectDB } = require("./config/db");
// Initialize models and associations
require("./models");

// Import Routes
const authRoutes = require("./routes/authroute");
const employeeRoutes = require("./routes/employeeroute");
const productRoutes = require("./routes/productroute");
const stockRoutes = require("./routes/stockroute");
const cartRoutes = require("./routes/cartroute");
const orderRoutes = require("./routes/orderroute");
const manufacturingRoutes = require("./routes/manufactouringroute");
const assemblyRoutes = require("./routes/assemblyroute");
const inspectionRoutes = require("./routes/inspectionroute");
const traceabilityRoutes = require("./routes/traceabilityroute");
const deliveryRoutes = require("./routes/deliveryroute");
const returnRoutes = require("./routes/returnandreplacementroute");
const dashboardRoutes = require("./routes/dashboardroute");

// Import Middlewares
const { notFoundHandler, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health Check Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Hardware B2B Tracker API is operational",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/manufacturing", manufacturingRoutes);
app.use("/api/assembly", assemblyRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/traceability", traceabilityRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize Server and Database Connection
const startServer = async () => {
    try {
        await connectDB();

        // Sync models if needed in development:
        // await sequelize.sync({ alter: true });

        app.listen(PORT, () => {
            console.log(`Hardware B2B Tracker Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;