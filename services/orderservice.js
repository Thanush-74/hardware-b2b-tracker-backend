const { Order, OrderItem, CartItem, Product, User } = require("../models");

const createOrderFromCart = async (userId, orderData) => {
    const { shipping_address, payment_terms, notes } = orderData;

    const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [{ model: Product, as: "product" }]
    });

    if (!cartItems.length) {
        const error = new Error("Cart is empty");
        error.statusCode = 400;
        throw error;
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let totalAmount = 0;

    for (const item of cartItems) {
        totalAmount += Number(item.unit_price) * item.quantity;
    }

    const order = await Order.create({
        order_number: orderNumber,
        user_id: userId,
        total_amount: totalAmount,
        status: "Pending",
        payment_status: "Unpaid",
        payment_terms: payment_terms || "Net 30",
        shipping_address,
        notes
    });

    for (const item of cartItems) {
        await OrderItem.create({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: Number(item.unit_price) * item.quantity
        });
    }

    await CartItem.destroy({ where: { user_id: userId } });

    const fullOrder = await Order.findByPk(order.id, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ]
    });

    return fullOrder;
};

const createDirectOrder = async (orderData) => {
    const { user_id, items, shipping_address, payment_terms, notes } = orderData;

    if (!items || !items.length) {
        const error = new Error("At least one order item is required");
        error.statusCode = 400;
        throw error;
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let totalAmount = 0;

    for (const item of items) {
        totalAmount += Number(item.unit_price) * item.quantity;
    }

    const order = await Order.create({
        order_number: orderNumber,
        user_id,
        total_amount: totalAmount,
        status: "Pending",
        payment_status: "Unpaid",
        payment_terms: payment_terms || "Net 30",
        shipping_address,
        notes
    });

    for (const item of items) {
        await OrderItem.create({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: Number(item.unit_price) * item.quantity
        });
    }

    const fullOrder = await Order.findByPk(order.id, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ]
    });

    return fullOrder;
};

const getAllOrders = async (query = {}) => {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.payment_status) {
        where.payment_status = query.payment_status;
    }

    const orders = await Order.findAll({
        where,
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ],
        order: [["created_at", "DESC"]]
    });

    return orders;
};

const getOrderById = async (orderId) => {
    const order = await Order.findByPk(orderId, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ]
    });

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    return order;
};

const getUserOrders = async (userId) => {
    const orders = await Order.findAll({
        where: { user_id: userId },
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
        ],
        order: [["created_at", "DESC"]]
    });

    return orders;
};

const updateOrderStatus = async (orderId, status) => {
    const order = await Order.findByPk(orderId);

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    const validStatuses = ["Pending", "Approved", "In_Production", "Assembled", "Inspected", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
        const error = new Error(`Invalid status. Valid statuses are: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    await order.update({ status });

    return await getOrderById(orderId);
};

const updatePaymentStatus = async (orderId, payment_status) => {
    const order = await Order.findByPk(orderId);

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    const validPaymentStatuses = ["Unpaid", "Partially_Paid", "Paid", "Refunded"];
    if (!validPaymentStatuses.includes(payment_status)) {
        const error = new Error(`Invalid payment status. Valid options are: ${validPaymentStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    await order.update({ payment_status });

    return await getOrderById(orderId);
};

const cancelOrder = async (orderId, userId, userRole) => {
    const order = await Order.findByPk(orderId);

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    if (userRole !== "admin" && userRole !== "manager" && order.user_id !== userId) {
        const error = new Error("Unauthorized to cancel this order");
        error.statusCode = 403;
        throw error;
    }

    if (order.status === "Shipped" || order.status === "Delivered") {
        const error = new Error("Cannot cancel an order that has already shipped or been delivered");
        error.statusCode = 400;
        throw error;
    }

    await order.update({ status: "Cancelled" });

    return await getOrderById(orderId);
};

module.exports = {
    createOrderFromCart,
    createDirectOrder,
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder
};
