import currency from 'currency.js';

export const formatCurrency = (amount, code = 'USD') => {
  const symbol = code === 'INR' ? '₹' : '$';
  return currency(amount, { symbol }).format();
};
