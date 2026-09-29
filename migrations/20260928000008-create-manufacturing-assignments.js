'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create manufacturing_assignments table
    if (!tables.includes('manufacturing_assignments')) {
      await queryInterface.createTable('manufacturing_assignments', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        staff_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        sector: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Working'
        },
        shift: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'Day'
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

    // 2. Register 'manufacturing' screen and permissions if not already present
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'manufacturing' }
    }, ['id']);

    let screenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'manufacturing',
        name: 'Manufacturing Area',
        route: '/manufacturing',
        description: 'Employee sector tracking and manufacturing line assignments',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      screenId = inserted ? inserted.id : null;
      if (!screenId) {
        screenId = await queryInterface.rawSelect('screens', {
          where: { slug: 'manufacturing' }
        }, ['id']);
      }
    }

    if (screenId) {
      const permissions = [
        { screen_id: screenId, slug: 'manufacturing.view', name: 'View Manufacturing Area', action: 'view', description: 'View employee manufacturing sector assignments', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'manufacturing.create', name: 'Create Manufacturing Assignment', action: 'create', description: 'Assign employees to manufacturing sectors', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'manufacturing.edit', name: 'Edit Manufacturing Assignment', action: 'edit', description: 'Update manufacturing assignments and statuses', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'manufacturing.delete', name: 'Delete Manufacturing Assignment', action: 'delete', description: 'Remove manufacturing sector assignments', created_at: new Date(), updated_at: new Date() }
      ];

      for (const perm of permissions) {
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
    await queryInterface.dropTable('manufacturing_assignments');
  }
};
