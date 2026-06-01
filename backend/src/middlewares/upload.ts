import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { createError } from './errorHandler';

// ─── Garantir que os diretórios existam ──────────────────────────────────────
const UPLOAD_DIR_PRODUTOS = path.join(__dirname, '../../uploads/produtos');
const UPLOAD_DIR_FOTOS    = path.join(__dirname, '../../uploads/fotos');
fs.mkdirSync(UPLOAD_DIR_PRODUTOS, { recursive: true });
fs.mkdirSync(UPLOAD_DIR_FOTOS,    { recursive: true });

// ─── Extensões/MIME Types permitidos ─────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp'];

// ─── Filtro de arquivo (bloqueia executáveis e tipos perigosos) ───────────────
const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
    return cb(createError('Apenas imagens JPG, PNG ou WEBP são permitidas', 400) as any);
  }
  cb(null, true);
};

// ─── Storage para imagens de produtos ────────────────────────────────────────
const produtoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR_PRODUTOS),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `produto-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// ─── Storage para fotos de usuários ──────────────────────────────────────────
const fotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR_FOTOS),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `foto-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// ─── Exportações ─────────────────────────────────────────────────────────────
export const uploadProduto = multer({
  storage:    produtoStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('imagem');

export const uploadFotoUsuario = multer({
  storage:    fotoStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('foto');
