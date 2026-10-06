const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  recipient_staff_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'staff',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'system'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true
});

module.exports = Notification;
