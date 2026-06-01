import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export async function initDb() {
  let conn;
  try {
    // Connect without specifying the database so we can create it if it doesn't exist
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true, // Enables running the whole schema file at once
    });

    console.log('🔄 Verificando e sincronizando banco de dados...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../../migrations/001_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema (creates DB, tables, and seeds initial categories)
    await conn.query(schema);

    console.log('✅ Banco de dados sincronizado com sucesso!');
  } catch (error) {
    console.error('❌ Falha ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}
