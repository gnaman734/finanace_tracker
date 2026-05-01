import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const rateCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zl' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JOD' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kc' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' }
];

const buildRateApiUrl = (baseCurrency) => {
  if (env.exchangeRateApiKey) {
    return `https://v6.exchangerate-api.com/v6/${env.exchangeRateApiKey}/latest/${baseCurrency}`;
  }

  return `https://open.er-api.com/v6/latest/${baseCurrency}`;
};

const extractRatesPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const rates = payload.conversion_rates || payload.rates;
  if (!rates || typeof rates !== 'object') return null;
  return rates;
};

export const getRates = async (baseCurrency = 'USD') => {
  const base = String(baseCurrency || 'USD').toUpperCase();
  const cached = rateCache.get(base);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return {
      base,
      rates: cached.rates,
      updatedAt: new Date(cached.timestamp).toISOString()
    };
  }

  try {
    const url = buildRateApiUrl(base);
    const { data } = await axios.get(url, { timeout: 10000 });
    const rates = extractRatesPayload(data);

    if (!rates) {
      throw new Error('Invalid exchange-rate response');
    }

    const entry = {
      rates,
      timestamp: now
    };

    rateCache.set(base, entry);

    return {
      base,
      rates,
      updatedAt: new Date(entry.timestamp).toISOString()
    };
  } catch (error) {
    logger.error('Failed to fetch exchange rates', {
      base,
      error: error.message
    });
    return null;
  }
};

export const convertAmount = async (amount, fromCurrency, toCurrency) => {
  const parsedAmount = Number(amount);
  const from = String(fromCurrency || '').toUpperCase();
  const to = String(toCurrency || '').toUpperCase();

  if (from === to) {
    return { convertedAmount: parsedAmount, rate: 1 };
  }

  const ratesPayload = await getRates(from);
  if (!ratesPayload || !ratesPayload.rates) {
    return { convertedAmount: parsedAmount, rate: 1, estimated: true };
  }

  const rate = Number(ratesPayload.rates[to]);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { convertedAmount: parsedAmount, rate: 1, estimated: true };
  }

  return {
    convertedAmount: Number((parsedAmount * rate).toFixed(4)),
    rate,
    estimated: false
  };
};

export const getSupportedCurrencies = () => SUPPORTED_CURRENCIES;

export { rateCache, CACHE_TTL };
