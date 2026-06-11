import { Router } from 'express';
import { login, getMe, updateMe, updateSenha, uploadFoto, recuperarSenha, redefinirSenha, seedAdmin } from '../controllers/authController';
import { authGuard } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de Autenticação
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/recuperar-senha:
 *   post:
 *     summary: Solicitar recuperação de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de recuperação enviado
 */
router.post('/recuperar-senha', recuperarSenha);

/**
 * @swagger
 * /auth/redefinir-senha:
 *   post:
 *     summary: Redefinir senha usando token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, novaSenha]
 *             properties:
 *               token:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 */
router.post('/redefinir-senha', redefinirSenha);

/**
 * @swagger
 * /auth/seed-admin:
 *   post:
 *     summary: Criar usuário admin inicial (se não houver usuários)
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: Admin criado
 */
router.post('/seed-admin', seedAdmin);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *   put:
 *     summary: Atualiza dados do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
router.get('/me', authGuard, getMe);
router.put('/me', authGuard, updateMe);

/**
 * @swagger
 * /auth/senha:
 *   put:
 *     summary: Atualiza a senha do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senhaAtual, novaSenha]
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha atualizada
 */
router.put('/senha', authGuard, updateSenha);

/**
 * @swagger
 * /auth/foto:
 *   post:
 *     summary: Faz o upload da foto de perfil
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto atualizada
 */
router.post('/foto', authGuard, uploadFoto); // you could use multer middleware here in the future

export default router;
