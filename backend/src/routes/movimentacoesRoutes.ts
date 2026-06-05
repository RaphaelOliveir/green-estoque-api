import { Router } from 'express';
import { getMovimentacoes } from '../controllers/movimentacoesController';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/', getMovimentacoes);

export default router;
