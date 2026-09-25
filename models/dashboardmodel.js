const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DashboardMetric = sequelize.define("DashboardMetric", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    metric_key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    metric_value: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: "GENERAL"
    },
    last_calculated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    metadata: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "dashboard_metrics"
});

module.exports = DashboardMetric;
