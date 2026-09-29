const { Delivery, Order, OrderItem, Product, Staff } = require('../models');
const { Op } = require('sequelize');

const ALLOWED_DELIVERY_STATUSES = ['Pending', 'Preparing', 'In Transit', 'Delivered', 'Failed', 'Cancelled'];

/**
 * Generate unique tracking number (e.g. TRK-20260928-8742)
 */
const generateTrackingNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${dateStr}-${randomSuffix}`;
};

/**
 * Format delivery object for clean, consistent response
 */
const formatDeliveryResponse = (delivery) => {
  const order = delivery.order;
  const staff = delivery.delivery_staff;

  return {
    id: delivery.id,
    tracking_number: delivery.tracking_number,
    order_id: delivery.order_id,
    order_number: order ? order.order_number : null,
    customer_name: order ? order.customer_name : null,
    customer_email: order ? order.customer_email : null,
    customer_phone: order ? order.customer_phone : null,
    delivery_staff_id: delivery.delivery_staff_id ? Number(delivery.delivery_staff_id) : null,
    delivery_person: staff ? `${staff.first_name} ${staff.last_name}` : 'Unassigned',
    delivery_staff_email: staff ? staff.email : null,
    delivery_address: delivery.delivery_address,
    recipient_name: delivery.recipient_name || (order ? order.customer_name : null),
    recipient_phone: delivery.recipient_phone || (order ? order.customer_phone : null),
    delivery_date: delivery.delivery_date,
    expected_delivery_date: delivery.expected_delivery_date,
    status: delivery.status,
    notes: delivery.notes,
    order_details: order ? {
      total_amount: Number(order.total_amount),
      order_status: order.order_status,
      payment_status: order.payment_status,
      items_count: order.items ? order.items.length : 0
    } : null,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at
  };
};

/**
 * Create a new delivery record for an order
 */
const createDelivery = async ({
  order_id,
  delivery_staff_id,
  delivery_address,
  recipient_name,
  recipient_phone,
  expected_delivery_date,
  notes
}) => {
  // 1. Validate order_id
  if (!order_id) {
    const error = new Error('order_id is required');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findByPk(order_id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate delivery address
  if (!delivery_address || !delivery_address.trim()) {
    const error = new Error('delivery_address is required');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate delivery staff if provided
  if (delivery_staff_id) {
    const staff = await Staff.findByPk(delivery_staff_id);
    if (!staff) {
      const error = new Error('Assigned delivery staff member not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const trackingNumber = generateTrackingNumber();

  const delivery = await Delivery.create({
    order_id: order.id,
    delivery_staff_id: delivery_staff_id || null,
    tracking_number: trackingNumber,
    delivery_address: delivery_address.trim(),
    recipient_name: recipient_name ? recipient_name.trim() : order.customer_name,
    recipient_phone: recipient_phone ? recipient_phone.trim() : order.customer_phone,
    expected_delivery_date: expected_delivery_date || null,
    status: delivery_staff_id ? 'Preparing' : 'Pending',
    notes: notes ? notes.trim() : null
  });

  // Update order status to Processing if it was Pending
  if (order.order_status === 'Pending') {
    await order.update({ order_status: 'Processing' });
  }

  return await getDeliveryById(delivery.id);
};

/**
 * Get all deliveries with optional search, status filtering, and pagination
 */
const getAllDeliveries = async (query = {}) => {
  const { page = 1, limit = 50, search, status, delivery_staff_id } = query;
  const where = {};
  const orderWhere = {};

  if (status) {
    where.status = status;
  }

  if (delivery_staff_id) {
    where.delivery_staff_id = delivery_staff_id;
  }

  if (search) {
    where[Op.or] = [
      { tracking_number: { [Op.iLike]: `%${search}%` } },
      { recipient_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Delivery.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
        include: [{ model: OrderItem, as: 'items' }]
      },
      {
        model: Staff,
        as: 'delivery_staff',
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
    deliveries: rows.map(formatDeliveryResponse)
  };
};

/**
 * Get single delivery by ID or tracking_number
 */
const getDeliveryById = async (idOrTrackingNumber) => {
  const isNumeric = /^\d+$/.test(idOrTrackingNumber.toString());
  const where = isNumeric ? { id: idOrTrackingNumber } : { tracking_number: idOrTrackingNumber };

  const delivery = await Delivery.findOne({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      },
      {
        model: Staff,
        as: 'delivery_staff',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  if (!delivery) {
    const error = new Error('Delivery record not found');
    error.statusCode = 404;
    throw error;
  }

  return formatDeliveryResponse(delivery);
};

/**
 * Update delivery details (address, recipient, expected date, notes)
 */
const updateDelivery = async (id, data) => {
  const delivery = await Delivery.findByPk(id);

  if (!delivery) {
    const error = new Error('Delivery record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (data.delivery_address !== undefined) {
    if (!data.delivery_address.trim()) {
      const error = new Error('delivery_address cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.delivery_address = data.delivery_address.trim();
  }

  if (data.recipient_name !== undefined) updateFields.recipient_name = data.recipient_name ? data.recipient_name.trim() : null;
  if (data.recipient_phone !== undefined) updateFields.recipient_phone = data.recipient_phone ? data.recipient_phone.trim() : null;
  if (data.expected_delivery_date !== undefined) updateFields.expected_delivery_date = data.expected_delivery_date;
  if (data.notes !== undefined) updateFields.notes = data.notes ? data.notes.trim() : null;

  await delivery.update(updateFields);

  return await getDeliveryById(delivery.id);
};

/**
 * Update delivery status and keep Order status synchronized
 */
const updateDeliveryStatus = async (id, status) => {
  if (!status || !ALLOWED_DELIVERY_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Allowed values: ${ALLOWED_DELIVERY_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const delivery = await Delivery.findByPk(id, {
    include: [{ model: Order, as: 'order' }]
  });

  if (!delivery) {
    const error = new Error('Delivery record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = { status };

  // Set actual delivery date when marked as Delivered
  if (status === 'Delivered') {
    updateFields.delivery_date = new Date();
    if (delivery.order) {
      await delivery.order.update({ order_status: 'Delivered' });
    }
  } else if (status === 'In Transit') {
    if (delivery.order) {
      await delivery.order.update({ order_status: 'Shipped' });
    }
  } else if (status === 'Cancelled') {
    if (delivery.order && delivery.order.order_status !== 'Cancelled') {
      await delivery.order.update({ order_status: 'Processing' });
    }
  }

  await delivery.update(updateFields);

  return await getDeliveryById(delivery.id);
};

/**
 * Assign or reassign delivery staff employee
 */
const assignDeliveryStaff = async (id, delivery_staff_id) => {
  const delivery = await Delivery.findByPk(id);

  if (!delivery) {
    const error = new Error('Delivery record not found');
    error.statusCode = 404;
    throw error;
  }

  if (delivery_staff_id) {
    const staff = await Staff.findByPk(delivery_staff_id);
    if (!staff) {
      const error = new Error('Staff member not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const updateFields = {
    delivery_staff_id: delivery_staff_id || null
  };

  if (delivery.status === 'Pending' && delivery_staff_id) {
    updateFields.status = 'Preparing';
  }

  await delivery.update(updateFields);

  return await getDeliveryById(delivery.id);
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  updateDeliveryStatus,
  assignDeliveryStaff
};
