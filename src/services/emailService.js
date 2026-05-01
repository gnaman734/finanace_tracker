import sgMail from '@sendgrid/mail';
import { Op, Sequelize } from 'sequelize';
import { env } from '../config/env.js';
import { Notification } from '../models/index.js';
import { logger } from '../utils/logger.js';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL || !to) return;

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html
  });
};

const hasBudgetAlertToday = async (userId, budgetId, type) => {
  const now = new Date();
  const existing = await Notification.findOne({
    where: {
      user_id: userId,
      type,
      created_at: {
        [Op.gte]: startOfDay(now),
        [Op.lte]: endOfDay(now)
      },
      [Op.and]: [Sequelize.where(Sequelize.json('metadata.budget_id'), budgetId)]
    }
  });

  return Boolean(existing);
};

const buildBudgetEmailHtml = ({ userName, title, categoryName, budgetAmount, spent, percent, appUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color:#111827;">${title} - ${categoryName}</h2>
    <p>Hi ${userName || 'there'},</p>
    <p>Your spending crossed the configured threshold for <strong>${categoryName}</strong>.</p>
    <table style="border-collapse: collapse; width:100%; margin: 16px 0;">
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Budget</td><td style="padding:8px;border:1px solid #e5e7eb;">${budgetAmount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Spent</td><td style="padding:8px;border:1px solid #e5e7eb;">${spent}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Usage</td><td style="padding:8px;border:1px solid #e5e7eb;">${percent}%</td></tr>
    </table>
    <p><a href="${appUrl}" style="color:#2563eb;">Open FinTrack</a> to review your transactions.</p>
  </div>
`;

export const sendBudgetOverrunEmail = async (user, budget, spent, categoryName) => {
  try {
    if (!user?.email || !budget?.id) return;

    const shouldSkip = await hasBudgetAlertToday(user.id, budget.id, 'budget_overrun');
    if (shouldSkip) return;

    const budgetAmount = Number(budget.amount || 0);
    const spentAmount = Number(spent || 0);
    const percent = budgetAmount > 0 ? ((spentAmount / budgetAmount) * 100).toFixed(1) : '0.0';
    const appUrl = env.frontendUrl || process.env.FRONTEND_URL || '#';

    await sendEmail({
      to: user.email,
      subject: `Budget Alert - ${categoryName}`,
      html: buildBudgetEmailHtml({
        userName: user.name,
        title: 'Budget Alert',
        categoryName,
        budgetAmount: `${budget.currency || 'USD'} ${budgetAmount.toFixed(2)}`,
        spent: `${budget.currency || 'USD'} ${spentAmount.toFixed(2)}`,
        percent,
        appUrl
      })
    });
  } catch (error) {
    logger.error('Failed to send budget overrun email', { error: error.message, userId: user?.id, budgetId: budget?.id });
  }
};

export const sendBudgetWarningEmail = async (user, budget, spent, categoryName) => {
  try {
    if (!user?.email || !budget?.id) return;

    const shouldSkip = await hasBudgetAlertToday(user.id, budget.id, 'budget_warning');
    if (shouldSkip) return;

    const budgetAmount = Number(budget.amount || 0);
    const spentAmount = Number(spent || 0);
    const percent = budgetAmount > 0 ? ((spentAmount / budgetAmount) * 100).toFixed(1) : '0.0';
    const appUrl = env.frontendUrl || process.env.FRONTEND_URL || '#';

    await sendEmail({
      to: user.email,
      subject: `Budget Alert - ${categoryName}`,
      html: buildBudgetEmailHtml({
        userName: user.name,
        title: 'Budget Warning',
        categoryName,
        budgetAmount: `${budget.currency || 'USD'} ${budgetAmount.toFixed(2)}`,
        spent: `${budget.currency || 'USD'} ${spentAmount.toFixed(2)}`,
        percent,
        appUrl
      })
    });
  } catch (error) {
    logger.error('Failed to send budget warning email', { error: error.message, userId: user?.id, budgetId: budget?.id });
  }
};

export const sendWelcomeEmail = async (user) => {
  try {
    if (!user?.email) return;

    const appUrl = env.frontendUrl || process.env.FRONTEND_URL || '#';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#111827;">Welcome to FinTrack, ${user.name || 'there'}!</h2>
        <p>Your account is ready. Start tracking expenses, budgets, and reports from one place.</p>
        <p><a href="${appUrl}" style="color:#2563eb;">Open FinTrack Dashboard</a></p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to FinTrack',
      html
    });
  } catch (error) {
    logger.error('Failed to send welcome email', { error: error.message, userId: user?.id });
  }
};
