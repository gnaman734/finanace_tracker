import { asyncHandler } from '../utils/helpers.js';
import { convertAmount, getRates, getSupportedCurrencies } from '../services/currencyService.js';

export const listSupportedCurrencies = asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    data: getSupportedCurrencies()
  });
});

export const getCurrencyRates = asyncHandler(async (req, res) => {
  const base = String(req.query.base || 'USD').toUpperCase();
  const ratesPayload = await getRates(base);

  if (!ratesPayload) {
    return res.status(200).json({
      success: true,
      data: {
        base,
        rates: null,
        updatedAt: null,
        estimated: true
      }
    });
  }

  return res.json({
    success: true,
    data: ratesPayload
  });
});

export const convertCurrency = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  const from = String(req.body.from || '').toUpperCase();
  const to = String(req.body.to || '').toUpperCase();

  const result = await convertAmount(amount, from, to);

  return res.json({
    success: true,
    data: {
      amount,
      from,
      to,
      convertedAmount: result.convertedAmount,
      rate: result.rate,
      estimated: Boolean(result.estimated)
    }
  });
});
