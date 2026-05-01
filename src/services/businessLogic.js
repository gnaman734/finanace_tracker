export const computeBalance = (transactions) =>
  transactions.reduce((acc, t) => (t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount)), 0);
