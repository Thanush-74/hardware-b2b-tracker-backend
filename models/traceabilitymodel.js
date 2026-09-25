const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const TraceabilityRecord = sequelize.define("TraceabilityRecord", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    serial_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    batch_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "products",
            key: "id"
        }
    },
    work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "manufacturing_work_orders",
            key: "id"
        }
    },
    current_stage: {
        type: DataTypes.STRING,
        defaultValue: "MANUFACTURED"
    },
    location: {
        type: DataTypes.STRING,
        defaultValue: "Production Floor"
    },
    history_log: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("In_Production", "Assembled", "Passed_QA", "In_Stock", "In_Transit", "Delivered", "Returned"),
        defaultValue: "In_Production"
    }
}, {
    tableName: "traceability_records"
});

module.exports = TraceabilityRecord;
