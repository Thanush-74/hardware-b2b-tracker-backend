const { Order, OrderItem, Product, Inventory, Staff, Cart, CartItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notificationService');

const ALLOWED_ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const ALLOWED_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Partially Paid'];
const ALLOWED_PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Cash', 'Other'];

/**
 * Generate unique B2B order number (e.g. ORD-20260928-1234)
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

/**
 * Format order output with items, calculations, and product details
 */
const formatOrderResponse = (order) => {
  const items = order.items || [];
  const formattedItems = items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product ? item.product.name : 'Unknown Product',
    product_type: item.product ? item.product.type : '',
    product_specifications: item.product ? item.product.specifications : null,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    total_price: Number(item.total_price)
  }));

  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    staff_id: order.staff_id,
    created_by: order.staff ? `${order.staff.first_name} ${order.staff.last_name}` : null,
    total_amount: Number(order.total_amount),
    order_status: order.order_status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    payment_amount: Number(order.payment_amount),
    order_date: order.order_date,
    notes: order.notes,
    total_items_count: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    items: formattedItems,
    created_at: order.created_at,
    updated_at: order.updated_at
  };
};

/**
 * Create a new customer order
 */
const createOrder = async (staffId, {
  customer_name,
  customer_email,
  customer_phone,
  items,
  use_cart = false,
  payment_method = 'Bank Transfer',
  payment_status = 'Pending',
  payment_amount = 0,
  notes
}) => {
  // 1. Validate customer name
  if (!customer_name || !customer_name.trim()) {
    const error = new Error('Customer / Company name is required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate payment methods and statuses
  if (payment_method && !ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
    const error = new Error(`Invalid payment method. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (payment_status && !ALLOWED_PAYMENT_STATUSES.includes(payment_status)) {
    const error = new Error(`Invalid payment status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  let orderItemsToProcess = [];
  let cartToClear = null;

  // 3. Resolve items either from cart or from body array
  if (use_cart || (!items && staffId)) {
    const cart = await Cart.findOne({
      where: { staff_id: staffId, status: 'active' },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      const error = new Error('Your shopping cart is empty. Cannot create order from empty cart.');
      error.statusCode = 400;
      throw error;
    }

    orderItemsToProcess = cart.items.map(ci => ({
      product_id: ci.product_id,
      quantity: ci.quantity
    }));
    cartToClear = cart;
  } else {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 400;
      throw error;
    }
    orderItemsToProcess = items;
  }

  // 4. Validate products and stock availability
  let grandTotal = 0;
  const verifiedItems = [];

  for (const it of orderItemsToProcess) {
    if (!it.product_id) {
      const error = new Error('Each order item must specify product_id');
      error.statusCode = 400;
      throw error;
    }

    const qty = parseInt(it.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      const error = new Error(`Quantity for product ID ${it.product_id} must be greater than 0`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findByPk(it.product_id);
    if (!product || !product.is_active) {
      const error = new Error(`Product with ID ${it.product_id} is not found or inactive`);
      error.statusCode = 404;
      throw error;
    }

    if (qty > product.available_quantity) {
      const error = new Error(
        `Insufficient stock for product "${product.name}". Available: ${product.available_quantity}, Requested: ${qty}`
      );
      error.statusCode = 400;
      throw error;
    }

    const unitPrice = Number(product.price);
    const lineTotal = Number((qty * unitPrice).toFixed(2));
    grandTotal += lineTotal;

    verifiedItems.push({
      product,
      product_id: product.id,
      quantity: qty,
      unit_price: unitPrice,
      total_price: lineTotal
    });
  }

  grandTotal = Number(grandTotal.toFixed(2));
  const numericPaymentAmount = payment_status === 'Paid' && (!payment_amount || Number(payment_amount) === 0)
    ? grandTotal
    : Number(payment_amount) || 0;

  // 5. Create Order, OrderItems, update stocks and clear cart atomically inside a transaction
  const transaction = await sequelize.transaction();
  try {
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      order_number: orderNumber,
      customer_name: customer_name.trim(),
      customer_email: customer_email ? customer_email.trim().toLowerCase() : null,
      customer_phone: customer_phone ? customer_phone.trim() : null,
      staff_id: staffId || null,
      total_amount: grandTotal,
      order_status: 'Pending',
      payment_method: payment_method || 'Bank Transfer',
      payment_status: payment_status || 'Pending',
      payment_amount: numericPaymentAmount,
      order_date: new Date(),
      notes: notes ? notes.trim() : null
    }, { transaction });

    // 6. Create items and deduct stock from product and inventory
    for (const itemData of verifiedItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: itemData.product_id,
        quantity: itemData.quantity,
        unit_price: itemData.unit_price,
        total_price: itemData.total_price
      }, { transaction });

      // Deduct stock
      const newStock = Math.max(0, itemData.product.available_quantity - itemData.quantity);
      await itemData.product.update({ available_quantity: newStock }, { transaction });

      const inv = await Inventory.findOne({ where: { product_id: itemData.product_id }, transaction });
      if (inv) {
        const newInvQty = Math.max(0, inv.quantity - itemData.quantity);
        await inv.update({ quantity: newInvQty }, { transaction });
      }
    }

    // 7. Clear cart if cart was converted
    if (cartToClear) {
      await CartItem.destroy({ where: { cart_id: cartToClear.id }, transaction });
    }

    await transaction.commit();

    // Trigger asynchronous business notifications
    try {
      if (staffId) {
        await notificationService.createNotification({
          recipient_staff_id: staffId,
          title: 'Order Created',
          message: `Order #${order.order_number} for ${customer_name.trim()} (₹${grandTotal.toFixed(2)}) has been created successfully.`,
          type: 'order_created'
        });
      }
      await notificationService.notifyAdmins({
        title: 'New Order Received',
        message: `Order #${order.order_number} received from ${customer_name.trim()} for ₹${grandTotal.toFixed(2)}.`,
        type: 'order_created'
      });
    } catch (notifyErr) {
      console.error('Order notification warning:', notifyErr.message);
    }

    return await getOrderById(order.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get all orders with optional search, status filters, and pagination
 */
const getAllOrders = async (query = {}) => {
  const { page = 1, limit = 50, search, order_status, payment_status } = query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { order_number: { [Op.iLike]: `%${search}%` } },
      { customer_name: { [Op.iLike]: `%${search}%` } },
      { customer_email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (order_status) {
    where.order_status = order_status;
  }

  if (payment_status) {
    where.payment_status = payment_status;
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      },
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ],
    order: [['id', 'DESC']],
    limit: pageSize,
    offset
  });

  return {
    total: count,
    page: pageNumber,
    totalPages: Math.ceil(count / pageSize),
    orders: rows.map(formatOrderResponse)
  };
};

/**
 * Get a single order by ID or order_number
 */
const getOrderById = async (idOrOrderNumber) => {
  const isNumeric = /^\d+$/.test(idOrOrderNumber.toString());
  const where = isNumeric ? { id: idOrOrderNumber } : { order_number: idOrOrderNumber };

  const order = await Order.findOne({
    where,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      },
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return formatOrderResponse(order);
};

/**
 * Update general order details (customer info, notes)
 */
const updateOrder = async (id, data) => {
  const order = await Order.findByPk(id);

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (data.customer_name !== undefined) {
    if (!data.customer_name.trim()) {
      const error = new Error('Customer name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.customer_name = data.customer_name.trim();
  }

  if (data.customer_email !== undefined) updateFields.customer_email = data.customer_email ? data.customer_email.trim().toLowerCase() : null;
  if (data.customer_phone !== undefined) updateFields.customer_phone = data.customer_phone ? data.customer_phone.trim() : null;
  if (data.notes !== undefined) updateFields.notes = data.notes ? data.notes.trim() : null;

  await order.update(updateFields);

  return await getOrderById(order.id);
};

/**
 * Update order status (and restore stock if order is cancelled)
 */
const updateOrderStatus = async (id, order_status) => {
  if (!order_status || !ALLOWED_ORDER_STATUSES.includes(order_status)) {
    const error = new Error(`Invalid order status. Allowed values: ${ALLOWED_ORDER_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findByPk(id, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = order.order_status;

  // If order is already in target status, return directly
  if (previousStatus === order_status) {
    return await getOrderById(order.id);
  }

  // Prevent modifying an already cancelled order to prevent stock duplication
  if (previousStatus === 'Cancelled') {
    const error = new Error('Cannot change the status of an order that has already been cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Prevent direct cancellation of delivered orders (returns process required)
  if (previousStatus === 'Delivered' && order_status === 'Cancelled') {
    const error = new Error('Delivered orders cannot be cancelled directly. Please initiate a return request.');
    error.statusCode = 400;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    // If newly cancelling an order, restore stock atomically exactly once
    if (order_status === 'Cancelled' && previousStatus !== 'Cancelled') {
      const items = order.items || [];
      for (const item of items) {
        const prod = await Product.findByPk(item.product_id, { transaction });
        if (prod) {
          await prod.update({ available_quantity: prod.available_quantity + item.quantity }, { transaction });
        }
        const inv = await Inventory.findOne({ where: { product_id: item.product_id }, transaction });
        if (inv) {
          await inv.update({ quantity: inv.quantity + item.quantity }, { transaction });
        }
      }
    }

    await order.update({ order_status }, { transaction });
    await transaction.commit();

    try {
      if (order.staff_id) {
        await notificationService.createNotification({
          recipient_staff_id: order.staff_id,
          title: 'Order Status Changed',
          message: `Order #${order.order_number} status is now "${order_status}".`,
          type: 'order_status'
        });
      }
      await notificationService.notifyAdmins({
        title: 'Order Status Changed',
        message: `Order #${order.order_number} status has been updated to "${order_status}".`,
        type: 'order_status'
      });
    } catch (notifyErr) {
      console.error('Order status notification warning:', notifyErr.message);
    }

    return await getOrderById(order.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Update payment details
 */
const updatePaymentStatus = async (id, { payment_status, payment_amount, payment_method }) => {
  const order = await Order.findByPk(id);

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (payment_status !== undefined) {
    if (!ALLOWED_PAYMENT_STATUSES.includes(payment_status)) {
      const error = new Error(`Invalid payment status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    updateFields.payment_status = payment_status;
  }

  if (payment_method !== undefined) {
    if (!ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
      const error = new Error(`Invalid payment method. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    updateFields.payment_method = payment_method;
  }

  if (payment_amount !== undefined) {
    const amt = Number(payment_amount);
    if (isNaN(amt) || amt < 0) {
      const error = new Error('Payment amount must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.payment_amount = amt;
  }

  await order.update(updateFields);

  try {
    if (order.staff_id && payment_status) {
      await notificationService.createNotification({
        recipient_staff_id: order.staff_id,
        title: 'Order Payment Updated',
        message: `Order #${order.order_number} payment status updated to "${payment_status}".`,
        type: 'payment_status'
      });
    }
    if (payment_status) {
      await notificationService.notifyAdmins({
        title: 'Order Payment Updated',
        message: `Order #${order.order_number} payment status updated to "${payment_status}".`,
        type: 'payment_status'
      });
    }
  } catch (notifyErr) {
    console.error('Payment notification warning:', notifyErr.message);
  }

  return await getOrderById(order.id);
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  updatePaymentStatus
};
