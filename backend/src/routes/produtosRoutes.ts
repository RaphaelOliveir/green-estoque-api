import { Router } from 'express';
import { getProdutos, getProduto, createProduto, updateProduto, deleteProduto, uploadImagem } from '../controllers/produtosController';
import { authGuard, roleGuard } from '../middlewares/auth';
import { uploadProduto } from '../middlewares/upload';
import { validate } from '../middlewares/validateRequest';
import { createProdutoSchema, updateProdutoSchema } from '../middlewares/validators';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Endpoints de gerenciamento de produtos
 */

router.use(authGuard);

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Listar produtos
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/',    getProdutos);

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Produtos]
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
 *         description: Dados do produto
 */
router.get('/:id', getProduto);

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Criar novo produto (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, preco, idCategoria]
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               quantidade:
 *                 type: integer
 *               idCategoria:
 *                 type: integer
 *               idFornecedor:
 *                 type: integer
 *               codigoBarras:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produto criado
 */
router.post('/',   roleGuard('admin'), validate(createProdutoSchema), createProduto);

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualizar produto (admin)
 *     tags: [Produtos]
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
 *               preco:
 *                 type: number
 *               quantidade:
 *                 type: integer
 *               idCategoria:
 *                 type: integer
 *               idFornecedor:
 *                 type: integer
 *               codigoBarras:
 *                 type: string
 *     responses:
 *       200:
 *         description: Produto atualizado
 */
router.put('/:id', roleGuard('admin'), validate(updateProdutoSchema), updateProduto);

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Excluir produto (admin)
 *     tags: [Produtos]
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
 *         description: Produto excluído
 */
router.delete('/:id', roleGuard('admin'), deleteProduto);

/**
 * @swagger
 * /produtos/{id}/imagem:
 *   post:
 *     summary: Upload de imagem do produto (admin)
 *     tags: [Produtos]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem atualizada
 */
// Upload com middleware Multer configurado corretamente (tipo, tamanho, extensão)
router.post('/:id/imagem', roleGuard('admin'), uploadProduto, uploadImagem);

export default router;
