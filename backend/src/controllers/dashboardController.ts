import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const getResumo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalProdutos] = await query<any>('SELECT COUNT(*) as total FROM produtos');
    const [totalPedidos] = await query<any>('SELECT COUNT(*) as total FROM pedidos');
    const [totalUsuarios] = await query<any>('SELECT COUNT(*) as total FROM usuarios');
    const alertasEstoque = await query<any>('SELECT COUNT(*) as total FROM produtos WHERE status = "baixo_estoque" OR status = "sem_estoque"');
    
    res.json({
      produtos: totalProdutos.total,
      pedidos: totalPedidos.total,
      usuarios: totalUsuarios.total,
      alertas: alertasEstoque[0].total
    });
  } catch (error) {
    next(createError('Erro ao buscar resumo', 500));
  }
};

export const getGrafico = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dados = await query<any>(`
      SELECT DATE(created_at) as data, tipo, SUM(quantidade) as total 
      FROM movimentacoes 
      GROUP BY DATE(created_at), tipo 
      ORDER BY data DESC LIMIT 30
    `);
    res.json(dados);
  } catch (error) {
    next(createError('Erro ao buscar grafico', 500));
  }
};

export const getLogistica = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dados = await query<any>('SELECT status, COUNT(*) as total FROM pedidos GROUP BY status');
    res.json(dados);
  } catch (error) {
    next(createError('Erro ao buscar logistica', 500));
  }
};

export const getMaisVendidos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dados = await query<any>(`
      SELECT p.nome, SUM(i.quantidade) as total_vendido
      FROM itens_pedido i
      JOIN produtos p ON i.produto_id = p.id
      JOIN pedidos pd ON i.pedido_id = pd.id
      WHERE pd.tipo = 'SAIDA' AND pd.status != 'CANCELADO'
      GROUP BY p.id
      ORDER BY total_vendido DESC LIMIT 5
    `);
    res.json(dados);
  } catch (error) {
    next(createError('Erro ao buscar mais vendidos', 500));
  }
};

export const getAlertas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dados = await query<any>('SELECT id, nome, quantidade, status FROM produtos WHERE status = "baixo_estoque" OR status = "sem_estoque"');
    res.json(dados);
  } catch (error) {
    next(createError('Erro ao buscar alertas', 500));
  }
};
