const { Op } = require('sequelize');
const { Product, Staff, Order, Delivery, Return, Inventory, Role } = require('../models');

/**
 * Execute global search across business entities respecting user RBAC permissions
 * @param {string} queryText - Search query
 * @param {object} user - Authenticated user from req.user
 * @param {string[]} permissionSlugs - Array of permission slugs from req.permissionSlugs
 */
const globalSearch = async (queryText = '', user = {}, permissionSlugs = []) => {
  const q = (queryText || '').trim();

  const results = {
    products: [],
    staff: [],
    orders: [],
    deliveries: [],
    returns: [],
    inventory: []
  };

  if (!q) {
    return results;
  }

  const isAdmin = user.role?.slug === 'admin';
  const hasPerm = (slug) => isAdmin || (Array.isArray(permissionSlugs) && permissionSlugs.includes(slug));

  const searchPromises = [];

  // 1. PRODUCTS (requires products.view or admin)
  if (hasPerm('products.view')) {
    searchPromises.push(
      Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { type: { [Op.iLike]: `%${q}%` } },
            { description: { [Op.iLike]: `%${q}%` } }
          ]
        },
        attributes: ['id', 'name', 'type', 'price', 'available_quantity', 'is_active', 'description'],
        limit: 10
      }).then(rows => {
        results.products = rows.map(item => ({
          id: item.id,
          name: item.name,
          title: item.name,
          type: item.type,
          price: Number(item.price || 0),
          available_quantity: item.available_quantity,
          status: item.is_active ? 'Active' : 'Inactive',
          description: item.description,
          route: '/products'
        }));
      }).catch(err => {
        console.error('Search products error:', err.message);
      })
    );
  }

  // 2. STAFF (requires staff.view or admin)
  if (hasPerm('staff.view')) {
    searchPromises.push(
      Staff.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${q}%` } },
            { last_name: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } }
          ]
        },
        include: [{ model: Role, as: 'role', attributes: ['name', 'slug'] }],
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_active'],
        limit: 10
      }).then(rows => {
        results.staff = rows.map(item => ({
          id: item.id,
          title: `${item.first_name} ${item.last_name}`,
          name: `${item.first_name} ${item.last_name}`,
          email: item.email,
          role: item.role?.name || 'Staff',
          status: item.is_active ? 'Active' : 'Inactive',
          route: '/staff'
        }));
      }).catch(err => {
        console.error('Search staff error:', err.message);
      })
    );
  }

  // 3. ORDERS (requires orders.view or admin)
  if (hasPerm('orders.view')) {
    const orderOr = [
      { order_number: { [Op.iLike]: `%${q}%` } },
      { customer_name: { [Op.iLike]: `%${q}%` } },
      { order_status: { [Op.iLike]: `%${q}%` } },
      { payment_status: { [Op.iLike]: `%${q}%` } }
    ];
    if (!isNaN(Number(q)) && Number(q) > 0) {
      orderOr.push({ id: Number(q) });
    }

    searchPromises.push(
      Order.findAll({
        where: {
          [Op.or]: orderOr
        },
        attributes: ['id', 'order_number', 'customer_name', 'total_amount', 'order_status', 'payment_status', 'created_at'],
        limit: 10
      }).then(rows => {
        results.orders = rows.map(item => ({
          id: item.id,
          title: `Order #${item.order_number}`,
          order_number: item.order_number,
          customer_name: item.customer_name,
          total_amount: Number(item.total_amount || 0),
          order_status: item.order_status,
          status: item.order_status,
          payment_status: item.payment_status,
          route: '/orders'
        }));
      }).catch(err => {
        console.error('Search orders error:', err.message);
      })
    );
  }

  // 4. DELIVERIES (requires deliveries.view or admin)
  if (hasPerm('deliveries.view')) {
    const deliveryOr = [
      { tracking_number: { [Op.iLike]: `%${q}%` } },
      { recipient_name: { [Op.iLike]: `%${q}%` } },
      { status: { [Op.iLike]: `%${q}%` } }
    ];
    if (!isNaN(Number(q)) && Number(q) > 0) {
      deliveryOr.push({ id: Number(q) }, { order_id: Number(q) });
    }

    searchPromises.push(
      Delivery.findAll({
        where: {
          [Op.or]: deliveryOr
        },
        attributes: ['id', 'order_id', 'tracking_number', 'recipient_name', 'status'],
        limit: 10
      }).then(rows => {
        results.deliveries = rows.map(item => ({
          id: item.id,
          title: `Delivery #${item.tracking_number}`,
          tracking_number: item.tracking_number,
          order_id: item.order_id,
          recipient_name: item.recipient_name,
          status: item.status,
          route: '/deliveries'
        }));
      }).catch(err => {
        console.error('Search deliveries error:', err.message);
      })
    );
  }

  // 5. RETURNS (requires returns.view or admin)
  if (hasPerm('returns.view')) {
    const returnOr = [
      { return_number: { [Op.iLike]: `%${q}%` } },
      { customer_name: { [Op.iLike]: `%${q}%` } },
      { status: { [Op.iLike]: `%${q}%` } },
      { return_reason: { [Op.iLike]: `%${q}%` } }
    ];
    if (!isNaN(Number(q)) && Number(q) > 0) {
      returnOr.push({ id: Number(q) }, { order_id: Number(q) });
    }

    searchPromises.push(
      Return.findAll({
        where: {
          [Op.or]: returnOr
        },
        attributes: ['id', 'return_number', 'customer_name', 'status', 'return_reason'],
        limit: 10
      }).then(rows => {
        results.returns = rows.map(item => ({
          id: item.id,
          title: `Return #${item.return_number}`,
          return_number: item.return_number,
          customer_name: item.customer_name,
          status: item.status,
          return_reason: item.return_reason,
          route: '/returns'
        }));
      }).catch(err => {
        console.error('Search returns error:', err.message);
      })
    );
  }

  // 6. INVENTORY (requires inventory.view or admin)
  if (hasPerm('inventory.view')) {
    searchPromises.push(
      Inventory.findAll({
        where: {
          [Op.or]: [
            { location: { [Op.iLike]: `%${q}%` } },
            { '$product.name$': { [Op.iLike]: `%${q}%` } },
            { '$product.type$': { [Op.iLike]: `%${q}%` } }
          ]
        },
        include: [{ model: Product, as: 'product', attributes: ['name', 'type'] }],
        attributes: ['id', 'product_id', 'quantity', 'reserved_quantity', 'location'],
        limit: 10
      }).then(rows => {
        results.inventory = rows.map(item => ({
          id: item.id,
          title: `${item.product?.name || 'Item'} (${item.quantity} in stock)`,
          product_name: item.product?.name || '',
          location: item.location,
          quantity: item.quantity,
          status: item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock',
          route: '/inventory'
        }));
      }).catch(err => {
        console.error('Search inventory error:', err.message);
      })
    );
  }

  await Promise.all(searchPromises);
  return results;
};

module.exports = {
  globalSearch
};
