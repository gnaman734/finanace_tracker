import { Router } from 'express';
import {
  deleteTransactionReceipt,
  getTransactionReceipt,
  uploadTransactionReceipt
} from '../controllers/receiptsController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadReceipt } from '../middleware/upload.js';

const router = Router();

router.post('/:id/receipt', authenticate, uploadReceipt, uploadTransactionReceipt);
router.get('/:id/receipt', authenticate, getTransactionReceipt);
router.delete('/:id/receipt', authenticate, deleteTransactionReceipt);

export default router;
