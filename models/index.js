const { sequelize } = require('../config/database');
const Role = require('./Role');
const Screen = require('./Screen');
const Staff = require('./Staff');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');

// Associations

// 1. Staff & Role
Staff.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
  onDelete: 'RESTRICT'
});

Role.hasMany(Staff, {
  foreignKey: 'role_id',
  as: 'staff'
});

// 2. Screen & Permission
Screen.hasMany(Permission, {
  foreignKey: 'screen_id',
  as: 'permissions',
  onDelete: 'CASCADE'
});

Permission.belongsTo(Screen, {
  foreignKey: 'screen_id',
  as: 'screen'
});

// 3. Role & Permission (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// 4. Cart & Staff
Staff.hasMany(Cart, {
  foreignKey: 'staff_id',
  as: 'carts',
  onDelete: 'CASCADE'
});

Cart.belongsTo(Staff, {
  foreignKey: 'staff_id',
  as: 'staff'
});

// 5. Cart & CartItem
Cart.hasMany(CartItem, {
  foreignKey: 'cart_id',
  as: 'items',
  onDelete: 'CASCADE'
});

CartItem.belongsTo(Cart, {
  foreignKey: 'cart_id',
  as: 'cart'
});

// 6. CartItem & Product
CartItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'CASCADE'
});

Product.hasMany(CartItem, {
  foreignKey: 'product_id',
  as: 'cart_items'
});

module.exports = {
  sequelize,
  Role,
  Screen,
  Staff,
  Permission,
  RolePermission,
  Product,
  Cart,
  CartItem
};
