const { sequelize } = require('../config/database');
const Role = require('./Role');
const Screen = require('./Screen');
const Staff = require('./Staff');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Inventory = require('./Inventory');
const Production = require('./Production');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Delivery = require('./Delivery');
const Return = require('./Return');
const ManufacturingAssignment = require('./ManufacturingAssignment');
const Expense = require('./Expense');
const Inspection = require('./Inspection');
const Notification = require('./Notification');

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

// 7. Product & Inventory (One-to-One)
Product.hasOne(Inventory, {
  foreignKey: 'product_id',
  as: 'inventory',
  onDelete: 'CASCADE'
});

Inventory.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// 8. Product & Production (One-to-Many)
Product.hasMany(Production, {
  foreignKey: 'product_id',
  as: 'productions',
  onDelete: 'CASCADE'
});

Production.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// 9. Order & Staff
Staff.hasMany(Order, {
  foreignKey: 'staff_id',
  as: 'orders',
  onDelete: 'SET NULL'
});

Order.belongsTo(Staff, {
  foreignKey: 'staff_id',
  as: 'staff'
});

// 10. Order & OrderItem
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// 11. OrderItem & Product
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'RESTRICT'
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items'
});

// 12. Order & Delivery (One-to-One)
Order.hasOne(Delivery, {
  foreignKey: 'order_id',
  as: 'delivery',
  onDelete: 'CASCADE'
});

Delivery.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// 13. Staff & Delivery (One-to-Many for delivery driver / personnel)
Staff.hasMany(Delivery, {
  foreignKey: 'delivery_staff_id',
  as: 'assigned_deliveries',
  onDelete: 'SET NULL'
});

Delivery.belongsTo(Staff, {
  foreignKey: 'delivery_staff_id',
  as: 'delivery_staff'
});

// 14. Order & Return (One-to-Many)
Order.hasMany(Return, {
  foreignKey: 'order_id',
  as: 'returns',
  onDelete: 'CASCADE'
});

Return.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// 15. Product & Return (One-to-Many)
Product.hasMany(Return, {
  foreignKey: 'product_id',
  as: 'returns',
  onDelete: 'RESTRICT'
});

Return.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Return.belongsTo(Product, {
  foreignKey: 'replacement_product_id',
  as: 'replacement_product'
});

// 16. ManufacturingAssignment & Staff / Product
Staff.hasMany(ManufacturingAssignment, {
  foreignKey: 'staff_id',
  as: 'manufacturing_assignments',
  onDelete: 'CASCADE'
});

ManufacturingAssignment.belongsTo(Staff, {
  foreignKey: 'staff_id',
  as: 'staff'
});

Product.hasMany(ManufacturingAssignment, {
  foreignKey: 'product_id',
  as: 'manufacturing_assignments',
  onDelete: 'SET NULL'
});

ManufacturingAssignment.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// 17. Expense & Staff
Staff.hasMany(Expense, {
  foreignKey: 'staff_id',
  as: 'expenses',
  onDelete: 'SET NULL'
});

Expense.belongsTo(Staff, {
  foreignKey: 'staff_id',
  as: 'staff'
});

// 18. Inspection & Staff (Inspector)
Staff.hasMany(Inspection, {
  foreignKey: 'inspector_id',
  as: 'inspections',
  onDelete: 'CASCADE'
});

Inspection.belongsTo(Staff, {
  foreignKey: 'inspector_id',
  as: 'inspector'
});

// 19. Inspection & Product
Product.hasMany(Inspection, {
  foreignKey: 'product_id',
  as: 'inspections',
  onDelete: 'SET NULL'
});

Inspection.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// 20. Inspection & Return
Return.hasMany(Inspection, {
  foreignKey: 'return_id',
  as: 'inspections',
  onDelete: 'SET NULL'
});

Inspection.belongsTo(Return, {
  foreignKey: 'return_id',
  as: 'return_record'
});

// 21. Inspection & Production
Production.hasMany(Inspection, {
  foreignKey: 'production_id',
  as: 'inspections',
  onDelete: 'SET NULL'
});

Inspection.belongsTo(Production, {
  foreignKey: 'production_id',
  as: 'production'
});

// 22. Staff & Notification (One-to-Many)
Staff.hasMany(Notification, {
  foreignKey: 'recipient_staff_id',
  as: 'notifications',
  onDelete: 'CASCADE'
});

Notification.belongsTo(Staff, {
  foreignKey: 'recipient_staff_id',
  as: 'recipient'
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
  CartItem,
  Inventory,
  Production,
  Order,
  OrderItem,
  Delivery,
  Return,
  ManufacturingAssignment,
  Expense,
  Inspection,
  Notification
};
