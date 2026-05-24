import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseFile = process.env.DB_FILE || path.join(__dirname, 'data', 'database.sqlite');
const sqlFile = path.join(__dirname, '..', 'script', 'style_sqlite.sql');

async function main() {
  try {
    const sql = await fs.readFile(sqlFile, 'utf8');
    await fs.mkdir(path.dirname(databaseFile), { recursive: true });

    try {
      await fs.unlink(databaseFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const db = await open({
      filename: databaseFile,
      driver: sqlite3.Database,
    });

    await db.exec(sql);
    await db.close();

    console.log('SQLite database initialized successfully.');
    console.log(`Database file: ${databaseFile}`);
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    process.exit(1);
  }
}

main();
