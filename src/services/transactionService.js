import { Op } from 'sequelize';
import { Category, Transaction } from '../models/index.js';
import { convertAmount } from './currencyService.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const findDuplicateTransaction = async (userId, { amount, date, description }) =>
  Transaction.findOne({
    where: {
      user_id: userId,
      amount,
      date,
      description,
      deleted_at: null,
      createdAt: { [Op.gte]: new Date(Date.now() - 30 * 1000) }
    },
    order: [['createdAt', 'DESC']]
  });

export const buildTransactionWhere = (userId, filters) => {
  const where = { user_id: userId, deleted_at: null };

  if (filters.type) where.type = filters.type;
  if (filters.category_id) where.category_id = filters.category_id;
  if (filters.currency) where.currency = filters.currency;

  if (filters.start_date || filters.end_date) {
    where.date = {};
    if (filters.start_date) where.date[Op.gte] = filters.start_date;
    if (filters.end_date) where.date[Op.lte] = filters.end_date;
  }

  if (filters.min_amount || filters.max_amount) {
    where.amount = {};
    if (filters.min_amount) where.amount[Op.gte] = filters.min_amount;
    if (filters.max_amount) where.amount[Op.lte] = filters.max_amount;
  }

  if (filters.search) {
    where.description = { [Op.iLike]: `%${filters.search}%` };
  }

  return where;
};

export const getUserTransactions = async (userId, { where, limit, offset, order }) =>
  Transaction.findAndCountAll({
    where,
    include: [
      {
        model: Category,
        attributes: ['id', 'name', 'icon', 'color']
      }
    ],
    limit,
    offset,
    order
  });

export const convertToBaseAmount = async (amount, currency, baseCurrency) => {
  if (!currency || !baseCurrency) {
    return { amount_in_base: amount, exchange_rate: 1.0, exchange_rate_estimated: true };
  }

  try {
    const converted = await convertAmount(amount, currency, baseCurrency);
    return {
      amount_in_base: Number(converted.convertedAmount),
      exchange_rate: Number(Number(converted.rate || 1).toFixed(6)),
      exchange_rate_estimated: Boolean(converted.estimated)
    };
  } catch {
    return { amount_in_base: Number(amount), exchange_rate: 1.0, exchange_rate_estimated: true };
  }
};

export const createUserTransaction = async (userId, payload, baseCurrency) => {
  const conversion = await convertToBaseAmount(payload.amount, payload.currency, baseCurrency);
  return Transaction.create({
    ...payload,
    user_id: userId,
    ...conversion
  });
};

export const updateUserTransaction = async (transaction, updates, baseCurrency) => {
  const needsConversion = typeof updates.amount !== 'undefined' || typeof updates.currency !== 'undefined';

  if (needsConversion) {
    const amount = typeof updates.amount !== 'undefined' ? updates.amount : transaction.amount;
    const currency = updates.currency || transaction.currency;
    const conversion = await convertToBaseAmount(amount, currency, baseCurrency);
    Object.assign(updates, conversion);
  }

  return transaction.update(updates);
};

export const validateTransactionDate = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= Date.now() + ONE_DAY_MS;
};
