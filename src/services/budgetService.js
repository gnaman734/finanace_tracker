import { Op, Sequelize } from 'sequelize';
import { Budget, Category, Notification, Transaction, User } from '../models/index.js';
import { convertAmount } from './currencyService.js';
import { sendBudgetOverrunEmail } from './emailService.js';

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const toDateOnly = (value) => (value ? new Date(`${value}T00:00:00`) : null);

const computePeriodEnd = (startDate, period) => {
  if (!startDate) return null;
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  switch (period) {
    case 'weekly':
      return addDays(startDate, 6);
    case 'yearly':
      return new Date(year, 11, 31);
    case 'monthly':
    default:
      return new Date(year, month + 1, 0);
  }
};

const getBudgetRange = (budget, referenceDate = new Date()) => {
  const start = toDateOnly(budget.start_date);
  const end = budget.end_date ? toDateOnly(budget.end_date) : computePeriodEnd(start, budget.period);
  const active = start && referenceDate >= start && (!end || referenceDate <= endOfDay(end));
  return { start, end, active };
};

const convertBudgetAmountToBase = async (budgetAmount, budgetCurrency, baseCurrency) => {
  if (!budgetCurrency || !baseCurrency || budgetCurrency === baseCurrency) {
    return Number(budgetAmount);
  }
  try {
    const conversion = await convertAmount(budgetAmount, budgetCurrency, baseCurrency);
    return Number(conversion.convertedAmount);
  } catch {
    return Number(budgetAmount);
  }
};

export const calculateBudgetSpend = async (budget, baseCurrency) => {
  const { start, end } = getBudgetRange(budget);
  if (!start) return { spent: 0, start, end };

  const total = await Transaction.sum('amount_in_base', {
    where: {
      user_id: budget.user_id,
      category_id: budget.category_id,
      type: 'expense',
      deleted_at: null,
      date: {
        [Op.gte]: start.toISOString().slice(0, 10),
        ...(end ? { [Op.lte]: end.toISOString().slice(0, 10) } : {})
      }
    }
  });

  const spent = Number(total || 0);
  return { spent, start, end };
};

export const buildBudgetStatus = async (budget, baseCurrency) => {
  const { spent, start, end } = await calculateBudgetSpend(budget, baseCurrency);
  const { active } = getBudgetRange(budget);
  const amountBase = await convertBudgetAmountToBase(budget.amount, budget.currency, baseCurrency);
  const remaining = Math.max(amountBase - spent, 0);
  const percentage_used = amountBase ? (spent / amountBase) * 100 : 0;

  return {
    ...budget.toJSON(),
    spent,
    remaining,
    percentage_used: Number(percentage_used.toFixed(1)),
    period_start: start ? start.toISOString().slice(0, 10) : null,
    period_end: end ? end.toISOString().slice(0, 10) : null,
    active
  };
};

export const listBudgetsWithStatus = async (userId) => {
  const user = await User.findByPk(userId);
  const baseCurrency = user?.preferred_currency || 'USD';

  const budgets = await Budget.findAll({
    where: { user_id: userId },
    include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    order: [['createdAt', 'DESC']]
  });

  const enriched = [];
  for (const budget of budgets) {
    enriched.push(await buildBudgetStatus(budget, baseCurrency));
  }
  return enriched;
};

export const getBudgetsWithStatusAndLevel = async (userId) => {
  const budgets = await listBudgetsWithStatus(userId);
  return budgets.map((budget) => {
    const percent = Number(budget.percentage_used);
    let status = 'ok';
    if (percent >= 100) status = 'exceeded';
    else if (percent >= 80) status = 'warning';
    return { ...budget, status };
  });
};

export const checkBudgetAlerts = async (userId, categoryId) => {
  if (!categoryId) return null;
  const user = await User.findByPk(userId);
  if (!user) return null;

  const budgets = await Budget.findAll({ where: { user_id: userId, category_id: categoryId } });
  if (!budgets.length) return null;

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  for (const budget of budgets) {
    const { active } = getBudgetRange(budget, today);
    if (!active) continue;

    const status = await buildBudgetStatus(budget, user.preferred_currency);
    const percent = Number(status.percentage_used);
    if (percent < 80) continue;

    const notificationType = percent >= 100 ? 'budget_overrun' : 'budget_warning';

    const existing = await Notification.findOne({
      where: {
        user_id: userId,
        type: notificationType,
        created_at: { [Op.gte]: dayStart, [Op.lte]: dayEnd },
        [Op.and]: [
          Sequelize.where(Sequelize.json('metadata.category_id'), categoryId),
          Sequelize.where(Sequelize.json('metadata.budget_id'), budget.id)
        ]
      }
    });

    if (existing) continue;

    const title = percent >= 100 ? 'Budget exceeded' : 'Budget warning';
    const message =
      percent >= 100
        ? `You have exceeded your budget for this category (${status.percentage_used}% used).`
        : `You have used ${status.percentage_used}% of your budget for this category.`;

    await Notification.create({
      user_id: userId,
      type: notificationType,
      title,
      message,
      metadata: { category_id: categoryId, budget_id: budget.id, percentage_used: status.percentage_used }
    });

    if (percent >= 100) {
      await sendBudgetOverrunEmail({ user, budget, percentage: status.percentage_used });
    }
  }

  return true;
};
