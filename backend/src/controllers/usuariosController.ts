import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { query, execute } from '../config/database';
import { createError } from '../middlewares/errorHandler';

export const getUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ativo, perfil, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let sql = 'SELECT id, nome, email, perfil, ativo, avatar FROM usuarios WHERE 1=1';
    const params: any[] = [];
    if (ativo !== undefined) {
      sql += ' AND ativo = ?';
      params.push(Number(ativo));
    }
    if (perfil) {
      sql += ' AND perfil = ?';
      params.push(perfil);
    }
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    const usuarios = await query<any>(sql, params);
    
    let countSql = 'SELECT COUNT(*) as total FROM usuarios WHERE 1=1';
    const countParams: any[] = [];
    if (ativo !== undefined) {
      countSql += ' AND ativo = ?';
      countParams.push(Number(ativo));
    }
    if (perfil) {
      countSql += ' AND perfil = ?';
      countParams.push(perfil);
    }
    const totalResult = await query<any>(countSql, countParams);
    const total = totalResult[0].total;
    
    res.json({ data: usuarios, total, page: Number(page), lastPage: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(createError('Erro ao buscar usuários', 500));
  }
};

export const getUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const usuarios = await query<any>('SELECT id, nome, email, perfil, ativo, avatar FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) return next(createError('Usuário não encontrado', 404));
    res.json(usuarios[0]);
  } catch (error) {
    next(createError('Erro ao buscar usuário', 500));
  }
};

export const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, senha, perfil, ativo } = req.body;
    const hash = await bcrypt.hash(senha, 12);
    const result: any = await execute('INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)', [nome, email, hash, perfil || 'USER', ativo !== undefined ? ativo : 1]);
    res.status(201).json({ id: result.insertId, nome, email, perfil });
  } catch (error) {
    next(createError('Erro ao criar usuário', 500));
  }
};

export const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nome, email, perfil, ativo } = req.body;
    await execute('UPDATE usuarios SET nome = ?, email = ?, perfil = ?, ativo = ? WHERE id = ?', [nome, email, perfil, ativo, id]);
    res.json({ message: 'Usuário atualizado' });
  } catch (error) {
    next(createError('Erro ao atualizar usuário', 500));
  }
};

export const deleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuário excluído' });
  } catch (error) {
    next(createError('Erro ao excluir usuário', 500));
  }
};
