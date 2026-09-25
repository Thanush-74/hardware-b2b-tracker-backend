const productService = require("../services/productservice");

const create = async (req, res) => {
    try {
        const { sku, part_number, name, category, unit_price } = req.body;
        if (!sku || !part_number || !name || !category || unit_price === undefined) {
            return res.status(400).json({
                success: false,
                message: "sku, part_number, name, category, and unit_price are required"
            });
        }

        const product = await productService.createProduct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getAll = async (req, res) => {
    try {
        const products = await productService.getAllProducts(req.query);

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: product
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByCategory = async (req, res) => {
    try {
        const products = await productService.getProductsByCategory(req.params.category);

        res.status(200).json({
            success: true,
            message: "Products fetched by category",
            data: products
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getByCategory
};
