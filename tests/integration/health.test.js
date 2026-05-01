import request from 'supertest';
import { app } from '../../src/app.js';

describe('GET /health', () => {
  it('returns status payload', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body.status).toBe('ok');
    expect(['connected', 'error']).toContain(res.body.db);
    expect(typeof res.body.timestamp).toBe('string');
  });
});
