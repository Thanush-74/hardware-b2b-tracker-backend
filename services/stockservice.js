const { Stock, StockMovement, Product } = require("../models");
const { Op } = require("sequelize");

const getAllStocks = async (query = {}) => {
    const where = {};

    if (query.warehouse_location) {
        where.warehouse_location = query.warehouse_location;
    }

    const stocks = await Stock.findAll({
        where,
        include: [{ model: Product, as: "product" }],
        order: [["updated_at", "DESC"]]
    });

    return stocks;
};

const getStockByProductId = async (productId) => {
    const stock = await Stock.findOne({
        where: { product_id: productId },
        include: [{ model: Product, as: "product" }]
    });

    if (!stock) {
        const error = new Error("Stock record not found for this product");
        error.statusCode = 404;
        throw error;
    }

    return stock;
};

const adjustStock = async (adjustmentData) => {
    const { product_id, quantity, type, reason, reference_id, warehouse_location } = adjustmentData;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
        const error = new Error("Quantity must be a positive integer");
        error.statusCode = 400;
        throw error;
    }

    let stock = await Stock.findOne({ where: { product_id } });
    if (!stock) {
        stock = await Stock.create({
            product_id,
            warehouse_location: warehouse_location || "Warehouse-A / Section-1",
            quantity_on_hand: 0,
            reserved_quantity: 0
        });
    }

    if (type === "INWARD") {
        stock.quantity_on_hand += parsedQty;
    } else if (type === "OUTWARD") {
        if (stock.quantity_on_hand < parsedQty) {
            const error = new Error(`Insufficient stock. Available: ${stock.quantity_on_hand}`);
            error.statusCode = 400;
            throw error;
        }
        stock.quantity_on_hand -= parsedQty;
    } else if (type === "RESERVED") {
        if (stock.quantity_on_hand < parsedQty) {
            const error = new Error(`Cannot reserve. Available: ${stock.quantity_on_hand}`);
            error.statusCode = 400;
            throw error;
        }
        stock.quantity_on_hand -= parsedQty;
        stock.reserved_quantity += parsedQty;
    } else if (type === "RELEASED") {
        if (stock.reserved_quantity < parsedQty) {
            const error = new Error(`Cannot release. Reserved: ${stock.reserved_quantity}`);
            error.statusCode = 400;
            throw error;
        }
        stock.reserved_quantity -= parsedQty;
        stock.quantity_on_hand += parsedQty;
    } else if (type === "ADJUSTMENT") {
        stock.quantity_on_hand = parsedQty;
    } else {
        const error = new Error("Invalid stock movement type");
        error.statusCode = 400;
        throw error;
    }

    if (warehouse_location) {
        stock.warehouse_location = warehouse_location;
    }

    await stock.save();

    await StockMovement.create({
        product_id,
        type,
        quantity: parsedQty,
        reason: reason || "Manual stock adjustment",
        reference_id: reference_id || `ADJ-${Date.now()}`
    });

    const updatedStock = await Stock.findOne({
        where: { product_id },
        include: [{ model: Product, as: "product" }]
    });

    return updatedStock;
};

const getStockMovements = async (query = {}) => {
    const where = {};

    if (query.product_id) {
        where.product_id = query.product_id;
    }
    if (query.type) {
        where.type = query.type;
    }

    const movements = await StockMovement.findAll({
        where,
        include: [{ model: Product, as: "product" }],
        order: [["created_at", "DESC"]]
    });

    return movements;
};

const getLowStockAlerts = async () => {
    const lowStocks = await Stock.findAll({
        where: {
            quantity_on_hand: {
                [Op.lte]: Stock.sequelize.col("reorder_level")
            }
        },
        include: [{ model: Product, as: "product" }],
        order: [["quantity_on_hand", "ASC"]]
    });

    return lowStocks;
};

module.exports = {
    getAllStocks,
    getStockByProductId,
    adjustStock,
    getStockMovements,
    getLowStockAlerts
};
