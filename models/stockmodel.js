const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Stock = sequelize.define("Stock", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "products",
            key: "id"
        }
    },
    warehouse_location: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Main-Warehouse-Section-A"
    },
    quantity_on_hand: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reserved_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    safety_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    },
    reorder_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20
    },
    batch_number: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: "stocks"
});

const StockMovement = sequelize.define("StockMovement", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "products",
            key: "id"
        }
    },
    type: {
        type: DataTypes.ENUM("INWARD", "OUTWARD", "ADJUSTMENT", "RESERVED", "RELEASED"),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reference_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: "stock_movements"
});

module.exports = {
    Stock,
    StockMovement
};
