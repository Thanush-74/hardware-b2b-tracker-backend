const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ReturnReplacement = sequelize.define("ReturnReplacement", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rma_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "orders",
            key: "id"
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "products",
            key: "id"
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id"
        }
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    condition: {
        type: DataTypes.ENUM("Damaged_In_Transit", "Defective", "Wrong_Item", "Excess_Stock"),
        defaultValue: "Defective"
    },
    request_type: {
        type: DataTypes.ENUM("RETURN_AND_REFUND", "REPLACEMENT", "REPAIR"),
        defaultValue: "REPLACEMENT"
    },
    status: {
        type: DataTypes.ENUM("Requested", "Approved", "Item_Received", "Under_Inspection", "Replacement_Dispatched", "Refunded", "Rejected"),
        defaultValue: "Requested"
    },
    resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "return_replacements"
});

module.exports = ReturnReplacement;
