'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create productions table if not exists
    if (!tables.includes('productions')) {
      await queryInterface.createTable('productions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        quantity_planned: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        quantity_producing: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        quantity_completed: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        weekly_capacity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        expected_completion_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Planned'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // 2. Register 'production' screen and permissions if not already present
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'production' }
    }, ['id']);

    let productionScreenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'production',
        name: 'Production',
        route: '/production',
        description: 'Hardware manufacturing and production planning',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      productionScreenId = inserted ? inserted.id : null;
      if (!productionScreenId) {
        productionScreenId = await queryInterface.rawSelect('screens', {
          where: { slug: 'production' }
        }, ['id']);
      }
    }

    if (productionScreenId) {
      const productionPermissions = [
        { screen_id: productionScreenId, slug: 'production.view', name: 'View Production', action: 'view', description: 'View production schedules and batches', created_at: new Date(), updated_at: new Date() },
        { screen_id: productionScreenId, slug: 'production.create', name: 'Create Production', action: 'create', description: 'Schedule new production runs', created_at: new Date(), updated_at: new Date() },
        { screen_id: productionScreenId, slug: 'production.edit', name: 'Edit Production', action: 'edit', description: 'Update production progress and statuses', created_at: new Date(), updated_at: new Date() },
        { screen_id: productionScreenId, slug: 'production.delete', name: 'Delete Production', action: 'delete', description: 'Cancel production runs', created_at: new Date(), updated_at: new Date() }
      ];

      for (const perm of productionPermissions) {
        const existing = await queryInterface.rawSelect('permissions', {
          where: { slug: perm.slug }
        }, ['id']);
        if (!existing) {
          await queryInterface.bulkInsert('permissions', [perm]);
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('productions');
  }
};
