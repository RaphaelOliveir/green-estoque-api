import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../config/database';
import { createError } from '../middlewares/errorHandler';

const calculateStatus = (quantidade: number, qtd_minima: number) => {
  if (quantidade <= 0) return 'sem_estoque';
  if (quantidade <= qtd_minima) return 'baixo_estoque';
  return 'em_estoque';
};

export const getProdutos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoria_id, status, search, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let sql = `
      SELECT p.*, c.nome as categoria_nome, f.nome as fornecedor_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN fornecedores f ON p.fornecedor_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (p.nome LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const produtos = await query<any>(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM produtos p WHERE 1=1';
    const countParams: any[] = [];
    if (categoria_id) { countSql += ' AND p.categoria_id = ?'; countParams.push(categoria_id); }
    if (status) { countSql += ' AND p.status = ?'; countParams.push(status); }
    if (search) { countSql += ' AND (p.nome LIKE ? OR p.sku LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

    const totalResult = await query<any>(countSql, countParams);
    const total = totalResult[0].total;

    res.json({ data: produtos, total, page: Number(page), lastPage: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(createError('Erro ao buscar produtos', 500));
  }
};

export const getProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const produtos = await query<any>('SELECT * FROM produtos WHERE id = ?', [id]);
    if (produtos.length === 0) return next(createError('Produto não encontrado', 404));
    res.json(produtos[0]);
  } catch (error) {
    next(createError('Erro ao buscar produto', 500));
  }
};

export const createProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, sku, descricao, preco, quantidade, qtd_minima, categoria_id, fornecedor_id } = req.body;
    const status = calculateStatus(Number(quantidade), Number(qtd_minima));
    const result: any = await execute(
      'INSERT INTO produtos (nome, sku, descricao, preco, quantidade, qtd_minima, categoria_id, fornecedor_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, sku, descricao, preco, quantidade, qtd_minima, categoria_id, fornecedor_id, status]
    );
    res.status(201).json({ id: result.insertId, nome, sku, status });
  } catch (error) {
    next(createError('Erro ao criar produto', 500));
  }
};

export const updateProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nome, sku, descricao, preco, quantidade, qtd_minima, categoria_id, fornecedor_id } = req.body;
    const status = calculateStatus(Number(quantidade), Number(qtd_minima));
    await execute(
      'UPDATE produtos SET nome = ?, sku = ?, descricao = ?, preco = ?, quantidade = ?, qtd_minima = ?, categoria_id = ?, fornecedor_id = ?, status = ? WHERE id = ?',
      [nome, sku, descricao, preco, quantidade, qtd_minima, categoria_id, fornecedor_id, status, id]
    );
    res.json({ message: 'Produto atualizado' });
  } catch (error) {
    next(createError('Erro ao atualizar produto', 500));
  }
};

export const deleteProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM produtos WHERE id = ?', [id]);
    res.json({ message: 'Produto excluído' });
  } catch (error) {
    next(createError('Erro ao excluir produto', 500));
  }
};

export const uploadImagem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const imagem = (req as any).file?.filename;
    if (!imagem) return next(createError('Nenhuma imagem enviada', 400));
    await execute('UPDATE produtos SET imagem = ? WHERE id = ?', [imagem, id]);
    res.json({ message: 'Imagem atualizada', imagem });
  } catch (error) {
    next(createError('Erro no upload', 500));
  }
};
