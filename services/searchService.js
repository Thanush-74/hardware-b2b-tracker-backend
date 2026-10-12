const { Op } = require('sequelize');
const {
  Product,
  Staff,
  Order,
  Delivery,
  Return,
  Inventory,
  Production,
  Inspection,
  Role
} = require('../models');

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
    inventory: [],
    production: [],
    inspections: []
  };

  if (!q) {
    return results;
  }

  const isAdmin = user?.role?.slug === 'admin';
  const hasPerm = (slug) => isAdmin || (Array.isArray(permissionSlugs) && permissionSlugs.includes(slug));

  const isNumeric = !isNaN(Number(q)) && Number(q) > 0;
  const numId = isNumeric ? Number(q) : null;

  const searchPromises = [];

  // 1. PRODUCTS (requires products.view or admin)
  if (hasPerm('products.view')) {
    const productOr = [
      { name: { [Op.iLike]: `%${q}%` } },
      { type: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      productOr.push({ id: numId });
    }

    searchPromises.push(
      Product.findAll({
        where: { [Op.or]: productOr },
        attributes: ['id', 'name', 'type', 'price', 'available_quantity', 'is_active', 'description'],
        limit: 10
      }).then(rows => {
        results.products = rows.map(item => ({
          id: item.id,
          type: 'Product',
          name: item.name,
          title: item.name,
          subtitle: `${item.type} • ₹${Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} • ${item.is_active ? 'Active' : 'Inactive'}`,
          detail: `${item.available_quantity} available in stock`,
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
    const staffOr = [
      { first_name: { [Op.iLike]: `%${q}%` } },
      { last_name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      staffOr.push({ id: numId });
    }

    searchPromises.push(
      Staff.findAll({
        where: { [Op.or]: staffOr },
        include: [{ model: Role, as: 'role', attributes: ['name', 'slug'] }],
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_active'],
        limit: 10
      }).then(rows => {
        results.staff = rows.map(item => ({
          id: item.id,
          type: 'Staff',
          title: `${item.first_name} ${item.last_name}`,
          name: `${item.first_name} ${item.last_name}`,
          subtitle: `${item.role?.name || 'Staff'} • ${item.email}`,
          detail: `Status: ${item.is_active ? 'Active' : 'Inactive'}`,
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
    if (numId !== null) {
      orderOr.push({ id: numId });
    }

    searchPromises.push(
      Order.findAll({
        where: { [Op.or]: orderOr },
        attributes: ['id', 'order_number', 'customer_name', 'total_amount', 'order_status', 'payment_status', 'created_at'],
        limit: 10
      }).then(rows => {
        results.orders = rows.map(item => ({
          id: item.id,
          type: 'Order',
          title: `Order #${item.order_number}`,
          subtitle: `${item.customer_name} • ₹${Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          detail: `Status: ${item.order_status} • Payment: ${item.payment_status}`,
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
      { status: { [Op.iLike]: `%${q}%` } },
      { '$order.order_number$': { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      deliveryOr.push({ id: numId }, { order_id: numId });
    }

    searchPromises.push(
      Delivery.findAll({
        where: { [Op.or]: deliveryOr },
        include: [{ model: Order, as: 'order', attributes: ['id', 'order_number'] }],
        attributes: ['id', 'order_id', 'tracking_number', 'recipient_name', 'status'],
        limit: 10
      }).then(rows => {
        results.deliveries = rows.map(item => ({
          id: item.id,
          type: 'Delivery',
          title: `Delivery #${item.tracking_number}`,
          subtitle: `Order #${item.order?.order_number || item.order_id} • To: ${item.recipient_name || 'N/A'}`,
          detail: `Status: ${item.status}`,
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
      { return_reason: { [Op.iLike]: `%${q}%` } },
      { '$order.order_number$': { [Op.iLike]: `%${q}%` } },
      { '$product.name$': { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      returnOr.push(
        { id: numId },
        { order_id: numId },
        { product_id: numId },
        { replacement_product_id: numId }
      );
    }

    searchPromises.push(
      Return.findAll({
        where: { [Op.or]: returnOr },
        include: [
          { model: Order, as: 'order', attributes: ['id', 'order_number'] },
          { model: Product, as: 'product', attributes: ['id', 'name'] }
        ],
        attributes: ['id', 'return_number', 'order_id', 'product_id', 'customer_name', 'status', 'return_reason', 'replacement_required'],
        limit: 10
      }).then(rows => {
        results.returns = rows.map(item => ({
          id: item.id,
          type: 'Return',
          title: `Return #${item.return_number}`,
          subtitle: `Order #${item.order?.order_number || item.order_id} • ${item.customer_name}`,
          detail: `Status: ${item.status}${item.replacement_required ? ' • Replacement' : ''}`,
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
    const inventoryOr = [
      { location: { [Op.iLike]: `%${q}%` } },
      { '$product.name$': { [Op.iLike]: `%${q}%` } },
      { '$product.type$': { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      inventoryOr.push({ id: numId }, { product_id: numId });
    }

    searchPromises.push(
      Inventory.findAll({
        where: { [Op.or]: inventoryOr },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'type'] }],
        attributes: ['id', 'product_id', 'quantity', 'reserved_quantity', 'location'],
        limit: 10
      }).then(rows => {
        results.inventory = rows.map(item => ({
          id: item.id,
          type: 'Inventory',
          title: `${item.product?.name || 'Item'} (${item.quantity} in stock)`,
          subtitle: `Location: ${item.location || 'N/A'} • Reserved: ${item.reserved_quantity || 0}`,
          detail: `Available: ${item.quantity - (item.reserved_quantity || 0)}`,
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

  // 7. PRODUCTION (requires production.view or admin)
  if (hasPerm('production.view')) {
    const productionOr = [
      { status: { [Op.iLike]: `%${q}%` } },
      { notes: { [Op.iLike]: `%${q}%` } },
      { '$product.name$': { [Op.iLike]: `%${q}%` } },
      { '$product.type$': { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      productionOr.push({ id: numId }, { product_id: numId });
    }

    searchPromises.push(
      Production.findAll({
        where: { [Op.or]: productionOr },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'type'] }],
        attributes: ['id', 'product_id', 'quantity_planned', 'quantity_producing', 'quantity_completed', 'weekly_capacity', 'status', 'start_date', 'expected_completion_date'],
        limit: 10
      }).then(rows => {
        results.production = rows.map(item => ({
          id: item.id,
          type: 'Production',
          title: `Batch #${item.id} - ${item.product?.name || 'Production'}`,
          subtitle: `Status: ${item.status} • Planned: ${item.quantity_planned}`,
          detail: `In Production: ${item.quantity_producing} • Completed: ${item.quantity_completed}`,
          status: item.status,
          product_name: item.product?.name || '',
          quantity_planned: item.quantity_planned,
          quantity_producing: item.quantity_producing,
          quantity_completed: item.quantity_completed,
          route: '/production'
        }));
      }).catch(err => {
        console.error('Search production error:', err.message);
      })
    );
  }

  // 8. QUALITY INSPECTIONS (requires inspection.view or inspections.view or admin)
  if (hasPerm('inspection.view') || hasPerm('inspections.view')) {
    const inspectionOr = [
      { item_type: { [Op.iLike]: `%${q}%` } },
      { batch_number: { [Op.iLike]: `%${q}%` } },
      { result: { [Op.iLike]: `%${q}%` } },
      { defect_type: { [Op.iLike]: `%${q}%` } },
      { severity: { [Op.iLike]: `%${q}%` } },
      { notes: { [Op.iLike]: `%${q}%` } },
      { '$product.name$': { [Op.iLike]: `%${q}%` } }
    ];
    if (numId !== null) {
      inspectionOr.push(
        { id: numId },
        { product_id: numId },
        { return_id: numId },
        { production_id: numId }
      );
    }

    searchPromises.push(
      Inspection.findAll({
        where: { [Op.or]: inspectionOr },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
        attributes: ['id', 'inspector_id', 'product_id', 'return_id', 'production_id', 'inspection_date', 'item_type', 'batch_number', 'quantity_inspected', 'passed_quantity', 'failed_quantity', 'result', 'defect_type', 'severity'],
        limit: 10
      }).then(rows => {
        results.inspections = rows.map(item => ({
          id: item.id,
          type: 'Inspection',
          title: `Inspection #${item.id} - ${item.batch_number ? `Batch ${item.batch_number}` : (item.product?.name || item.item_type)}`,
          subtitle: `Result: ${item.result} • Type: ${item.item_type}`,
          detail: `Passed: ${item.passed_quantity} / Failed: ${item.failed_quantity} • Severity: ${item.severity || 'Low'}`,
          result: item.result,
          status: item.result,
          batch_number: item.batch_number,
          item_type: item.item_type,
          route: '/inspections'
        }));
      }).catch(err => {
        console.error('Search inspections error:', err.message);
      })
    );
  }

  await Promise.all(searchPromises);
  return results;
};

module.exports = {
  globalSearch
};
