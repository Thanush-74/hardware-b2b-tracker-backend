const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  staff_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'staff',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'carts',
  timestamps: true,
  underscored: true
});

module.exports = Cart;
