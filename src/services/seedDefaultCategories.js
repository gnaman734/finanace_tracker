import { Category } from '../models/index.js';

export const seedDefaultCategories = async (userId, { transaction } = {}) => {
  const defaults = await Category.findAll({
    where: { user_id: null, is_default: true },
    transaction
  });

  if (!defaults.length) return [];

  const rows = defaults.map((c) => ({
    user_id: userId,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    is_default: false
  }));

  return Category.bulkCreate(rows, { transaction, ignoreDuplicates: true });
};
