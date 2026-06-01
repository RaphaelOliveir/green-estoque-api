import { Router } from 'express';
import { getPedidos, getPedido, createPedido, cancelPedido, updateStatus, exportCsv } from '../controllers/pedidosController';
import { authGuard, roleGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validateRequest';
import { createPedidoSchema } from '../middlewares/validators';

const router = Router();

router.use(authGuard);

router.get('/export', exportCsv);
router.get('/', getPedidos);
router.get('/:id', getPedido);
router.post('/', validate(createPedidoSchema), createPedido);
router.put('/:id/status', roleGuard('admin'), updateStatus);
router.post('/:id/cancelar', roleGuard('admin'), cancelPedido);

export default router;
