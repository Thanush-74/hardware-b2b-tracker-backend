const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  delivery_staff_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'staff',
      key: 'id'
    }
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  recipient_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  recipient_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expected_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pending',
    validate: {
      isIn: [['Pending', 'Preparing', 'In Transit', 'Delivered', 'Failed', 'Cancelled']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'deliveries',
  timestamps: true,
  underscored: true
});

module.exports = Delivery;
