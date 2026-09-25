const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssemblyStage = sequelize.define("AssemblyStage", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assembly_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "manufacturing_work_orders",
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
    stage_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    assigned_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "employees",
            key: "id"
        }
    },
    status: {
        type: DataTypes.ENUM("Pending", "In_Progress", "Passed", "Rework_Required", "Completed"),
        defaultValue: "Pending"
    },
    cycle_time_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "assembly_stages"
});

module.exports = AssemblyStage;
