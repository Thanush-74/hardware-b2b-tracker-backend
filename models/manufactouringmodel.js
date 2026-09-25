const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ManufacturingWorkOrder = sequelize.define("ManufacturingWorkOrder", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    work_order_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    quantity_planned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    quantity_produced: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    quantity_rejected: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    line_number: {
        type: DataTypes.STRING,
        defaultValue: "Line-1"
    },
    status: {
        type: DataTypes.ENUM("Planned", "In_Progress", "Completed", "Halted", "Cancelled"),
        defaultValue: "Planned"
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completion_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    assigned_supervisor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "employees",
            key: "id"
        }
    },
    batch_number: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "manufacturing_work_orders"
});

module.exports = ManufacturingWorkOrder;
