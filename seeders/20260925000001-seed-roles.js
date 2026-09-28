'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      { slug: 'admin', name: 'Admin', description: 'Administrator with full system access', created_at: new Date(), updated_at: new Date() },
      { slug: 'store_manager', name: 'Store Manager', description: 'Store Manager managing inventory and orders', created_at: new Date(), updated_at: new Date() },
      { slug: 'delivery', name: 'Delivery', description: 'Delivery personnel handling shipments', created_at: new Date(), updated_at: new Date() },
      { slug: 'sales', name: 'Sales', description: 'Sales representative managing customer orders', created_at: new Date(), updated_at: new Date() }
    ];

    for (const role of roles) {
      const existing = await queryInterface.rawSelect('roles', {
        where: { slug: role.slug }
      }, ['id']);

      if (!existing) {
        await queryInterface.bulkInsert('roles', [role]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
