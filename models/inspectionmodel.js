const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const InspectionReport = sequelize.define("InspectionReport", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inspection_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    entity_type: {
        type: DataTypes.ENUM("RAW_MATERIAL", "ASSEMBLY", "FINISHED_PRODUCT"),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inspector_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "employees",
            key: "id"
        }
    },
    total_inspected: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    passed_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    defect_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    defect_details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("Passed", "Failed", "Conditional_Pass", "Under_Review"),
        defaultValue: "Under_Review"
    },
    test_parameters: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "inspection_reports"
});

module.exports = InspectionReport;
