'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create carts table
    await queryInterface.createTable('carts', {
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
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'active'
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

    // 2. Create cart_items table
    await queryInterface.createTable('cart_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      cart_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'carts',
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
        onDelete: 'CASCADE'
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

    // 3. Register 'cart' screen and permissions if not already existing
    const existingScreen = await queryInterface.rawSelect('screens', {
      where: { slug: 'cart' }
    }, ['id']);

    let cartScreenId = existingScreen;
    if (!existingScreen) {
      const [inserted] = await queryInterface.bulkInsert('screens', [{
        slug: 'cart',
        name: 'Cart',
        route: '/cart',
        description: 'Order cart and draft items',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { returning: ['id'] });

      cartScreenId = inserted ? inserted.id : null;
      if (!cartScreenId) {
        const fetchId = await queryInterface.rawSelect('screens', {
          where: { slug: 'cart' }
        }, ['id']);
        cartScreenId = fetchId;
      }
    }

    if (cartScreenId) {
      const cartPermissions = [
        { screen_id: cartScreenId, slug: 'cart.view', name: 'View Cart', action: 'view', description: 'View shopping cart items', created_at: new Date(), updated_at: new Date() },
        { screen_id: cartScreenId, slug: 'cart.edit', name: 'Edit Cart', action: 'edit', description: 'Add, update or clear cart items', created_at: new Date(), updated_at: new Date() }
      ];

      for (const perm of cartPermissions) {
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
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('carts');
  }
};
