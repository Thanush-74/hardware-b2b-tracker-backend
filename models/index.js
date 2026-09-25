const { sequelize } = require("../config/db");
const User = require("./authmodel");
const Employee = require("./employeemodel");
const Product = require("./productmodel");
const { Stock, StockMovement } = require("./stockmodel");
const CartItem = require("./cartmodel");
const { Order, OrderItem } = require("./ordermodel");
const ManufacturingWorkOrder = require("./manufactouringmodel");
const AssemblyStage = require("./assemblymodel");
const InspectionReport = require("./inspectionmodel");
const TraceabilityRecord = require("./traceabilitymodel");
const DeliveryShipment = require("./deliverymodel");
const ReturnReplacement = require("./returnandreplacementmodel");
const DashboardMetric = require("./dashboardmodel");

// User Associations
User.hasOne(Employee, { foreignKey: "user_id", as: "employee_profile" });
Employee.belongsTo(User, { foreignKey: "user_id", as: "user_account" });

User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "customer" });

User.hasMany(CartItem, { foreignKey: "user_id", as: "cart_items" });
CartItem.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(ReturnReplacement, { foreignKey: "user_id", as: "returns" });
ReturnReplacement.belongsTo(User, { foreignKey: "user_id", as: "customer" });

// Product Associations
Product.hasMany(Stock, { foreignKey: "product_id", as: "stocks" });
Stock.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(StockMovement, { foreignKey: "product_id", as: "stock_movements" });
StockMovement.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(CartItem, { foreignKey: "product_id", as: "cart_items" });
CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(ManufacturingWorkOrder, { foreignKey: "product_id", as: "work_orders" });
ManufacturingWorkOrder.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(AssemblyStage, { foreignKey: "product_id", as: "assembly_stages" });
AssemblyStage.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(TraceabilityRecord, { foreignKey: "product_id", as: "traceability_records" });
TraceabilityRecord.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(ReturnReplacement, { foreignKey: "product_id", as: "returns" });
ReturnReplacement.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// Order Associations
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Order.hasMany(ManufacturingWorkOrder, { foreignKey: "order_id", as: "manufacturing_orders" });
ManufacturingWorkOrder.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Order.hasMany(DeliveryShipment, { foreignKey: "order_id", as: "shipments" });
DeliveryShipment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Order.hasMany(ReturnReplacement, { foreignKey: "order_id", as: "returns" });
ReturnReplacement.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Manufacturing Associations
ManufacturingWorkOrder.hasMany(AssemblyStage, { foreignKey: "work_order_id", as: "assembly_steps" });
AssemblyStage.belongsTo(ManufacturingWorkOrder, { foreignKey: "work_order_id", as: "work_order" });

ManufacturingWorkOrder.hasMany(TraceabilityRecord, { foreignKey: "work_order_id", as: "traceability_items" });
TraceabilityRecord.belongsTo(ManufacturingWorkOrder, { foreignKey: "work_order_id", as: "work_order" });

// Employee Associations
Employee.hasMany(ManufacturingWorkOrder, { foreignKey: "assigned_supervisor_id", as: "supervised_work_orders" });
ManufacturingWorkOrder.belongsTo(Employee, { foreignKey: "assigned_supervisor_id", as: "supervisor" });

Employee.hasMany(AssemblyStage, { foreignKey: "assigned_employee_id", as: "assigned_assemblies" });
AssemblyStage.belongsTo(Employee, { foreignKey: "assigned_employee_id", as: "operator" });

Employee.hasMany(InspectionReport, { foreignKey: "inspector_id", as: "inspections" });
InspectionReport.belongsTo(Employee, { foreignKey: "inspector_id", as: "inspector" });

Employee.hasMany(DeliveryShipment, { foreignKey: "driver_id", as: "deliveries" });
DeliveryShipment.belongsTo(Employee, { foreignKey: "driver_id", as: "driver" });

module.exports = {
    sequelize,
    User,
    Employee,
    Product,
    Stock,
    StockMovement,
    CartItem,
    Order,
    OrderItem,
    ManufacturingWorkOrder,
    AssemblyStage,
    InspectionReport,
    TraceabilityRecord,
    DeliveryShipment,
    ReturnReplacement,
    DashboardMetric
};
