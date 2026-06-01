import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ produtos: [], fornecedores: [], pedidos: [] });
    
    const search = `%${q}%`;
    const produtos = await query<any>('SELECT id, nome, sku FROM produtos WHERE nome LIKE ? OR sku LIKE ? LIMIT 5', [search, search]);
    const fornecedores = await query<any>('SELECT id, nome, cnpj FROM fornecedores WHERE nome LIKE ? OR cnpj LIKE ? LIMIT 5', [search, search]);
    // Try to parse q as ID for pedidos
    let pedidos: any[] = [];
    if (!isNaN(Number(q))) {
      pedidos = await query<any>('SELECT id, status FROM pedidos WHERE id = ? LIMIT 5', [Number(q)]);
    }
    
    res.json({ produtos, fornecedores, pedidos });
  } catch (error) {
    next(createError('Erro na busca global', 500));
  }
};
