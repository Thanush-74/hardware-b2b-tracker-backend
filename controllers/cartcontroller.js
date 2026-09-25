const cartService = require("../services/cartservice");

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartService.getUserCart(userId);

        res.status(200).json({
            success: true,
            message: "Cart fetched successfully",
            data: cart
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const addItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity, custom_specifications } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "product_id is required"
            });
        }

        const cart = await cartService.addToCart(userId, {
            product_id,
            quantity,
            custom_specifications
        });

        res.status(201).json({
            success: true,
            message: "Item added to cart",
            data: cart
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const updateItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItemId = req.params.id;

        const cart = await cartService.updateCartItem(userId, cartItemId, req.body);

        res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: cart
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItemId = req.params.id;

        const cart = await cartService.removeCartItem(userId, cartItemId);

        res.status(200).json({
            success: true,
            message: "Item removed from cart",
            data: cart
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const clear = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await cartService.clearCart(userId);

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clear
};
