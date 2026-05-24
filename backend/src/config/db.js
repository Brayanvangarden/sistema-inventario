import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databaseFile = process.env.DB_FILE || path.join(__dirname, '../../data/database.sqlite');

mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = await open({
  filename: databaseFile,
  driver: sqlite3.Database,
});

await db.exec('PRAGMA foreign_keys = ON');

const isSelectQuery = (sql) => /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql);

const pool = {
  query: async (sql, params = []) => {
    if (isSelectQuery(sql)) {
      const rows = await db.all(sql, params);
      return [rows];
    }

    const result = await db.run(sql, params);
    return [{
      insertId: result.lastID,
      affectedRows: result.changes,
      changes: result.changes,
    }];
  },
  getConnection: async () => ({
    query: async (sql, params = []) => {
      if (isSelectQuery(sql)) {
        const rows = await db.all(sql, params);
        return [rows];
      }

      const result = await db.run(sql, params);
      return [{
        insertId: result.lastID,
        affectedRows: result.changes,
        changes: result.changes,
      }];
    },
    beginTransaction: async () => db.exec('BEGIN TRANSACTION'),
    commit: async () => db.exec('COMMIT'),
    rollback: async () => db.exec('ROLLBACK'),
    release: () => {},
  }),
  exec: async (sql) => db.exec(sql),
  get: async (sql, params = []) => db.get(sql, params),
  all: async (sql, params = []) => db.all(sql, params),
};

export { db, pool };
