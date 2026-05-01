import { DataTypes } from 'sequelize';

export const initTransactionModel = (sequelize) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.0001
        }
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      amount_in_base: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        defaultValue: 1.0
      },
      exchange_rate_estimated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      receipt_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_refund: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'transactions',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['user_id', 'date'] },
        { fields: ['user_id', 'category_id', 'deleted_at'] }
      ]
    }
  );

  return Transaction;
};
