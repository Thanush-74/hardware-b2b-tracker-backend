'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create returns table
    if (!tables.includes('returns')) {
      await queryInterface.createTable('returns', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        return_number: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        order_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'orders',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'RESTRICT'
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        return_reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        return_date: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Requested'
        },
        replacement_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        replacement_product_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        replacement_quantity: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
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

    // 2. Register 'returns' screen and permissions if not already present
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'returns' }
    }, ['id']);

    let returnScreenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'returns',
        name: 'Return & Replacement',
        route: '/returns',
        description: 'Customer returns, defect logging, and hardware replacements',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      returnScreenId = inserted ? inserted.id : null;
      if (!returnScreenId) {
        returnScreenId = await queryInterface.rawSelect('screens', {
          where: { slug: 'returns' }
        }, ['id']);
      }
    }

    if (returnScreenId) {
      const returnPermissions = [
        { screen_id: returnScreenId, slug: 'returns.view', name: 'View Returns', action: 'view', description: 'View customer returns and replacements', created_at: new Date(), updated_at: new Date() },
        { screen_id: returnScreenId, slug: 'returns.create', name: 'Create Returns', action: 'create', description: 'Log a new return or replacement request', created_at: new Date(), updated_at: new Date() },
        { screen_id: returnScreenId, slug: 'returns.edit', name: 'Edit Returns', action: 'edit', description: 'Update return status and replacement details', created_at: new Date(), updated_at: new Date() },
        { screen_id: returnScreenId, slug: 'returns.delete', name: 'Delete Returns', action: 'delete', description: 'Remove return requests', created_at: new Date(), updated_at: new Date() }
      ];

      for (const perm of returnPermissions) {
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
    await queryInterface.dropTable('returns');
  }
};
