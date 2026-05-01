import dotenv from 'dotenv';

dotenv.config();

const required = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'DATABASE_URL_TEST',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CALLBACK_URL',
  'SENDGRID_FROM_EMAIL',
  'FRONTEND_URL'
];

if (process.env.NODE_ENV === 'test') {
  process.env.PORT ||= '3001';
  process.env.DATABASE_URL ||= 'postgresql://user:password@localhost:5432/db?sslmode=require';
  process.env.DATABASE_URL_TEST ||= process.env.DATABASE_URL;
  process.env.JWT_SECRET ||= 'test_secret';
  process.env.JWT_EXPIRES_IN ||= '15m';
  process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret';
  process.env.GOOGLE_CALLBACK_URL ||= 'http://localhost:3000/api/auth/google/callback';
  process.env.SENDGRID_FROM_EMAIL ||= 'noreply@example.com';
  process.env.FRONTEND_URL ||= 'http://localhost:3000';
}

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

export const env = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  databaseUrlTest: process.env.DATABASE_URL_TEST,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  frontendUrl: process.env.FRONTEND_URL,
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY
};
