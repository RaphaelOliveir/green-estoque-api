import { Router } from 'express';
import { getPedidos, getPedido, createPedido, cancelPedido, updateStatus, exportCsv } from '../controllers/pedidosController';
import { authGuard, roleGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validateRequest';
import { createPedidoSchema } from '../middlewares/validators';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Endpoints de gerenciamento de pedidos
 */

router.use(authGuard);

/**
 * @swagger
 * /pedidos/export:
 *   get:
 *     summary: Exportar pedidos em CSV
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arquivo CSV
 */
router.get('/export', exportCsv);

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Listar pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/', getPedidos);

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Obter pedido por ID
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do pedido
 */
router.get('/:id', getPedido);

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, itens]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idProduto:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                     precoUnitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pedido criado
 */
router.post('/', validate(createPedidoSchema), createPedido);

/**
 * @swagger
 * /pedidos/{id}/status:
 *   put:
 *     summary: Atualizar status do pedido (admin)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovado, rejeitado, cancelado]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.put('/:id/status', roleGuard('admin'), updateStatus);

/**
 * @swagger
 * /pedidos/{id}/cancelar:
 *   post:
 *     summary: Cancelar pedido (admin)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido cancelado
 */
router.post('/:id/cancelar', roleGuard('admin'), cancelPedido);

export default router;
