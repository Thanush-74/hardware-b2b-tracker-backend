'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      recipient_staff_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'staff',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'system'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('notifications', ['recipient_staff_id']);
    await queryInterface.addIndex('notifications', ['recipient_staff_id', 'is_read']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
