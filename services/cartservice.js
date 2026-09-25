const { CartItem, Product, Stock } = require("../models");

const getUserCart = async (userId) => {
    const items = await CartItem.findAll({
        where: { user_id: userId },
        include: [{
            model: Product,
            as: "product",
            include: [{ model: Stock, as: "stocks" }]
        }],
        order: [["created_at", "DESC"]]
    });

    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
        subtotal += Number(item.unit_price) * item.quantity;
        totalQuantity += item.quantity;
    }

    return {
        items,
        total_items: items.length,
        total_quantity: totalQuantity,
        subtotal: parseFloat(subtotal.toFixed(2))
    };
};

const addToCart = async (userId, data) => {
    const { product_id, quantity, custom_specifications } = data;
    const parsedQty = parseInt(quantity, 10) || 1;

    const product = await Product.findByPk(product_id);
    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    let item = await CartItem.findOne({
        where: { user_id: userId, product_id }
    });

    if (item) {
        item.quantity += parsedQty;
        item.unit_price = product.unit_price;
        if (custom_specifications) {
            item.custom_specifications = custom_specifications;
        }
        await item.save();
    } else {
        item = await CartItem.create({
            user_id: userId,
            product_id,
            quantity: parsedQty,
            unit_price: product.unit_price,
            custom_specifications
        });
    }

    return await getUserCart(userId);
};

const updateCartItem = async (userId, cartItemId, data) => {
    const item = await CartItem.findOne({
        where: { id: cartItemId, user_id: userId }
    });

    if (!item) {
        const error = new Error("Cart item not found");
        error.statusCode = 404;
        throw error;
    }

    if (data.quantity !== undefined) {
        const qty = parseInt(data.quantity, 10);
        if (qty <= 0) {
            await item.destroy();
            return await getUserCart(userId);
        }
        item.quantity = qty;
    }

    if (data.custom_specifications !== undefined) {
        item.custom_specifications = data.custom_specifications;
    }

    await item.save();
    return await getUserCart(userId);
};

const removeCartItem = async (userId, cartItemId) => {
    const item = await CartItem.findOne({
        where: { id: cartItemId, user_id: userId }
    });

    if (!item) {
        const error = new Error("Cart item not found");
        error.statusCode = 404;
        throw error;
    }

    await item.destroy();
    return await getUserCart(userId);
};

const clearCart = async (userId) => {
    await CartItem.destroy({ where: { user_id: userId } });
    return { message: "Cart cleared successfully", items: [], total_items: 0, total_quantity: 0, subtotal: 0 };
};

module.exports = {
    getUserCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
