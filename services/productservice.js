const { Product, Stock } = require("../models");
const { Op } = require("sequelize");

const createProduct = async (productData) => {
    const { sku, part_number } = productData;

    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) {
        const error = new Error("Product with this SKU already exists");
        error.statusCode = 400;
        throw error;
    }

    const existingPartNo = await Product.findOne({ where: { part_number } });
    if (existingPartNo) {
        const error = new Error("Product with this Part Number already exists");
        error.statusCode = 400;
        throw error;
    }

    const product = await Product.create(productData);

    await Stock.create({
        product_id: product.id,
        warehouse_location: productData.warehouse_location || "Warehouse-A / Section-1",
        quantity_on_hand: productData.initial_stock || 0,
        reserved_quantity: 0,
        safety_stock: productData.safety_stock || 10,
        reorder_level: productData.reorder_level || 20,
        batch_number: productData.batch_number || `BATCH-${Date.now()}`
    });

    const createdProduct = await Product.findByPk(product.id, {
        include: [{ model: Stock, as: "stocks" }]
    });

    return createdProduct;
};

const getAllProducts = async (query = {}) => {
    const where = {};

    if (query.category) {
        where.category = query.category;
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.search) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${query.search}%` } },
            { sku: { [Op.iLike]: `%${query.search}%` } },
            { part_number: { [Op.iLike]: `%${query.search}%` } }
        ];
    }

    const products = await Product.findAll({
        where,
        include: [{ model: Stock, as: "stocks" }],
        order: [["created_at", "DESC"]]
    });

    return products;
};

const getProductById = async (id) => {
    const product = await Product.findByPk(id, {
        include: [{ model: Stock, as: "stocks" }]
    });

    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    return product;
};

const updateProduct = async (id, updateData) => {
    const product = await Product.findByPk(id);

    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    await product.update(updateData);

    const updatedProduct = await Product.findByPk(id, {
        include: [{ model: Stock, as: "stocks" }]
    });

    return updatedProduct;
};

const deleteProduct = async (id) => {
    const product = await Product.findByPk(id);

    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    await product.destroy();

    return { message: "Product deleted successfully", id };
};

const getProductsByCategory = async (category) => {
    const products = await Product.findAll({
        where: { category, status: "Active" },
        include: [{ model: Stock, as: "stocks" }],
        order: [["name", "ASC"]]
    });

    return products;
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory
};
