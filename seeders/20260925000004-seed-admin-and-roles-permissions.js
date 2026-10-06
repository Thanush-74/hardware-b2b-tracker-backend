'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fetch roles
    const roles = await queryInterface.sequelize.query(
      'SELECT id, slug FROM roles;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const roleMap = {};
    roles.forEach(r => { roleMap[r.slug] = r.id; });

    // 2. Fetch permissions
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, slug FROM permissions;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const permMap = {};
    permissions.forEach(p => { permMap[p.slug] = p.id; });

    const adminRoleId = roleMap['admin'];
    const storeManagerRoleId = roleMap['store_manager'];
    const deliveryRoleId = roleMap['delivery'];
    const salesRoleId = roleMap['sales'];

    // 3. Assign all permissions to Admin role
    if (adminRoleId) {
      for (const p of permissions) {
        const existing = await queryInterface.rawSelect('role_permissions', {
          where: { role_id: adminRoleId, permission_id: p.id }
        }, ['role_id']);

        if (!existing) {
          await queryInterface.bulkInsert('role_permissions', [{
            role_id: adminRoleId,
            permission_id: p.id,
            assigned_at: new Date()
          }]);
        }
      }
    }

    // 4. Assign permissions to Store Manager role
    if (storeManagerRoleId) {
      const managerPermSlugs = [
        'dashboard.view', 'staff.view',
        'products.view', 'products.create', 'products.edit',
        'inventory.view', 'inventory.edit',
        'orders.view', 'orders.create', 'orders.edit',
        'deliveries.view', 'deliveries.create', 'deliveries.edit'
      ];
      for (const slug of managerPermSlugs) {
        const permId = permMap[slug];
        if (permId) {
          const existing = await queryInterface.rawSelect('role_permissions', {
            where: { role_id: storeManagerRoleId, permission_id: permId }
          }, ['role_id']);
          if (!existing) {
            await queryInterface.bulkInsert('role_permissions', [{
              role_id: storeManagerRoleId,
              permission_id: permId,
              assigned_at: new Date()
            }]);
          }
        }
      }
    }

    // 5. Assign permissions to Delivery role
    if (deliveryRoleId) {
      const deliveryPermSlugs = [
        'dashboard.view',
        'orders.view',
        'deliveries.view', 'deliveries.create', 'deliveries.edit'
      ];
      for (const slug of deliveryPermSlugs) {
        const permId = permMap[slug];
        if (permId) {
          const existing = await queryInterface.rawSelect('role_permissions', {
            where: { role_id: deliveryRoleId, permission_id: permId }
          }, ['role_id']);
          if (!existing) {
            await queryInterface.bulkInsert('role_permissions', [{
              role_id: deliveryRoleId,
              permission_id: permId,
              assigned_at: new Date()
            }]);
          }
        }
      }
    }

    // 6. Assign permissions to Sales role
    if (salesRoleId) {
      const salesPermSlugs = [
        'dashboard.view',
        'products.view',
        'inventory.view',
        'orders.view', 'orders.create', 'orders.edit'
      ];
      for (const slug of salesPermSlugs) {
        const permId = permMap[slug];
        if (permId) {
          const existing = await queryInterface.rawSelect('role_permissions', {
            where: { role_id: salesRoleId, permission_id: permId }
          }, ['role_id']);
          if (!existing) {
            await queryInterface.bulkInsert('role_permissions', [{
              role_id: salesRoleId,
              permission_id: permId,
              assigned_at: new Date()
            }]);
          }
        }
      }
    }

    // 7. Seed initial Admin staff
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@company.com').trim().toLowerCase();
    if (process.env.NODE_ENV === 'production' && !process.env.INITIAL_ADMIN_PASSWORD) {
      throw new Error('INITIAL_ADMIN_PASSWORD environment variable is required in production mode for initial admin seeding.');
    }
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'password';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await queryInterface.rawSelect('staff', {
      where: { email: adminEmail }
    }, ['id']);

    if (!existingAdmin && adminRoleId) {
      await queryInterface.bulkInsert('staff', [{
        first_name: 'Admin',
        last_name: 'User',
        email: adminEmail,
        password_hash: passwordHash,
        role_id: adminRoleId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@company.com').trim().toLowerCase();
    await queryInterface.bulkDelete('staff', { email: adminEmail }, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};
