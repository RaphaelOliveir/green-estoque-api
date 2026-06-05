import { Router } from 'express';
import { getResumo, getGrafico, getLogistica, getMaisVendidos, getAlertas } from '../controllers/dashboardController';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/resumo', getResumo);
router.get('/grafico', getGrafico);
router.get('/logistica', getLogistica);
router.get('/mais-vendidos', getMaisVendidos);
router.get('/alertas', getAlertas);

export default router;
