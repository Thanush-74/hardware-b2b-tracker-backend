'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create expenses table
    if (!tables.includes('expenses')) {
      await queryInterface.createTable('expenses', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        staff_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Expense' // 'Expense' or 'Income'
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        payment_method: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'Bank Transfer'
        },
        reference_no: {
          type: Sequelize.STRING(100),
          allowNull: true
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

    // 2. Register 'expenses' screen and permissions if not already present
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'expenses' }
    }, ['id']);

    let screenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'expenses',
        name: 'Expenses & Financials',
        route: '/expenses',
        description: 'Track company operational expenses, revenues, and balance sheets',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      screenId = inserted ? inserted.id : null;
      if (!screenId) {
        screenId = await queryInterface.rawSelect('screens', {
          where: { slug: 'expenses' }
        }, ['id']);
      }
    }

    if (screenId) {
      const permissions = [
        { screen_id: screenId, slug: 'expenses.view', name: 'View Expenses', action: 'view', description: 'View financial records and expense summary', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'expenses.create', name: 'Create Expense', action: 'create', description: 'Record new expenses or income entries', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'expenses.edit', name: 'Edit Expense', action: 'edit', description: 'Modify existing expense records', created_at: new Date(), updated_at: new Date() },
        { screen_id: screenId, slug: 'expenses.delete', name: 'Delete Expense', action: 'delete', description: 'Remove expense records', created_at: new Date(), updated_at: new Date() }
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
    await queryInterface.dropTable('expenses');
  }
};
