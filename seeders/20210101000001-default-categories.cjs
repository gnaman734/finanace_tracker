'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const incomeCategories = [
      'Salary',
      'Freelance',
      'Business',
      'Investments',
      'Rental Income',
      'Other Income'
    ];

    const expenseCategories = [
      'Food',
      'Transportation',
      'Rent',
      'Utilities',
      'Healthcare',
      'Entertainment',
      'Shopping',
      'Education',
      'Travel',
      'Other Expense'
    ];

    const rows = [
      ...incomeCategories.map((name) => ({
        id: randomUUID(),
        user_id: null,
        name,
        type: 'income',
        icon: 'tag',
        color: '#22c55e',
        is_default: true,
        created_at: now,
        updated_at: now
      })),
      ...expenseCategories.map((name) => ({
        id: randomUUID(),
        user_id: null,
        name,
        type: 'expense',
        icon: 'tag',
        color: '#ef4444',
        is_default: true,
        created_at: now,
        updated_at: now
      }))
    ];

    await queryInterface.bulkInsert('categories', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', { user_id: null, is_default: true }, {});
  }
};
