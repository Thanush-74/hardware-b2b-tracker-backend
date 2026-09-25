const stockService = require("../services/stockservice");

const getAll = async (req, res) => {
    try {
        const stocks = await stockService.getAllStocks(req.query);

        res.status(200).json({
            success: true,
            message: "Inventory stock retrieved successfully",
            data: stocks
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByProduct = async (req, res) => {
    try {
        const stock = await stockService.getStockByProductId(req.params.productId);

        res.status(200).json({
            success: true,
            message: "Product stock retrieved successfully",
            data: stock
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const adjust = async (req, res) => {
    try {
        const { product_id, quantity, type } = req.body;
        if (!product_id || quantity === undefined || !type) {
            return res.status(400).json({
                success: false,
                message: "product_id, quantity, and type (INWARD/OUTWARD/ADJUSTMENT/RESERVED/RELEASED) are required"
            });
        }

        const updatedStock = await stockService.adjustStock(req.body);

        res.status(200).json({
            success: true,
            message: "Stock adjusted successfully",
            data: updatedStock
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getMovements = async (req, res) => {
    try {
        const movements = await stockService.getStockMovements(req.query);

        res.status(200).json({
            success: true,
            message: "Stock movements retrieved successfully",
            data: movements
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getLowStock = async (req, res) => {
    try {
        const alerts = await stockService.getLowStockAlerts();

        res.status(200).json({
            success: true,
            message: "Low stock alerts retrieved successfully",
            data: alerts
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAll,
    getByProduct,
    adjust,
    getMovements,
    getLowStock
};
