import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Receipt = sequelize.define('Receipt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  filePath: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  extractedText: { type: DataTypes.TEXT }
});
