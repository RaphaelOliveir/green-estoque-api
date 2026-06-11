import { Router } from 'express';
import { getResumo, getGrafico, getLogistica, getMaisVendidos, getAlertas } from '../controllers/dashboardController';
import { authGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints de dashboard e relatórios
 */

router.use(authGuard);

/**
 * @swagger
 * /dashboard/resumo:
 *   get:
 *     summary: Obter resumo do dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados de resumo
 */
router.get('/resumo', getResumo);

/**
 * @swagger
 * /dashboard/grafico:
 *   get:
 *     summary: Obter dados para gráficos
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados para gráficos
 */
router.get('/grafico', getGrafico);

/**
 * @swagger
 * /dashboard/logistica:
 *   get:
 *     summary: Obter dados de logística
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados de logística
 */
router.get('/logistica', getLogistica);

/**
 * @swagger
 * /dashboard/mais-vendidos:
 *   get:
 *     summary: Obter produtos mais vendidos
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produtos mais vendidos
 */
router.get('/mais-vendidos', getMaisVendidos);

/**
 * @swagger
 * /dashboard/alertas:
 *   get:
 *     summary: Obter alertas do sistema
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
router.get('/alertas', getAlertas);

export default router;
