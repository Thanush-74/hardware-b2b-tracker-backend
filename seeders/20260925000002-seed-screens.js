'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const screens = [
      { slug: 'dashboard', name: 'Dashboard', route: '/dashboard', description: 'Overview and metrics dashboard', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'staff', name: 'Staff', route: '/staff', description: 'Staff and user management', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'products', name: 'Products', route: '/products', description: 'Product catalog management', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'cart', name: 'Cart', route: '/cart', description: 'Shopping cart and order builder', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'inventory', name: 'Inventory', route: '/inventory', description: 'Inventory and stock tracking', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'orders', name: 'Orders', route: '/orders', description: 'B2B order processing', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'deliveries', name: 'Deliveries', route: '/deliveries', description: 'Delivery and dispatch management', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'production', name: 'Production', route: '/production', description: 'Production planning and tracking', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'returns', name: 'Returns', route: '/returns', description: 'Customer returns and product replacements', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'manufacturing', name: 'Manufacturing', route: '/manufacturing', description: 'Manufacturing sector assignments', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'expenses', name: 'Expenses', route: '/expenses', description: 'Company expenses and financials', is_active: true, created_at: new Date(), updated_at: new Date() },
      { slug: 'inspection', name: 'Quality Inspection', route: '/inspection', description: 'QA inspection and defect tracking', is_active: true, created_at: new Date(), updated_at: new Date() }
    ];

    for (const screen of screens) {
      const existing = await queryInterface.rawSelect('screens', {
        where: { slug: screen.slug }
      }, ['id']);

      if (!existing) {
        await queryInterface.bulkInsert('screens', [screen]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('screens', null, {});
  }
};
