'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // 1. Create orders table
    if (!tables.includes('orders')) {
      await queryInterface.createTable('orders', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        order_number: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        customer_email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        customer_phone: {
          type: Sequelize.STRING(50),
          allowNull: true
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
        total_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        order_status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Pending'
        },
        payment_method: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Bank Transfer'
        },
        payment_status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'Pending'
        },
        payment_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        order_date: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // 2. Create order_items table
    if (!tables.includes('order_items')) {
      await queryInterface.createTable('order_items', {
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
        product_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'products',
            key: 'id'
          },
          onDelete: 'RESTRICT'
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        unit_price: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        total_price: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
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
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
  }
};
