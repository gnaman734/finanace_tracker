'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false
      },
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      amount_in_base: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        defaultValue: 1.0
      },
      exchange_rate_estimated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      receipt_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_refund: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addConstraint('transactions', {
      fields: ['amount'],
      type: 'check',
      where: {
        amount: {
          [Sequelize.Op.gte]: 0.0001
        }
      },
      name: 'transactions_amount_min_check'
    });

    await queryInterface.addIndex('transactions', ['user_id'], { name: 'transactions_user_id_idx' });
    await queryInterface.addIndex('transactions', ['user_id', 'date'], {
      name: 'transactions_user_id_date_idx'
    });
    await queryInterface.addIndex('transactions', ['user_id', 'category_id', 'deleted_at'], {
      name: 'transactions_user_id_category_id_deleted_at_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_type";');
  }
};
