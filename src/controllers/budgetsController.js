import { Budget } from '../models/index.js';
import { asyncHandler } from '../utils/helpers.js';
import { getBudgetsWithStatusAndLevel, listBudgetsWithStatus } from '../services/budgetService.js';

export const listBudgets = asyncHandler(async (req, res) => {
  const budgets = await listBudgetsWithStatus(req.user.id);
  res.json({ success: true, data: budgets });
});

export const createBudget = asyncHandler(async (req, res) => {
  const { category_id, amount, currency, period, start_date, end_date } = req.body;

  const exists = await Budget.findOne({
    where: {
      user_id: req.user.id,
      category_id,
      period
    }
  });

  if (exists) {
    return res.status(409).json({ success: false, message: 'Budget already exists', requestId: req.id });
  }

  const budget = await Budget.create({
    user_id: req.user.id,
    category_id,
    amount,
    currency: currency?.toUpperCase(),
    period,
    start_date,
    end_date: end_date || null
  });

  res.status(201).json({ success: true, data: budget });
});

export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findOne({ where: { id, user_id: req.user.id } });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found', requestId: req.id });
  }

  const updates = {};
  if (typeof req.body.category_id !== 'undefined') updates.category_id = req.body.category_id;
  if (typeof req.body.amount !== 'undefined') updates.amount = req.body.amount;
  if (typeof req.body.currency === 'string') updates.currency = req.body.currency.toUpperCase();
  if (typeof req.body.period === 'string') updates.period = req.body.period;
  if (typeof req.body.start_date === 'string') updates.start_date = req.body.start_date;
  if (typeof req.body.end_date !== 'undefined') updates.end_date = req.body.end_date || null;

  const updated = await budget.update(updates);
  return res.json({ success: true, data: updated });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findOne({ where: { id, user_id: req.user.id } });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found', requestId: req.id });
  }

  await budget.destroy();
  return res.json({ success: true, message: 'Budget deleted' });
});

export const getBudgetStatus = asyncHandler(async (req, res) => {
  const statuses = await getBudgetsWithStatusAndLevel(req.user.id);
  res.json({ success: true, data: statuses });
});
