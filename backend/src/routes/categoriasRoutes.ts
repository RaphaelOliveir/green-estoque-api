import { Router } from 'express';
import { getCategorias, getCategoria, createCategoria, updateCategoria, deleteCategoria } from '../controllers/categoriasController';
import { authGuard, roleGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Endpoints de gerenciamento de categorias
 */

router.use(authGuard);

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Listar categorias
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get('/', getCategorias);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Obter categoria por ID
 *     tags: [Categorias]
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
 *         description: Dados da categoria
 */
router.get('/:id', getCategoria);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Criar nova categoria (admin)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria criada
 */
router.post('/', roleGuard('admin'), createCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Atualizar categoria (admin)
 *     tags: [Categorias]
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
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada
 */
router.put('/:id', roleGuard('admin'), updateCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Excluir categoria (admin)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Categoria excluída
 */
router.delete('/:id', roleGuard('admin'), deleteCategoria);

export default router;
