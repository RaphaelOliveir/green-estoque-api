import { Router } from 'express';
import { globalSearch } from '../controllers/buscaController';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/', globalSearch);

export default router;
