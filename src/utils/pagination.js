export const getPagination = (page = 1, limit = 10) => {
  const p = Math.max(Number(page) || 1, 1);
  const l = Math.max(Number(limit) || 10, 1);
  return { limit: l, offset: (p - 1) * l };
};
