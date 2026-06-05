import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const getCategorias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT c.*, COUNT(p.id) as total_produtos
      FROM categorias c
      LEFT JOIN produtos p ON c.id = p.categoria_id
      GROUP BY c.id
    `;
    const categorias = await query<any>(sql, []);
    res.json(categorias);
  } catch (error) {
    next(createError('Erro ao buscar categorias', 500));
  }
};

export const getCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const categorias = await query<any>('SELECT * FROM categorias WHERE id = ?', [id]);
    if (categorias.length === 0) return next(createError('Categoria não encontrada', 404));
    res.json(categorias[0]);
  } catch (error) {
    next(createError('Erro ao buscar categoria', 500));
  }
};

export const createCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, descricao } = req.body;
    const result: any = await execute('INSERT INTO categorias (nome, descricao) VALUES (?, ?)', [nome, descricao]);
    res.status(201).json({ id: result.insertId, nome, descricao });
  } catch (error) {
    next(createError('Erro ao criar categoria', 500));
  }
};

export const updateCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    await execute('UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?', [nome, descricao, id]);
    res.json({ message: 'Categoria atualizada' });
  } catch (error) {
    next(createError('Erro ao atualizar categoria', 500));
  }
};

export const deleteCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM categorias WHERE id = ?', [id]);
    res.json({ message: 'Categoria excluída' });
  } catch (error) {
    next(createError('Erro ao excluir categoria', 500));
  }
};
