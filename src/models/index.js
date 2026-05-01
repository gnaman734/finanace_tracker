import { sequelize } from '../config/db.js';
import { initUserModel } from './User.js';
import { initCategoryModel } from './Category.js';
import { initTransactionModel } from './Transaction.js';
import { initBudgetModel } from './Budget.js';
import { initNotificationModel } from './Notification.js';
import { initRefreshTokenModel } from './RefreshToken.js';
import { Receipt } from './Receipt.js';

const User = initUserModel(sequelize);
const Category = initCategoryModel(sequelize);
const Transaction = initTransactionModel(sequelize);
const Budget = initBudgetModel(sequelize);
const Notification = initNotificationModel(sequelize);
const RefreshToken = initRefreshTokenModel(sequelize);

User.hasMany(Category, { foreignKey: 'user_id' });
Category.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Transaction, { foreignKey: 'category_id' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });

User.hasMany(Budget, { foreignKey: 'user_id' });
Budget.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Budget, { foreignKey: 'category_id' });
Budget.belongsTo(Category, { foreignKey: 'category_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

export { sequelize, User, Category, Transaction, Budget, Notification, RefreshToken, Receipt };
