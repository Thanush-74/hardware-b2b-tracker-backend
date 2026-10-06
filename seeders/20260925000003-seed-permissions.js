'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const screens = await queryInterface.sequelize.query(
      'SELECT id, slug FROM screens;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const screenMap = {};
    screens.forEach(s => {
      screenMap[s.slug] = s.id;
    });

    const permissions = [
      // Dashboard
      { screen_slug: 'dashboard', slug: 'dashboard.view', name: 'View Dashboard', action: 'view', description: 'View dashboard metrics and analytics' },

      // Staff
      { screen_slug: 'staff', slug: 'staff.view', name: 'View Staff', action: 'view', description: 'View staff members' },
      { screen_slug: 'staff', slug: 'staff.create', name: 'Create Staff', action: 'create', description: 'Create new staff members' },
      { screen_slug: 'staff', slug: 'staff.edit', name: 'Edit Staff', action: 'edit', description: 'Edit staff member details' },
      { screen_slug: 'staff', slug: 'staff.delete', name: 'Delete Staff', action: 'delete', description: 'Delete or deactivate staff members' },

      // Products
      { screen_slug: 'products', slug: 'products.view', name: 'View Products', action: 'view', description: 'View product catalog' },
      { screen_slug: 'products', slug: 'products.create', name: 'Create Products', action: 'create', description: 'Add new products' },
      { screen_slug: 'products', slug: 'products.edit', name: 'Edit Products', action: 'edit', description: 'Edit existing products' },
      { screen_slug: 'products', slug: 'products.delete', name: 'Delete Products', action: 'delete', description: 'Delete products from catalog' },

      // Inventory
      { screen_slug: 'inventory', slug: 'inventory.view', name: 'View Inventory', action: 'view', description: 'View stock levels' },
      { screen_slug: 'inventory', slug: 'inventory.edit', name: 'Edit Inventory', action: 'edit', description: 'Update stock levels and inventory' },

      // Orders
      { screen_slug: 'orders', slug: 'orders.view', name: 'View Orders', action: 'view', description: 'View orders' },
      { screen_slug: 'orders', slug: 'orders.create', name: 'Create Orders', action: 'create', description: 'Create new orders' },
      { screen_slug: 'orders', slug: 'orders.edit', name: 'Edit Orders', action: 'edit', description: 'Edit orders and line items' },
      { screen_slug: 'orders', slug: 'orders.delete', name: 'Delete Orders', action: 'delete', description: 'Cancel or delete orders' },

      // Deliveries
      { screen_slug: 'deliveries', slug: 'deliveries.view', name: 'View Deliveries', action: 'view', description: 'View delivery schedules' },
      { screen_slug: 'deliveries', slug: 'deliveries.create', name: 'Create Deliveries', action: 'create', description: 'Schedule new deliveries' },
      { screen_slug: 'deliveries', slug: 'deliveries.edit', name: 'Edit Deliveries', action: 'edit', description: 'Update delivery status and routes' },
      { screen_slug: 'deliveries', slug: 'deliveries.delete', name: 'Delete Deliveries', action: 'delete', description: 'Cancel deliveries' },

      // Cart
      { screen_slug: 'cart', slug: 'cart.view', name: 'View Cart', action: 'view', description: 'View cart items and totals' },
      { screen_slug: 'cart', slug: 'cart.edit', name: 'Edit Cart', action: 'edit', description: 'Modify cart items and quantities' },

      // Production
      { screen_slug: 'production', slug: 'production.view', name: 'View Production', action: 'view', description: 'View production batches and capacity' },
      { screen_slug: 'production', slug: 'production.create', name: 'Create Production', action: 'create', description: 'Schedule new production batches' },
      { screen_slug: 'production', slug: 'production.edit', name: 'Edit Production', action: 'edit', description: 'Update production status and quantities' },

      // Returns
      { screen_slug: 'returns', slug: 'returns.view', name: 'View Returns', action: 'view', description: 'View return requests and replacements' },
      { screen_slug: 'returns', slug: 'returns.create', name: 'Create Returns', action: 'create', description: 'Submit new return and replacement requests' },
      { screen_slug: 'returns', slug: 'returns.edit', name: 'Edit Returns', action: 'edit', description: 'Update return status and replacement tracking' },

      // Manufacturing
      { screen_slug: 'manufacturing', slug: 'manufacturing.view', name: 'View Manufacturing', action: 'view', description: 'View manufacturing sector assignments' },
      { screen_slug: 'manufacturing', slug: 'manufacturing.create', name: 'Create Manufacturing', action: 'create', description: 'Assign staff to manufacturing sectors' },
      { screen_slug: 'manufacturing', slug: 'manufacturing.edit', name: 'Edit Manufacturing', action: 'edit', description: 'Update manufacturing assignments' },
      { screen_slug: 'manufacturing', slug: 'manufacturing.delete', name: 'Delete Manufacturing', action: 'delete', description: 'Remove manufacturing assignments' },

      // Expenses
      { screen_slug: 'expenses', slug: 'expenses.view', name: 'View Expenses', action: 'view', description: 'View expenses, revenue and summaries' },
      { screen_slug: 'expenses', slug: 'expenses.create', name: 'Create Expenses', action: 'create', description: 'Record company expense or revenue' },
      { screen_slug: 'expenses', slug: 'expenses.edit', name: 'Edit Expenses', action: 'edit', description: 'Update expense and revenue records' },
      { screen_slug: 'expenses', slug: 'expenses.delete', name: 'Delete Expenses', action: 'delete', description: 'Delete expense records' },

      // Quality Inspection
      { screen_slug: 'inspection', slug: 'inspection.view', name: 'View Inspections', action: 'view', description: 'View QA inspection reports' },
      { screen_slug: 'inspection', slug: 'inspection.create', name: 'Create Inspections', action: 'create', description: 'Create QA inspection records' },
      { screen_slug: 'inspection', slug: 'inspection.edit', name: 'Edit Inspections', action: 'edit', description: 'Update QA inspection results' },
      { screen_slug: 'inspection', slug: 'inspection.delete', name: 'Delete Inspections', action: 'delete', description: 'Delete QA inspection reports' }
    ];

    for (const perm of permissions) {
      const screenId = screenMap[perm.screen_slug];
      if (!screenId) continue;

      const existing = await queryInterface.rawSelect('permissions', {
        where: { slug: perm.slug }
      }, ['id']);

      if (!existing) {
        await queryInterface.bulkInsert('permissions', [{
          screen_id: screenId,
          slug: perm.slug,
          name: perm.name,
          action: perm.action,
          description: perm.description,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
