'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'tag'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#6366f1'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addConstraint('categories', {
      fields: ['user_id', 'name', 'type'],
      type: 'unique',
      name: 'categories_user_id_name_type_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_categories_type";');
  }
};
