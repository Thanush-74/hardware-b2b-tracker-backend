const orderService = require("../services/orderservice");

const checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shipping_address, payment_terms, notes } = req.body;

        if (!shipping_address) {
            return res.status(400).json({
                success: false,
                message: "shipping_address is required for checkout"
            });
        }

        const order = await orderService.createOrderFromCart(userId, {
            shipping_address,
            payment_terms,
            notes
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully from cart",
            data: order
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, shipping_address, payment_terms, notes } = req.body;

        if (!shipping_address || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: "shipping_address and items array are required"
            });
        }

        const order = await orderService.createDirectOrder({
            user_id: userId,
            items,
            shipping_address,
            payment_terms,
            notes
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
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
        if (req.user.role === "buyer") {
            const orders = await orderService.getUserOrders(req.user.id);
            return res.status(200).json({
                success: true,
                message: "My orders retrieved successfully",
                data: orders
            });
        }

        const orders = await orderService.getAllOrders(req.query);
        res.status(200).json({
            success: true,
            message: "All orders retrieved successfully",
            data: orders
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
        const order = await orderService.getOrderById(req.params.id);

        if (req.user.role === "buyer" && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access forbidden: not your order"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order details retrieved successfully",
            data: order
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await orderService.getUserOrders(req.user.id);

        res.status(200).json({
            success: true,
            message: "User orders retrieved successfully",
            data: orders
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const order = await orderService.updateOrderStatus(req.params.id, status);

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { payment_status } = req.body;
        if (!payment_status) {
            return res.status(400).json({
                success: false,
                message: "payment_status is required"
            });
        }

        const order = await orderService.updatePaymentStatus(req.params.id, payment_status);

        res.status(200).json({
            success: true,
            message: "Order payment status updated successfully",
            data: order
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const cancel = async (req, res) => {
    try {
        const order = await orderService.cancelOrder(req.params.id, req.user.id, req.user.role);

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    checkout,
    create,
    getAll,
    getById,
    getMyOrders,
    updateStatus,
    updatePayment,
    cancel
};
