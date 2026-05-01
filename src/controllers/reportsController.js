import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Category, Transaction } from '../models/index.js';
import { convertAmount } from '../services/currencyService.js';
import { asyncHandler } from '../utils/helpers.js';

const getMonthBounds = (month) => {
  const now = new Date();
  const [year, mon] = month ? month.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(year, (mon || 1) - 1, 1);
  const end = new Date(year, (mon || 1), 0);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { startStr, endStr, label: `${year}-${String(mon || 1).padStart(2, '0')}` };
};

const getYearBounds = (year) => {
  const y = Number(year) || new Date().getFullYear();
  return {
    year: y,
    startStr: `${y}-01-01`,
    endStr: `${y}-12-31`
  };
};

const pctChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { startStr, endStr, label } = getMonthBounds(req.query.month);
  const prevMonth = new Date(`${startStr}T00:00:00`);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString().slice(0, 10);
  const prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().slice(0, 10);

  const totals = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
    attributes: ['type', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['type'],
    raw: true
  });

  const totalIncome = Number(totals.find((t) => t.type === 'income')?.total || 0);
  const totalExpenses = Number(totals.find((t) => t.type === 'expense')?.total || 0);

  const prevTotals = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null, date: { [Op.gte]: prevStart, [Op.lte]: prevEnd } },
    attributes: ['type', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['type'],
    raw: true
  });

  const prevIncome = Number(prevTotals.find((t) => t.type === 'income')?.total || 0);
  const prevExpenses = Number(prevTotals.find((t) => t.type === 'expense')?.total || 0);

  const categoryRows = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
    include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    attributes: ['type', 'category_id', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['type', 'category_id', 'Category.id'],
    order: [[Sequelize.literal('total'), 'DESC']]
  });

  const prevRows = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null, date: { [Op.gte]: prevStart, [Op.lte]: prevEnd } },
    attributes: ['type', 'category_id', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['type', 'category_id'],
    raw: true
  });

  const prevMap = new Map(prevRows.map((r) => [`${r.type}:${r.category_id}`, Number(r.total || 0)]));

  const categories = categoryRows.map((row) => {
    const total = Number(row.get('total') || 0);
    const prev = prevMap.get(`${row.type}:${row.category_id}`) || 0;
    return {
      category_id: row.category_id,
      category_name: row.Category?.name,
      type: row.type,
      amount: total,
      change_pct: pctChange(total, prev)
    };
  });

  res.json({
    month: label,
    summary: {
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses
    },
    categories,
    vs_previous_month: {
      income_change_pct: pctChange(totalIncome, prevIncome),
      expense_change_pct: pctChange(totalExpenses, prevExpenses)
    }
  });
});

export const getAnnualReport = asyncHandler(async (req, res) => {
  const { year, startStr, endStr } = getYearBounds(req.query.year);

  const monthly = await sequelize.query(
    `SELECT TO_CHAR(date, 'YYYY-MM') as month, type, SUM(amount_in_base) as total
     FROM transactions
     WHERE user_id = :userId AND deleted_at IS NULL AND date BETWEEN :startDate AND :endDate
     GROUP BY month, type
     ORDER BY month`,
    {
      replacements: { userId: req.user.id, startDate: startStr, endDate: endStr },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  const monthMap = new Map();
  for (const row of monthly) {
    const entry = monthMap.get(row.month) || { month: row.month, income: 0, expenses: 0, savings: 0 };
    if (row.type === 'income') entry.income = Number(row.total || 0);
    if (row.type === 'expense') entry.expenses = Number(row.total || 0);
    entry.savings = entry.income - entry.expenses;
    monthMap.set(row.month, entry);
  }

  const monthlySummaries = Array.from(monthMap.values());
  const totals = monthlySummaries.reduce(
    (acc, m) => {
      acc.income += m.income;
      acc.expenses += m.expenses;
      acc.savings += m.savings;
      return acc;
    },
    { income: 0, expenses: 0, savings: 0 }
  );

  const topCategories = await Transaction.findAll({
    where: { user_id: req.user.id, deleted_at: null, type: 'expense', date: { [Op.gte]: startStr, [Op.lte]: endStr } },
    include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    attributes: ['category_id', [Sequelize.fn('SUM', Sequelize.col('amount_in_base')), 'total']],
    group: ['category_id', 'Category.id'],
    order: [[Sequelize.literal('total'), 'DESC']],
    limit: 3
  });

  res.json({
    year,
    monthly: monthlySummaries,
    totals,
    top_categories: topCategories
  });
});

const toCsvValue = (value) => {
  const text = value === null || typeof value === 'undefined' ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const exportTransactions = asyncHandler(async (req, res) => {
  const { start_date, end_date, currency = 'USD' } = req.query;
  const where = { user_id: req.user.id, deleted_at: null };
  if (start_date || end_date) {
    where.date = {};
    if (start_date) where.date[Op.gte] = start_date;
    if (end_date) where.date[Op.lte] = end_date;
  }

  const transactions = await Transaction.findAll({
    where,
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [['date', 'DESC']]
  });

  res.setHeader('Content-Type', 'text/csv');
  const filename = `transactions-${start_date || 'all'}-${end_date || 'all'}.csv`;
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  res.write('Date,Description,Type,Category,Amount,Currency,Amount (Base),Exchange Rate\n');

  for (const tx of transactions) {
    let converted = Number(tx.amount);
    let targetCurrency = currency.toUpperCase();
    try {
      const conversion = await convertAmount(tx.amount, tx.currency, targetCurrency);
      converted = Number(conversion.convertedAmount);
      if (conversion.estimated) targetCurrency = tx.currency;
    } catch {
      targetCurrency = tx.currency;
      converted = Number(tx.amount);
    }

    const row = [
      tx.date,
      tx.description,
      tx.type,
      tx.Category?.name || '',
      converted,
      targetCurrency,
      Number(tx.amount_in_base),
      Number(tx.exchange_rate)
    ].map(toCsvValue);
    res.write(`${row.join(',')}\n`);
  }

  res.end();
});
