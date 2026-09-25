const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    part_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    specifications: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    moq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    unit_of_measure: {
        type: DataTypes.STRING,
        defaultValue: "PCS"
    },
    lead_time_days: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    status: {
        type: DataTypes.ENUM("Active", "Discontinued", "Draft"),
        defaultValue: "Active"
    }
}, {
    tableName: "products"
});

module.exports = Product;
