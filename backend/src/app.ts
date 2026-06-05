import express, { Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import path    from 'path';
import fs      from 'fs';

import { testConnection }  from './config/database';
import { initDb }          from './config/initDb';
import { errorHandler }    from './middlewares/errorHandler';
import { seedAdmin }       from './controllers/authController';


// Rotas (criadas nos próximos passos)
import authRoutes          from './routes/authRoutes';
import categoriasRoutes    from './routes/categoriasRoutes';
import fornecedoresRoutes  from './routes/fornecedoresRoutes';
import usuariosRoutes      from './routes/usuariosRoutes';
import produtosRoutes      from './routes/produtosRoutes';
import pedidosRoutes       from './routes/pedidosRoutes';
import movimentacoesRoutes from './routes/movimentacoesRoutes';
import dashboardRoutes     from './routes/dashboardRoutes';
import buscaRoutes         from './routes/buscaRoutes';


dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT) || 3001;

// ─────────────────────────────────────────────────
// Middlewares globais
// ─────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads de forma estática
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─────────────────────────────────────────────────
// Rotas
// ─────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:  'ok',
    version: '1.0.0',
    env:     process.env.NODE_ENV ?? 'development',
  });
});

app.use('/auth',          authRoutes);
app.use('/usuarios',      usuariosRoutes);
app.use('/categorias',    categoriasRoutes);
app.use('/fornecedores',  fornecedoresRoutes);
app.use('/produtos',      produtosRoutes);
app.use('/pedidos',       pedidosRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/dashboard',     dashboardRoutes);
app.use('/busca',         buscaRoutes);

// ─────────────────────────────────────────────────
// 404 — rota não encontrada
// ─────────────────────────────────────────────────
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─────────────────────────────────────────────────
// Middleware de erro global (deve ser o último)
// ─────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // Garante que as pastas de upload existam
  const uploadDirs = [
    path.join(__dirname, '..', 'uploads', 'produtos'),
    path.join(__dirname, '..', 'uploads', 'fotos'),
  ];
  uploadDirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

  await initDb();
  await testConnection();
  await seedAdmin(); // Cria admin inicial se não houver usuários

  app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
  });
}

bootstrap();


