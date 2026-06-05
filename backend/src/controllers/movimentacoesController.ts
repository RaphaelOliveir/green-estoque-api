import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const getMovimentacoes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tipo, produto_id, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let sql = `
      SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome
      FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      JOIN usuarios u ON m.usuario_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (tipo) {
      sql += ' AND m.tipo = ?';
      params.push(tipo);
    }
    if (produto_id) {
      sql += ' AND m.produto_id = ?';
      params.push(produto_id);
    }
    
    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    
    const movimentacoes = await query<any>(sql, params);
    
    let countSql = 'SELECT COUNT(*) as total FROM movimentacoes WHERE 1=1';
    const countParams: any[] = [];
    if (tipo) { countSql += ' AND tipo = ?'; countParams.push(tipo); }
    if (produto_id) { countSql += ' AND produto_id = ?'; countParams.push(produto_id); }
    
    const totalResult = await query<any>(countSql, countParams);
    const total = totalResult[0].total;
    
    res.json({ data: movimentacoes, total, page: Number(page), lastPage: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(createError('Erro ao buscar movimentações', 500));
  }
};
