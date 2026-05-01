import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { convertCurrency, getCurrencyRates, listSupportedCurrencies } from '../controllers/currenciesController.js';

const router = Router();

router.get('/', authenticate, listSupportedCurrencies);
router.get('/rates', authenticate, [query('base').optional().isLength({ min: 3, max: 3 })], validate, getCurrencyRates);
router.post(
  '/convert',
  authenticate,
  [body('amount').isNumeric(), body('from').isLength({ min: 3, max: 3 }), body('to').isLength({ min: 3, max: 3 })],
  validate,
  convertCurrency
);

export default router;
