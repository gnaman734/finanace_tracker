import path from 'path';
import { Transaction } from '../models/index.js';
import storageService from '../services/storageService.js';
import { asyncHandler } from '../utils/helpers.js';

const findUserTransaction = async (transactionId, userId) =>
  Transaction.findOne({
    where: {
      id: transactionId,
      user_id: userId,
      deleted_at: null
    }
  });

export const uploadTransactionReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No receipt uploaded', requestId: req.id });
  }

  const transaction = await findUserTransaction(req.params.id, req.user.id);
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  if (transaction.receipt_url) {
    await storageService.delete(transaction.receipt_url);
  }

  const newPath = await storageService.save(req.file, req.user.id);
  await transaction.update({ receipt_url: newPath });

  return res.status(200).json({
    success: true,
    data: {
      receipt_url: newPath
    }
  });
});

export const getTransactionReceipt = asyncHandler(async (req, res) => {
  const transaction = await findUserTransaction(req.params.id, req.user.id);
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  if (!transaction.receipt_url) {
    return res.status(404).json({ success: false, message: 'Receipt not found', requestId: req.id });
  }

  return res.sendFile(path.resolve(transaction.receipt_url));
});

export const deleteTransactionReceipt = asyncHandler(async (req, res) => {
  const transaction = await findUserTransaction(req.params.id, req.user.id);
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found', requestId: req.id });
  }

  if (transaction.receipt_url) {
    await storageService.delete(transaction.receipt_url);
    await transaction.update({ receipt_url: null });
  }

  return res.json({
    success: true,
    message: 'Receipt deleted'
  });
});
