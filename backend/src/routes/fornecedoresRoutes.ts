import { Router } from 'express';
import { getFornecedores, getFornecedor, createFornecedor, updateFornecedor, deleteFornecedor } from '../controllers/fornecedoresController';
import { authGuard, roleGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/', getFornecedores);
router.get('/:id', getFornecedor);
router.post('/', roleGuard('admin'), createFornecedor);
router.put('/:id', roleGuard('admin'), updateFornecedor);
router.delete('/:id', roleGuard('admin'), deleteFornecedor);

export default router;
