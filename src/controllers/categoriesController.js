import { Sequelize } from 'sequelize';
import { Category, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/helpers.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Transaction,
        attributes: [],
        required: false,
        where: { deleted_at: null }
      }
    ],
    attributes: {
      include: [[Sequelize.fn('COUNT', Sequelize.col('Transactions.id')), 'transaction_count']]
    },
    group: ['Category.id'],
    order: [
      ['type', 'ASC'],
      ['name', 'ASC']
    ]
  });

  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;

  const exists = await Category.findOne({
    where: {
      user_id: req.user.id,
      name,
      type
    }
  });

  if (exists) {
    return res.status(409).json({ success: false, message: 'Category already exists', requestId: req.id });
  }

  const category = await Category.create({
    name,
    type,
    icon,
    color,
    user_id: req.user.id
  });

  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({ where: { id, user_id: req.user.id } });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found', requestId: req.id });
  }

  const { name, type, icon, color } = req.body;
  if (type && type !== category.type) {
    const txCount = await Transaction.count({ where: { category_id: category.id, deleted_at: null } });
    if (txCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot change type with existing transactions', requestId: req.id });
    }
  }

  const updates = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof type === 'string') updates.type = type;
  if (typeof icon === 'string') updates.icon = icon;
  if (typeof color === 'string') updates.color = color;

  const updated = await category.update(updates);
  return res.json({ success: true, data: updated });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({ where: { id, user_id: req.user.id } });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found', requestId: req.id });
  }

  const [affected] = await Transaction.update(
    { category_id: null },
    {
      where: { category_id: id, user_id: req.user.id }
    }
  );

  await Category.destroy({ where: { id } });
  return res.json({ message: 'Category deleted', affectedTransactions: affected });
});
