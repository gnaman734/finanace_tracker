import { Op } from 'sequelize';
import { Category, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  buildTransactionWhere,
  createUserTransaction,
  findDuplicateTransaction,
  getUserTransactions,
  updateUserTransaction,
  validateTransactionDate
} from '../services/transactionService.js';
import { checkBudgetAlerts } from '../services/budgetService.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const roundAmount = (value) => {
  if (value === null || typeof value === 'undefined') return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return Math.round(num * 100) / 100;
};

const normalizeCurrency = (code) => (typeof code === 'string' ? code.toUpperCase() : code);

const parsePagination = (page, limit) => {
  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: p, limit: l, offset: (p - 1) * l };
};

const buildSort = (sortBy = 'date', sortOrder = 'desc') => {
  const allowedSort = ['date', 'amount', 'created_at'];
  const allowedOrder = ['asc', 'desc'];
  const column = allowedSort.includes(sortBy) ? sortBy : 'date';
  const columnMap = { created_at: 'createdAt' };
  const resolvedColumn = columnMap[column] || column;
  const direction = allowedOrder.includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
  return [[resolvedColumn, direction]];
};

const ensureCategoryMatches = async ({ categoryId, userId, type }) => {
  if (!categoryId) return null;
  const category = await Category.findOne({ where: { id: categoryId, user_id: userId } });
  if (!category) return { error: 'Category not found' };
  if (type && category.type !== type) return { error: 'Category type does not match transaction type' };
  return { category };
};

export const listTransactions = asyncHandler(async (req, res) => {
  const {
    type,
    category_id,
    start_date,
    end_date,
    currency,
    min_amount,
    max_amount,
    search,
    page,
    limit,
    sort_by,
    sort_order
  } = req.query;

  const { page: currentPage, limit: pageLimit, offset } = parsePagination(page, limit);
  const where = buildTransactionWhere(req.user.id, {
    type,
    category_id,
    start_date,
    end_date,
    currency: normalizeCurrency(currency),
    min_amount,
    max_amount,
    search
  });

  const order = buildSort(sort_by, sort_order);

  const data = await getUserTransactions(req.user.id, { where, limit: pageLimit, offset, order });
  const totalPages = Math.ceil(data.count / pageLimit) || 1;

  const formatted = data.rows.map((row) => {
    const json = row.toJSON();
    return {
      ...json,
      amount: roundAmount(json.amount),
      amount_in_base: roundAmount(json.amount_in_base),
      exchange_rate: roundAmount(json.exchange_rate)
    };
  });

  res.json({
    success: true,
    data: formatted,
    pagination: {
      total: data.count,
      page: currentPage,
      limit: pageLimit,
      totalPages
    }
  });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const {
    category_id,
    type,
    amount,
    currency,
    description,
    date,
    is_refund
  } = req.body;

  if (Number(amount) <= 0) {
    return res.status(422).json({ success: false, message: 'Amount must be greater than 0', requestId: req.id });
  }

  const normalizedCurrency = normalizeCurrency(currency);
  if (!/^[A-Z]{3}$/.test(normalizedCurrency || '')) {
    return res.status(422).json({ success: false, message: 'Invalid currency code', requestId: req.id });
  }

  if (!validateTransactionDate(date)) {
    return res.status(422).json({ success: false, message: 'Invalid date', requestId: req.id });
  }

  const categoryCheck = await ensureCategoryMatches({
    categoryId: category_id,
    userId: req.user.id,
    type
  });
  if (categoryCheck?.error) {
    return res.status(400).json({ success: false, message: categoryCheck.error, requestId: req.id });
  }

  const duplicate = await findDuplicateTransaction(req.user.id, { amount, date, description });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate transaction detected',
      existingId: duplicate.id
    });
  }

  const transaction = await createUserTransaction(
    req.user.id,
    {
      category_id: category_id || null,
      type,
      amount,
      currency: normalizedCurrency,
      description,
      date,
      is_refund: Boolean(is_refund)
    },
    req.user.preferred_currency
  );

  await checkBudgetAlerts(req.user.id, category_id || null);

  res.status(201).json({
    success: true,
    data: {
      ...transaction.toJSON(),
      amount: roundAmount(transaction.amount),
      amount_in_base: roundAmount(transaction.amount_in_base),
      exchange_rate: roundAmount(transaction.exchange_rate)
    }
  });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
    include: [
      {
        model: Category,
        attributes: ['id', 'name', 'icon', 'color']
      }
    ]
  });

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  return res.json({
    success: true,
    data: {
      ...transaction.toJSON(),
      amount: roundAmount(transaction.amount),
      amount_in_base: roundAmount(transaction.amount_in_base),
      exchange_rate: roundAmount(transaction.exchange_rate)
    }
  });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
  });

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  const updates = {};
  if (typeof req.body.description === 'string') updates.description = req.body.description;
  if (typeof req.body.type === 'string') updates.type = req.body.type;
  if (typeof req.body.amount !== 'undefined') updates.amount = req.body.amount;
  if (typeof req.body.currency === 'string') updates.currency = normalizeCurrency(req.body.currency);
  if (typeof req.body.date === 'string') updates.date = req.body.date;
  if (typeof req.body.is_refund !== 'undefined') updates.is_refund = Boolean(req.body.is_refund);
  if (typeof req.body.category_id !== 'undefined') updates.category_id = req.body.category_id || null;

  if (typeof updates.amount !== 'undefined' && Number(updates.amount) <= 0) {
    return res.status(422).json({ success: false, message: 'Amount must be greater than 0', requestId: req.id });
  }

  if (typeof updates.currency !== 'undefined' && !/^[A-Z]{3}$/.test(updates.currency)) {
    return res.status(422).json({ success: false, message: 'Invalid currency code', requestId: req.id });
  }

  if (typeof updates.date !== 'undefined' && !validateTransactionDate(updates.date)) {
    return res.status(422).json({ success: false, message: 'Invalid date', requestId: req.id });
  }

  const nextType = updates.type || transaction.type;
  const categoryId = typeof updates.category_id !== 'undefined' ? updates.category_id : transaction.category_id;

  if (categoryId) {
    const categoryCheck = await ensureCategoryMatches({
      categoryId,
      userId: req.user.id,
      type: nextType
    });
    if (categoryCheck?.error) {
      return res.status(400).json({ success: false, message: categoryCheck.error, requestId: req.id });
    }
  }

  const updated = await updateUserTransaction(transaction, updates, req.user.preferred_currency);

  return res.json({
    success: true,
    data: {
      ...updated.toJSON(),
      amount: roundAmount(updated.amount),
      amount_in_base: roundAmount(updated.amount_in_base),
      exchange_rate: roundAmount(updated.exchange_rate)
    }
  });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const [affected] = await Transaction.update(
    { deleted_at: new Date() },
    { where: { id: req.params.id, user_id: req.user.id, deleted_at: { [Op.is]: null } } }
  );

  if (!affected) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  return res.json({ success: true, message: 'Transaction deleted' });
});
