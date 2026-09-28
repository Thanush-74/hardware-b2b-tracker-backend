const { sequelize } = require('../config/database');
const Role = require('./Role');
const Screen = require('./Screen');
const Staff = require('./Staff');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');

// Associations

// 1. Staff & Role
Staff.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
  onDelete: 'RESTRICT'
});

Role.hasMany(Staff, {
  foreignKey: 'role_id',
  as: 'staff'
});

// 2. Screen & Permission
Screen.hasMany(Permission, {
  foreignKey: 'screen_id',
  as: 'permissions',
  onDelete: 'CASCADE'
});

Permission.belongsTo(Screen, {
  foreignKey: 'screen_id',
  as: 'screen'
});

// 3. Role & Permission (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

module.exports = {
  sequelize,
  Role,
  Screen,
  Staff,
  Permission,
  RolePermission
};
