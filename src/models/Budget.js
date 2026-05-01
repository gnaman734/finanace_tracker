import { DataTypes } from 'sequelize';

export const initBudgetModel = (sequelize) => {
  const Budget = sequelize.define(
    'Budget',
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
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false
      },
      period: {
        type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
        allowNull: false
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      tableName: 'budgets',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'category_id', 'period']
        }
      ]
    }
  );

  return Budget;
};
