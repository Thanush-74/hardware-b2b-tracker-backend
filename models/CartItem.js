const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  cart_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'carts',
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true
});

module.exports = CartItem;
