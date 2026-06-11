import { Router } from 'express';
import { getUsuarios, getUsuario, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuariosController';
import { authGuard, roleGuard } from '../middlewares/auth';

const router = Router();

router.post('/', createUsuario);

router.use(authGuard);
router.use(roleGuard('admin'));

router.get('/', getUsuarios);
router.get('/:id', getUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

export default router;
