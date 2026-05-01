import { Router } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import {
	googleCallback,
	login,
	logout,
	me,
	refresh,
	register,
	updateMe,
	updatePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 10,
		standardHeaders: true,
		legacyHeaders: false
	})
);

router.post(
	'/register',
	[
		body('name').isString().trim().isLength({ min: 2, max: 50 }),
		body('email').isEmail().normalizeEmail(),
		body('password')
			.isString()
			.isLength({ min: 8 })
			.matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
	],
	validate,
	register
);

router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()], validate, login);

router.post('/refresh', refresh);

router.post('/logout', logout);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

router.get('/me', authenticateToken, me);

router.patch(
	'/me',
	[
		body('name').optional().isString().trim().isLength({ min: 2, max: 50 }),
		body('preferred_currency').optional().isString().matches(/^[A-Z]{3}$/),
		body('avatar_url').optional({ nullable: true }).custom((value) => {
			if (value === null) return true;
			try {
				// eslint-disable-next-line no-new
				new URL(value);
				return true;
			} catch {
				return false;
			}
		})
	],
	validate,
	authenticateToken,
	updateMe
);

router.patch(
	'/me/password',
	[
		body('currentPassword').isString().notEmpty(),
		body('newPassword')
			.isString()
			.isLength({ min: 8 })
			.matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
	],
	validate,
	authenticateToken,
	updatePassword
);

export default router;
