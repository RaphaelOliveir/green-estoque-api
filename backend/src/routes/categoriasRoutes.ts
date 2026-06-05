import { Router } from 'express';
import { getCategorias, getCategoria, createCategoria, updateCategoria, deleteCategoria } from '../controllers/categoriasController';
import { authGuard, roleGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/', getCategorias);
router.get('/:id', getCategoria);
router.post('/', roleGuard('admin'), createCategoria);
router.put('/:id', roleGuard('admin'), updateCategoria);
router.delete('/:id', roleGuard('admin'), deleteCategoria);

export default router;
