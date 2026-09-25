const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Employee = sequelize.define("Employee", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "users",
            key: "id"
        }
    },
    employee_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.ENUM("Production", "Assembly", "Quality_Assurance", "Inventory", "Logistics", "Engineering", "Management"),
        defaultValue: "Production"
    },
    designation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shift: {
        type: DataTypes.ENUM("Morning", "Evening", "Night", "Rotational"),
        defaultValue: "Morning"
    },
    status: {
        type: DataTypes.ENUM("Active", "On_Leave", "Terminated"),
        defaultValue: "Active"
    }
}, {
    tableName: "employees"
});

module.exports = Employee;
