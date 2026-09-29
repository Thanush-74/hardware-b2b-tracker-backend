'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('inventory')) {
      await queryInterface.createTable('inventory', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        reserved_quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        location: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: 'Main Warehouse'
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

    // Populate inventory for products that don't have an inventory row yet
    const products = await queryInterface.sequelize.query(
      'SELECT id, available_quantity FROM products WHERE id NOT IN (SELECT product_id FROM inventory);',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const prod of products) {
      await queryInterface.bulkInsert('inventory', [{
        product_id: prod.id,
        quantity: prod.available_quantity || 0,
        reserved_quantity: 0,
        location: 'Main Warehouse',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory');
  }
};
