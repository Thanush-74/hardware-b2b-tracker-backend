const dashboardService = require("../services/dashboardservice");

const getOverview = async (req, res) => {
    try {
        const metrics = await dashboardService.getExecutiveOverview();

        res.status(200).json({
            success: true,
            message: "Executive dashboard overview retrieved",
            data: metrics
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getManufacturingMetrics = async (req, res) => {
    try {
        const metrics = await dashboardService.getManufacturingDashboard();

        res.status(200).json({
            success: true,
            message: "Manufacturing metrics retrieved",
            data: metrics
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getInventoryMetrics = async (req, res) => {
    try {
        const metrics = await dashboardService.getInventoryDashboard();

        res.status(200).json({
            success: true,
            message: "Inventory metrics retrieved",
            data: metrics
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getQualityMetrics = async (req, res) => {
    try {
        const metrics = await dashboardService.getQualityDashboard();

        res.status(200).json({
            success: true,
            message: "Quality and inspection metrics retrieved",
            data: metrics
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getLogisticsMetrics = async (req, res) => {
    try {
        const metrics = await dashboardService.getLogisticsDashboard();

        res.status(200).json({
            success: true,
            message: "Logistics metrics retrieved",
            data: metrics
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getOverview,
    getManufacturingMetrics,
    getInventoryMetrics,
    getQualityMetrics,
    getLogisticsMetrics
};
