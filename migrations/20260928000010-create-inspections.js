'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create inspections table
    if (!tables.includes('inspections')) {
      await queryInterface.createTable('inspections', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        inspector_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id'
          },
          onDelete: 'CASCADE'
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
        return_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'returns',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        production_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'productions',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        inspection_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        item_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 'Finished Good'
        },
        batch_number: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        quantity_inspected: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        passed_quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        failed_quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        result: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Pending' // 'Passed', 'Failed', 'Repairable', 'Replacement Required', 'Pending', 'Approved'
        },
        defect_type: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        severity: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'Low' // 'Low', 'Medium', 'High', 'Critical'
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

    // 2. Register 'inspection' screen and permissions if not already present
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'inspection' }
    }, ['id']);

    let screenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'inspection',
        name: 'Quality Inspection',
        route: '/inspection',
        description: 'Quality assurance, defect analysis, and hardware inspection logs',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      screenId = inserted ? inserted.id : null;
      if (!screenId) {
        screenId = await queryInterface.rawSelect('screens', {
          where: { slug: 'inspection' }
        }, ['id']);
      }
    }

    if (screenId) {
      const permissions = [
        { screen_id: screenId, slug: 'inspection.view', name: 'View Inspections', action: 'view', description: 'View quality inspection logs and metrics', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'inspection.create', name: 'Create Inspection', action: 'create', description: 'Perform and submit QA inspections', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'inspection.edit', name: 'Edit Inspection', action: 'edit', description: 'Update inspection records and findings', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'inspection.delete', name: 'Delete Inspection', action: 'delete', description: 'Remove inspection logs', created_at: new Date(), updated_at: new Date() }
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
    await queryInterface.dropTable('inspections');
  }
};
