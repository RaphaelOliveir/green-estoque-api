import { Router } from 'express';
import { getMovimentacoes } from '../controllers/movimentacoesController';
import { authGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Movimentações
 *   description: Endpoints de movimentações de estoque
 */

router.use(authGuard);

/**
 * @swagger
 * /movimentacoes:
 *   get:
 *     summary: Listar movimentações de estoque
 *     tags: [Movimentações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de movimentações
 */
router.get('/', getMovimentacoes);

export default router;
