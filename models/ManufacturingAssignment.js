const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ManufacturingAssignment = sequelize.define('ManufacturingAssignment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  staff_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  sector: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  product_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Working' // Working, On Break, Completed, Reassigned, Inactive
  },
  shift: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Day' // Day, Evening, Night
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'manufacturing_assignments',
  underscored: true,
  timestamps: true
});

module.exports = ManufacturingAssignment;
