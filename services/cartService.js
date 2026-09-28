const { Cart, CartItem, Product } = require('../models');

/**
 * Helper function to find or create an active cart for a staff member
 */
const getOrCreateActiveCart = async (staffId) => {
  let cart = await Cart.findOne({
    where: {
      staff_id: staffId,
      status: 'active'
    }
  });

  if (!cart) {
    cart = await Cart.create({
      staff_id: staffId,
      status: 'active'
    });
  }

  return cart;
};

/**
 * Helper function to format cart items and calculate totals
 */
const formatCartResponse = (cart) => {
  const items = cart.items || [];
  let cartTotal = 0;
  let totalItemsCount = 0;

  const formattedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const itemTotal = Number((qty * price).toFixed(2));

    cartTotal += itemTotal;
    totalItemsCount += qty;

    return {
      id: item.id,
      product_id: item.product_id,
      product_name: item.product ? item.product.name : 'Unknown Product',
      product_type: item.product ? item.product.type : '',
      product_specifications: item.product ? item.product.specifications : null,
      available_stock: item.product ? item.product.available_quantity : 0,
      quantity: qty,
      unit_price: price,
      item_total: itemTotal
    };
  });

  return {
    cart_id: cart.id,
    staff_id: cart.staff_id,
    status: cart.status,
    total_items: totalItemsCount,
    cart_total: Number(cartTotal.toFixed(2)),
    items: formattedItems
  };
};

/**
 * Fetch full active cart with products for a staff member
 */
const getCart = async (staffId) => {
  const cart = await getOrCreateActiveCart(staffId);

  const fullCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      }
    ],
    order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']]
  });

  return formatCartResponse(fullCart);
};

/**
 * Add a product to the user's cart
 */
const addItemToCart = async (staffId, { product_id, quantity = 1 }) => {
  // 1. Validate inputs
  if (!product_id) {
    const error = new Error('product_id is required');
    error.statusCode = 400;
    throw error;
  }

  const numericQty = parseInt(quantity, 10);
  if (isNaN(numericQty) || numericQty <= 0) {
    const error = new Error('Quantity must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate product exists and is active
  const product = await Product.findByPk(product_id);
  if (!product || !product.is_active) {
    const error = new Error('Product not found or is currently inactive');
    error.statusCode = 404;
    throw error;
  }

  // 3. Get or create active cart
  const cart = await getOrCreateActiveCart(staffId);

  // 4. Check if item is already in cart
  const existingItem = await CartItem.findOne({
    where: {
      cart_id: cart.id,
      product_id: product.id
    }
  });

  if (existingItem) {
    const newQty = existingItem.quantity + numericQty;

    if (newQty > product.available_quantity) {
      const error = new Error(
        `Cannot add quantity. Requested total (${newQty}) exceeds available stock (${product.available_quantity})`
      );
      error.statusCode = 400;
      throw error;
    }

    await existingItem.update({
      quantity: newQty,
      unit_price: product.price
    });
  } else {
    if (numericQty > product.available_quantity) {
      const error = new Error(
        `Requested quantity (${numericQty}) exceeds available stock (${product.available_quantity})`
      );
      error.statusCode = 400;
      throw error;
    }

    await CartItem.create({
      cart_id: cart.id,
      product_id: product.id,
      quantity: numericQty,
      unit_price: product.price
    });
  }

  return await getCart(staffId);
};

/**
 * Update the quantity of a specific cart item
 */
const updateCartItemQuantity = async (staffId, itemId, quantity) => {
  const numericQty = parseInt(quantity, 10);
  if (isNaN(numericQty) || numericQty <= 0) {
    const error = new Error('Quantity must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateActiveCart(staffId);

  const cartItem = await CartItem.findOne({
    where: {
      id: itemId,
      cart_id: cart.id
    },
    include: [{ model: Product, as: 'product' }]
  });

  if (!cartItem) {
    const error = new Error('Cart item not found in active cart');
    error.statusCode = 404;
    throw error;
  }

  const availableStock = cartItem.product ? cartItem.product.available_quantity : 0;
  if (numericQty > availableStock) {
    const error = new Error(
      `Requested quantity (${numericQty}) exceeds available stock (${availableStock})`
    );
    error.statusCode = 400;
    throw error;
  }

  await cartItem.update({
    quantity: numericQty,
    unit_price: cartItem.product ? cartItem.product.price : cartItem.unit_price
  });

  return await getCart(staffId);
};

/**
 * Remove an item from the cart
 */
const removeCartItem = async (staffId, itemId) => {
  const cart = await getOrCreateActiveCart(staffId);

  const cartItem = await CartItem.findOne({
    where: {
      id: itemId,
      cart_id: cart.id
    }
  });

  if (!cartItem) {
    const error = new Error('Cart item not found in active cart');
    error.statusCode = 404;
    throw error;
  }

  await cartItem.destroy();

  return await getCart(staffId);
};

/**
 * Clear all items from the active cart
 */
const clearCart = async (staffId) => {
  const cart = await getOrCreateActiveCart(staffId);

  await CartItem.destroy({
    where: {
      cart_id: cart.id
    }
  });

  return await getCart(staffId);
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
