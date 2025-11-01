import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

let db;

/**
 * Knexインスタンスの初期化
 */
export async function initDatabase() {
  if (db) return db;
  
  // dataディレクトリ作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  db = knex({
    client: 'sqlite3',
    connection: {
      filename: path.join(DATA_DIR, 'weapons.db')
    },
    useNullAsDefault: true
  });
  
  return db;
}

/**
 * Knexインスタンス取得
 */
export function getKnex() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * データベースを閉じる
 */
export async function closeDatabase() {
  if (db) {
    await db.destroy();
    db = null;
  }
}
