import { Request, Response, NextFunction } from 'express';
import { query, execute, pool } from '../config/database';
import { createError } from '../middlewares/errorHandler';
import { CreatePedidoDTO } from '../middlewares/validators';

// ─── Listagem de pedidos ──────────────────────────────────────────────────────
export const getPedidos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT p.*, f.nome as fornecedor_nome, u.nome as usuario_nome
      FROM pedidos p
      LEFT JOIN fornecedores f ON p.fornecedor_id = f.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.id DESC
    `;
    const pedidos = await query<any>(sql, []);
    res.json(pedidos);
  } catch (error) {
    next(createError('Erro ao buscar pedidos', 500));
  }
};

// ─── Detalhe de um pedido com seus itens ─────────────────────────────────────
export const getPedido = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pedidos = await query<any>('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (pedidos.length === 0) return next(createError('Pedido não encontrado', 404));

    const itens = await query<any>(
      'SELECT i.*, p.nome as produto_nome FROM itens_pedido i JOIN produtos p ON i.produto_id = p.id WHERE i.pedido_id = ?',
      [id]
    );

    res.json({ ...pedidos[0], itens });
  } catch (error) {
    next(createError('Erro ao buscar pedido', 500));
  }
};

// ─── Criação de pedido (transação segura) ────────────────────────────────────
export const createPedido = async (req: Request, res: Response, next: NextFunction) => {
  const { tipo, status, valor_total, fornecedor_id, itens } = req.body as CreatePedidoDTO;
  const usuario_id = req.user!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Validação de estoque com lock de linha (evita Race Condition) ──────
    for (const item of itens) {
      // SELECT ... FOR UPDATE trava a linha no banco durante a transação,
      // impedindo que dois pedidos simultâneos leiam o mesmo estoque disponível.
      const [rows]: any = await conn.execute(
        'SELECT id, nome, quantidade FROM produtos WHERE id = ? FOR UPDATE',
        [item.produto_id]
      );

      if (!rows || rows.length === 0) {
        throw Object.assign(new Error(`Produto ID ${item.produto_id} não encontrado`), { statusCode: 404 });
      }

      const produto = rows[0];

      // ── TRAVA CRÍTICA: Bloqueia saída se o estoque for insuficiente ─────
      if (tipo === 'saida' && produto.quantidade < item.quantidade) {
        throw Object.assign(
          new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade}, solicitado: ${item.quantidade}`),
          { statusCode: 409 }
        );
      }
    }

    // ── Inserir o pedido ──────────────────────────────────────────────────
    const [pedidoResult]: any = await conn.execute(
      'INSERT INTO pedidos (tipo, status, valor_total, usuario_id, fornecedor_id) VALUES (?, ?, ?, ?, ?)',
      [tipo, status, valor_total ?? 0, usuario_id, fornecedor_id ?? null]
    );
    const pedidoId = pedidoResult.insertId;

    // ── Bulk insert de itens + movimentações + atualização de estoque ─────
    for (const item of itens) {
      const op = tipo === 'entrada' ? '+' : '-';

      // Insere o item do pedido
      await conn.execute(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.produto_id, item.quantidade, item.preco_unitario]
      );

      // Registra movimentação para auditoria
      await conn.execute(
        'INSERT INTO movimentacoes (produto_id, usuario_id, pedido_id, tipo, qtd_anterior, qtd_nova) VALUES (?, ?, ?, ?, (SELECT quantidade FROM produtos WHERE id = ?), (SELECT quantidade FROM produtos WHERE id = ?) + ?)',
        [item.produto_id, usuario_id, pedidoId, tipo, item.produto_id, item.produto_id, op === '+' ? item.quantidade : -item.quantidade]
      );

      // Atualiza estoque e status em uma única query (evita N+1)
      await conn.execute(
        `UPDATE produtos
         SET
           quantidade = quantidade ${op} ?,
           status = CASE
             WHEN (quantidade ${op} ?) <= 0        THEN 'sem_estoque'
             WHEN (quantidade ${op} ?) <= qtd_minima THEN 'baixo_estoque'
             ELSE 'em_estoque'
           END
         WHERE id = ?`,
        [item.quantidade, item.quantidade, item.quantidade, item.produto_id]
      );
    }

    await conn.commit();
    res.status(201).json({ id: pedidoId, message: 'Pedido criado com sucesso' });
  } catch (error: any) {
    await conn.rollback();
    const statusCode = error.statusCode ?? 500;
    next(createError(error.message || 'Erro ao criar pedido', statusCode));
  } finally {
    conn.release();
  }
};

// ─── Cancelamento de pedido (com reversão de estoque) ────────────────────────
export const cancelPedido = async (req: Request, res: Response, next: NextFunction) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;

    await conn.beginTransaction();

    const [pedidos]: any = await conn.execute(
      'SELECT tipo, status FROM pedidos WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!pedidos || pedidos.length === 0) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
    if (pedidos[0].status === 'cancelado') throw Object.assign(new Error('Pedido já está cancelado'), { statusCode: 409 });

    const tipo = pedidos[0].tipo;
    const [itens]: any = await conn.execute(
      'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );

    for (const item of itens) {
      // Reversão: ENTRADA vira -quantidade, SAÍDA vira +quantidade
      const op = tipo === 'entrada' ? '-' : '+';
      await conn.execute(
        `UPDATE produtos
         SET
           quantidade = quantidade ${op} ?,
           status = CASE
             WHEN (quantidade ${op} ?) <= 0        THEN 'sem_estoque'
             WHEN (quantidade ${op} ?) <= qtd_minima THEN 'baixo_estoque'
             ELSE 'em_estoque'
           END
         WHERE id = ?`,
        [item.quantidade, item.quantidade, item.quantidade, item.produto_id]
      );
    }

    await conn.execute('UPDATE pedidos SET status = ? WHERE id = ?', ['cancelado', id]);
    await conn.commit();
    res.json({ message: 'Pedido cancelado e estoque revertido' });
  } catch (error: any) {
    await conn.rollback();
    next(createError(error.message || 'Erro ao cancelar pedido', error.statusCode ?? 500));
  } finally {
    conn.release();
  }
};

// ─── Atualização simples de status ───────────────────────────────────────────
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pendente', 'entregue', 'cancelado', 'retorno'];
    if (!allowed.includes(status)) return next(createError('Status inválido', 422));
    await execute('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Status atualizado' });
  } catch (error) {
    next(createError('Erro ao atualizar status', 500));
  }
};

// ─── Exportação CSV ───────────────────────────────────────────────────────────
export const exportCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pedidos = await query<any>(
      'SELECT id, tipo, status, valor_total, criado_em FROM pedidos ORDER BY id DESC',
      []
    );
    const header = 'ID,Tipo,Status,"Valor Total",Data\n';
    const rows = pedidos.map(p =>
      `${p.id},${p.tipo},${p.status},"${p.valor_total}","${p.criado_em}"`
    ).join('\n');

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('pedidos.csv');
    res.send(header + rows);
  } catch (error) {
    next(createError('Erro ao exportar', 500));
  }
};
