const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inspection = sequelize.define('Inspection', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  inspector_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  product_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  return_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  production_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  inspection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  item_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Finished Good'
  },
  batch_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quantity_inspected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  passed_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  failed_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  result: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pending' // 'Passed', 'Failed', 'Repairable', 'Replacement Required', 'Pending', 'Approved'
  },
  defect_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  severity: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Low' // 'Low', 'Medium', 'High', 'Critical'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'inspections',
  underscored: true,
  timestamps: true
});

module.exports = Inspection;
