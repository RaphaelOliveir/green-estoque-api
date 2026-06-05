import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, execute } from '../config/database';
import { createError } from '../middlewares/errorHandler';
import { sendPasswordResetEmail } from '../services/emailService';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const users = await query<any>('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    if (users.length === 0) return next(createError('Credenciais inválidas', 401));
    const user = users[0];
    const match = await bcrypt.compare(password, user.senha);
    if (!match) return next(createError('Credenciais inválidas', 401));
    const token = jwt.sign({ id: user.id, perfil: user.perfil }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } });
  } catch (error) {
    next(createError('Erro no login', 500));
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req as any).user.id;
    const users = await query<any>('SELECT id, nome, email, perfil, avatar FROM usuarios WHERE id = ?', [id]);
    if (users.length === 0) return next(createError('Usuário não encontrado', 404));
    res.json(users[0]);
  } catch (error) {
    next(createError('Erro ao buscar perfil', 500));
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req as any).user.id;
    const { nome, email } = req.body;
    await execute('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [nome, email, id]);
    res.json({ message: 'Perfil atualizado' });
  } catch (error) {
    next(createError('Erro ao atualizar perfil', 500));
  }
};

export const updateSenha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req as any).user.id;
    const { senhaAtual, novaSenha } = req.body;
    const users = await query<any>('SELECT senha FROM usuarios WHERE id = ?', [id]);
    if (users.length === 0) return next(createError('Usuário não encontrado', 404));
    const match = await bcrypt.compare(senhaAtual, users[0].senha);
    if (!match) return next(createError('Senha atual incorreta', 400));
    const hash = await bcrypt.hash(novaSenha, 12);
    await execute('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, id]);
    res.json({ message: 'Senha atualizada' });
  } catch (error) {
    next(createError('Erro ao atualizar senha', 500));
  }
};

export const uploadFoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req as any).user.id;
    const avatar = (req as any).file?.filename;
    if (!avatar) return next(createError('Nenhuma imagem enviada', 400));
    await execute('UPDATE usuarios SET avatar = ? WHERE id = ?', [avatar, id]);
    res.json({ message: 'Foto atualizada', avatar });
  } catch (error) {
    next(createError('Erro no upload', 500));
  }
};

export const recuperarSenha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const users = await query<any>('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (users.length > 0) {
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      await execute('UPDATE usuarios SET reset_token = ? WHERE id = ?', [token, users[0].id]);
      await sendPasswordResetEmail(email, token);
    }
    res.json({ message: 'Se o email existir, um token será enviado.' });
  } catch (error) {
    next(createError('Erro ao recuperar senha', 500));
  }
};

export const redefinirSenha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, novaSenha } = req.body;
    const users = await query<any>('SELECT id FROM usuarios WHERE email = ? AND reset_token = ?', [email, token]);
    if (users.length === 0) return next(createError('Token inválido', 400));
    const hash = await bcrypt.hash(novaSenha, 12);
    await execute('UPDATE usuarios SET senha = ?, reset_token = NULL WHERE id = ?', [hash, users[0].id]);
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    next(createError('Erro ao redefinir senha', 500));
  }
};

export const seedAdmin = async () => {
  try {
    const hash = await bcrypt.hash(process.env.ADMIN_SENHA || 'admin123', 12);
    const email = process.env.ADMIN_EMAIL || 'admin@greenestoque.com';
    const users = await query<any>('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      await execute('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, ?)', [process.env.ADMIN_NOME || 'Admin', email, hash, 'admin', 1]);
    }
  } catch (error) {
    console.error('Erro no seed admin:', error);
  }
};
