import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { SCHEMA_SQL } from './schema';

let db: Database | null = null;

const defaultDbPath = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'playground.sqlite');
};

export const initDb = async () => {
  if (db) return db;

  db = await open({
    filename: process.env.DB_FILE || defaultDbPath(),
    driver: sqlite3.Database
  });

  await db.exec(SCHEMA_SQL);

  return db;
};

export const getDb = async () => {
  if (!db) {
    return await initDb();
  }
  return db;
};
