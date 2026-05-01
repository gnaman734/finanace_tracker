import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Budget, Category, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/helpers.js';
import { buildBudgetStatus } from '../services/budgetService.js';

const getMonthRange = (monthValue) => {
  const now = new Date();
  const [year, month] = monthValue ? monthValue.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(year, (month || 1) - 1, 1);
  const end = new Date(year, (month || 1), 0);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { start, end, startStr, endStr, label: `${year}-${String(month || 1).padStart(2, '0')}` };
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { startStr, endStr, label } = getMonthRange(req.query.month);

  const totals = await Transaction.findAll({
    where: {
      user_id: req.user.id,
      deleted_at: null,
      date: { [Op.gte]: startStr, [Op.lte]: endStr }
    },
    attributes: ['type', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['type'],
    raw: true
  });

  const totalIncome = Number(totals.find((t) => t.type === 'income')?.total || 0);
  const totalExpenses = Number(totals.find((t) => t.type === 'expense')?.total || 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  const topExpenseCategories = await Transaction.findAll({
    where: {
      user_id: req.user.id,
      deleted_at: null,
      type: 'expense',
      date: { [Op.gte]: startStr, [Op.lte]: endStr }
    },
    include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    attributes: ['category_id', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['category_id', 'Category.id'],
    order: [[Sequelize.literal('total'), 'DESC']],
    limit: 5
  });

  const recentTransactions = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null },
    include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    order: [['date', 'DESC']],
    limit: 5
  });

  const budgets = await Budget.findAll({ where: { user_id: req.user.id } });
  const budgetAlerts = [];
  for (const budget of budgets) {
    const status = await buildBudgetStatus(budget, req.user.preferred_currency);
    if (status.active) {
      budgetAlerts.push({
        budget_id: budget.id,
        category_id: budget.category_id,
        spent: status.spent,
        amount: Number(budget.amount),
        percentage_used: status.percentage_used,
        remaining: status.remaining
      });
    }
  }

  res.json({
    success: true,
    data: {
      month: label,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: netSavings,
      savings_rate: savingsRate,
      top_expense_categories: topExpenseCategories,
      recent_transactions: recentTransactions,
      budget_alerts: budgetAlerts
    }
  });
});

export const getMonthlyChart = asyncHandler(async (req, res) => {
  const rows = await sequelize.query(
    `SELECT TO_CHAR(date, 'YYYY-MM') as month, type, SUM(amount_in_base) as total
     FROM transactions
     WHERE user_id = :userId AND deleted_at IS NULL
     GROUP BY month, type
     ORDER BY month`,
    {
      replacements: { userId: req.user.id },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  const map = new Map();
  for (const row of rows) {
    const entry = map.get(row.month) || { month: row.month, income: 0, expenses: 0, savings: 0 };
    if (row.type === 'income') entry.income = Number(row.total || 0);
    if (row.type === 'expense') entry.expenses = Number(row.total || 0);
    entry.savings = entry.income - entry.expenses;
    map.set(row.month, entry);
  }

  const data = Array.from(map.values()).slice(-12);
  res.json({ success: true, data });
});

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { startStr, endStr } = getMonthRange(req.query.month);

  const rows = await Transaction.findAll({
    where: {
      user_id: req.user.id,
      deleted_at: null,
      type: 'expense',
      date: { [Op.gte]: startStr, [Op.lte]: endStr }
    },
    include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
    attributes: ['category_id', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['category_id', 'Category.id'],
    order: [[Sequelize.literal('total'), 'DESC']]
  });

  const total = rows.reduce((acc, row) => acc + Number(row.get('total') || 0), 0);
  const data = rows.map((row) => {
    const amount = Number(row.get('total') || 0);
    return {
      category_id: row.category_id,
      category_name: row.Category?.name,
      color: row.Category?.color,
      amount,
      percentage: total ? Number(((amount / total) * 100).toFixed(1)) : 0
    };
  });

  res.json({ success: true, data });
});
