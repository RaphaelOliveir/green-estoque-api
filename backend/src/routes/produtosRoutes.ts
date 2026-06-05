import { Router } from 'express';
import { getProdutos, getProduto, createProduto, updateProduto, deleteProduto, uploadImagem } from '../controllers/produtosController';
import { authGuard, roleGuard } from '../middlewares/auth';
import { uploadProduto } from '../middlewares/upload';
import { validate } from '../middlewares/validateRequest';
import { createProdutoSchema, updateProdutoSchema } from '../middlewares/validators';

const router = Router();

router.use(authGuard);

router.get('/',    getProdutos);
router.get('/:id', getProduto);
router.post('/',   roleGuard('admin'), validate(createProdutoSchema), createProduto);
router.put('/:id', roleGuard('admin'), validate(updateProdutoSchema), updateProduto);
router.delete('/:id', roleGuard('admin'), deleteProduto);

// Upload com middleware Multer configurado corretamente (tipo, tamanho, extensão)
router.post('/:id/imagem', roleGuard('admin'), uploadProduto, uploadImagem);

export default router;
