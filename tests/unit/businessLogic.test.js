import { computeBalance } from '../../src/services/businessLogic.js';

describe('computeBalance', () => {
  it('computes balance correctly', () => {
    const transactions = [
      { type: 'income', amount: '1000' },
      { type: 'expense', amount: '300' },
      { type: 'expense', amount: '200' }
    ];

    expect(computeBalance(transactions)).toBe(500);
  });
});
