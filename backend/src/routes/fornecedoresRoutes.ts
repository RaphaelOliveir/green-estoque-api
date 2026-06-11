import { Router } from 'express';
import { getFornecedores, getFornecedor, createFornecedor, updateFornecedor, deleteFornecedor } from '../controllers/fornecedoresController';
import { authGuard, roleGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Fornecedores
 *   description: Endpoints de gerenciamento de fornecedores
 */

router.use(authGuard);

/**
 * @swagger
 * /fornecedores:
 *   get:
 *     summary: Listar fornecedores
 *     tags: [Fornecedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fornecedores
 */
router.get('/', getFornecedores);

/**
 * @swagger
 * /fornecedores/{id}:
 *   get:
 *     summary: Obter fornecedor por ID
 *     tags: [Fornecedores]
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
 *         description: Dados do fornecedor
 */
router.get('/:id', getFornecedor);

/**
 * @swagger
 * /fornecedores:
 *   post:
 *     summary: Criar novo fornecedor (admin)
 *     tags: [Fornecedores]
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
 *               cnpj:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fornecedor criado
 */
router.post('/', roleGuard('admin'), createFornecedor);

/**
 * @swagger
 * /fornecedores/{id}:
 *   put:
 *     summary: Atualizar fornecedor (admin)
 *     tags: [Fornecedores]
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
 *               cnpj:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fornecedor atualizado
 */
router.put('/:id', roleGuard('admin'), updateFornecedor);

/**
 * @swagger
 * /fornecedores/{id}:
 *   delete:
 *     summary: Excluir fornecedor (admin)
 *     tags: [Fornecedores]
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
 *         description: Fornecedor excluído
 */
router.delete('/:id', roleGuard('admin'), deleteFornecedor);

export default router;
