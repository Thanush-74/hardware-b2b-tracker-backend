const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Return = sequelize.define('Return', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  return_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  return_reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  return_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Requested',
    validate: {
      isIn: [['Requested', 'Approved', 'Rejected', 'Received', 'Replaced', 'Refunded', 'Completed']]
    }
  },
  replacement_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  replacement_product_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  replacement_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'returns',
  timestamps: true,
  underscored: true
});

module.exports = Return;
