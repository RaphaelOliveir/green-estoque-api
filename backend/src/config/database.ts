import mysql, { type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexões reutilizável (exportado para uso em transações)
export const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'green_estoque',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Helper: SELECT — retorna array de linhas tipadas via RowDataPacket
export async function query<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows;
}

// Helper: INSERT / UPDATE / DELETE — retorna ResultSetHeader
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

// Testa a conexão na inicialização do servidor
export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados MySQL');
    conn.release();
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco de dados:', err);
    process.exit(1);
  }
}

export default pool;



