import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const getFornecedores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM fornecedores WHERE 1=1';
    const params: any[] = [];
    if (search) {
      sql += ' AND (nome LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const fornecedores = await query<any>(sql, params);
    res.json(fornecedores);
  } catch (error) {
    next(createError('Erro ao buscar fornecedores', 500));
  }
};

export const getFornecedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fornecedores = await query<any>('SELECT * FROM fornecedores WHERE id = ?', [id]);
    if (fornecedores.length === 0) return next(createError('Fornecedor não encontrado', 404));
    res.json(fornecedores[0]);
  } catch (error) {
    next(createError('Erro ao buscar fornecedor', 500));
  }
};

export const createFornecedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, telefone, cnpj, endereco } = req.body;
    const result: any = await execute('INSERT INTO fornecedores (nome, email, telefone, cnpj, endereco) VALUES (?, ?, ?, ?, ?)', [nome, email, telefone, cnpj, endereco]);
    res.status(201).json({ id: result.insertId, nome, email });
  } catch (error) {
    next(createError('Erro ao criar fornecedor', 500));
  }
};

export const updateFornecedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, cnpj, endereco } = req.body;
    await execute('UPDATE fornecedores SET nome = ?, email = ?, telefone = ?, cnpj = ?, endereco = ? WHERE id = ?', [nome, email, telefone, cnpj, endereco, id]);
    res.json({ message: 'Fornecedor atualizado' });
  } catch (error) {
    next(createError('Erro ao atualizar fornecedor', 500));
  }
};

export const deleteFornecedor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM fornecedores WHERE id = ?', [id]);
    res.json({ message: 'Fornecedor excluído' });
  } catch (error) {
    next(createError('Erro ao excluir fornecedor', 500));
  }
};
