-- ============================================================
-- Green Estoque — Schema completo do banco de dados
-- migrations/001_schema.sql
-- MySQL 8.0+ / MariaDB 10.6+
-- Idempotente: pode ser executado múltiplas vezes sem erros
-- ============================================================

CREATE DATABASE IF NOT EXISTS green_estoque
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE green_estoque;

-- ------------------------------------------------------------
-- Tabela: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL,
  senha_hash    VARCHAR(255)    NOT NULL,
  perfil        ENUM('admin','funcionario') NOT NULL DEFAULT 'funcionario',
  ativo         BOOLEAN         NOT NULL DEFAULT TRUE,
  foto_url      VARCHAR(500)    NULL,
  reset_token   VARCHAR(255)    NULL,
  reset_expiry  DATETIME        NULL,
  criado_em     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: categorias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome      VARCHAR(100)  NOT NULL,
  descricao VARCHAR(500)  NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: fornecedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fornecedores (
  id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome      VARCHAR(150)  NOT NULL,
  email     VARCHAR(150)  NULL,
  telefone  VARCHAR(20)   NULL,
  cnpj      VARCHAR(20)   NULL,
  criado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: produtos
-- Inclui: status calculado, sku, marca, potencia_w, imagem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(150)      NOT NULL,
  sku           VARCHAR(80)       NULL,
  marca         VARCHAR(100)      NULL,
  potencia_w    DECIMAL(10,2)     NULL,
  preco_compra  DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  quantidade    INT               NOT NULL DEFAULT 0,
  qtd_minima    INT               NOT NULL DEFAULT 0,
  status        ENUM('em_estoque','baixo_estoque','sem_estoque') NOT NULL DEFAULT 'em_estoque',
  descricao     TEXT              NULL,
  imagem        VARCHAR(500)      NULL,
  ativo         BOOLEAN           NOT NULL DEFAULT TRUE,
  categoria_id  INT UNSIGNED      NULL,
  fornecedor_id INT UNSIGNED      NULL,
  criado_em     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_produtos_sku    (sku),
  INDEX idx_produtos_nome       (nome),
  INDEX idx_produtos_status     (status),
  INDEX idx_produtos_ativo      (ativo),
  INDEX idx_produtos_categoria  (categoria_id),
  CONSTRAINT fk_produto_categoria
    FOREIGN KEY (categoria_id)  REFERENCES categorias(id)   ON DELETE SET NULL,
  CONSTRAINT fk_produto_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: pedidos (cabeçalho)
-- Um pedido pode ter N itens (vide tabela itens_pedido abaixo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED  NULL,
  fornecedor_id INT UNSIGNED  NULL,
  tipo          ENUM('entrada','saida') NOT NULL,
  status        ENUM('pendente','entregue','cancelado','retorno') NOT NULL DEFAULT 'pendente',
  valor_total   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_pedidos_status     (status),
  INDEX idx_pedidos_criado_em  (criado_em),
  INDEX idx_pedidos_usuario    (usuario_id),
  CONSTRAINT fk_pedido_usuario
    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)     ON DELETE SET NULL,
  CONSTRAINT fk_pedido_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: itens_pedido (linhas de cada pedido)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_pedido (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id      INT UNSIGNED  NOT NULL,
  produto_id     INT UNSIGNED  NULL,
  quantidade     INT           NOT NULL,
  preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  PRIMARY KEY (id),
  INDEX idx_itens_pedido_id  (pedido_id),
  INDEX idx_itens_produto_id (produto_id),
  CONSTRAINT fk_item_pedido
    FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)  ON DELETE CASCADE,
  CONSTRAINT fk_item_produto
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: movimentacoes (livro-caixa imutável de estoque)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  produto_id    INT UNSIGNED  NULL,
  pedido_id     INT UNSIGNED  NULL,
  usuario_id    INT UNSIGNED  NULL,
  tipo          ENUM('entrada','saida','ajuste') NOT NULL,
  qtd_anterior  INT           NOT NULL,
  qtd_nova      INT           NOT NULL,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_mov_produto    (produto_id),
  INDEX idx_mov_criado_em  (criado_em),
  CONSTRAINT fk_mov_produto
    FOREIGN KEY (produto_id) REFERENCES produtos(id)  ON DELETE SET NULL,
  CONSTRAINT fk_mov_pedido
    FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)   ON DELETE SET NULL,
  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed: Categorias padrão do setor solar
-- INSERT IGNORE é idempotente (não falha se já existir)
-- ------------------------------------------------------------
INSERT IGNORE INTO categorias (nome, descricao) VALUES
  ('Painéis Solares',       'Módulos fotovoltaicos de todos os tipos'),
  ('Inversores',            'Inversores string, micro e híbridos'),
  ('Baterias',              'Baterias de lítio, chumbo e fluxo'),
  ('Cabos e Conectores',    'Cabos solar, MC4, conectores e proteções'),
  ('Estruturas de Fixação', 'Trilhos, suportes e acessórios de montagem');
