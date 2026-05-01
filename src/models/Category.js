import { DataTypes } from 'sequelize';

export const initCategoryModel = (sequelize) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'tag'
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#6366f1'
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      tableName: 'categories',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'name', 'type']
        }
      ]
    }
  );

  return Category;
};
