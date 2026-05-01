import { getPagination } from '../../src/utils/pagination.js';

describe('getPagination', () => {
  it('returns sane defaults', () => {
    expect(getPagination()).toEqual({ limit: 10, offset: 0 });
  });
});
