import { DataTypes } from 'sequelize';

export const initRefreshTokenModel = (sequelize) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
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
      token_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'refresh_tokens',
      underscored: true,
      timestamps: true,
      updatedAt: false
    }
  );

  return RefreshToken;
};
