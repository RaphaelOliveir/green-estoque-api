import { Router } from 'express';
import { globalSearch } from '../controllers/buscaController';
import { authGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Busca
 *   description: Endpoints de busca global
 */

router.use(authGuard);

/**
 * @swagger
 * /busca:
 *   get:
 *     summary: Realizar busca global
 *     tags: [Busca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 */
router.get('/', globalSearch);

export default router;
