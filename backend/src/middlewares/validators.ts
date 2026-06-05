import { z } from 'zod';

// ─── Produtos ─────────────────────────────────────────────────────────────────
export const createProdutoSchema = z.object({
  nome:         z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(150),
  descricao:    z.string().max(2000).optional(),
  marca:        z.string().max(100).optional(),
  sku:          z.string().max(80).optional(),
  potencia_w:   z.coerce.number().nonnegative().optional(),
  preco_compra: z.coerce.number().nonnegative('Preço não pode ser negativo'),
  quantidade:   z.coerce.number().int().nonnegative('Quantidade não pode ser negativa'),
  qtd_minima:   z.coerce.number().int().nonnegative().default(0),
  categoria_id: z.coerce.number().int().positive().optional().nullable(),
  fornecedor_id:z.coerce.number().int().positive().optional().nullable(),
});

export const updateProdutoSchema = createProdutoSchema.partial();

// ─── Pedidos ──────────────────────────────────────────────────────────────────
const itemPedidoSchema = z.object({
  produto_id:    z.number().int().positive('ID do produto inválido'),
  quantidade:    z.number().int().positive('Quantidade deve ser positiva'),
  preco_unitario:z.number().nonnegative('Preço unitário não pode ser negativo'),
});

export const createPedidoSchema = z.object({
  tipo:         z.enum(['entrada', 'saida'], { message: 'tipo deve ser "entrada" ou "saida"' }),
  status:       z.enum(['pendente', 'entregue', 'cancelado', 'retorno']).default('pendente'),
  valor_total:  z.number().nonnegative().optional(),
  fornecedor_id:z.coerce.number().int().positive().optional().nullable(),
  itens:        z.array(itemPedidoSchema).min(1, 'Pedido deve ter ao menos 1 item'),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export const registerSchema = z.object({
  nome:  z.string().min(2).max(100),
  email: z.string().email(),
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  perfil:z.enum(['admin', 'funcionario']).default('funcionario'),
});

// ─── Tipo utilitário ──────────────────────────────────────────────────────────
export type CreateProdutoDTO  = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoDTO  = z.infer<typeof updateProdutoSchema>;
export type CreatePedidoDTO   = z.infer<typeof createPedidoSchema>;
export type LoginDTO          = z.infer<typeof loginSchema>;
export type RegisterDTO       = z.infer<typeof registerSchema>;
