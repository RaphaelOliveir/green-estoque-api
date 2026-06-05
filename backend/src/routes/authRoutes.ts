import { Router } from 'express';
import { login, getMe, updateMe, updateSenha, uploadFoto, recuperarSenha, redefinirSenha, seedAdmin } from '../controllers/authController';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/recuperar-senha', recuperarSenha);
router.post('/redefinir-senha', redefinirSenha);
router.post('/seed-admin', seedAdmin);

router.get('/me', authGuard, getMe);
router.put('/me', authGuard, updateMe);
router.put('/senha', authGuard, updateSenha);
router.post('/foto', authGuard, uploadFoto); // you could use multer middleware here in the future

export default router;
