'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create deliveries table
    if (!tables.includes('deliveries')) {
      await queryInterface.createTable('deliveries', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
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
        delivery_staff_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        tracking_number: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        delivery_address: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        recipient_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        recipient_phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        delivery_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        expected_delivery_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Pending'
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('deliveries');
  }
};
