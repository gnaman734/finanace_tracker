import { Router } from 'express';
import { body } from 'express-validator';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoriesController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/', authenticate, listCategories);
router.post(
	'/',
	[
		body('name').isString().trim().notEmpty(),
		body('type').isIn(['income', 'expense']),
		body('icon').optional().isString(),
		body('color').optional().isString()
	],
	authenticate,
	validate,
	createCategory
);
router.patch(
	'/:id',
	[
		body('name').optional().isString().trim().notEmpty(),
		body('type').optional().isIn(['income', 'expense']),
		body('icon').optional().isString(),
		body('color').optional().isString()
	],
	authenticate,
	validate,
	updateCategory
);
router.delete('/:id', authenticate, deleteCategory);

export default router;
