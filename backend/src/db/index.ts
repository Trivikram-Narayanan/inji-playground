import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDb = async () => {
  if (db) return db;
  
  db = await open({
    filename: process.env.DB_FILE || path.join(__dirname, '../../playground.sqlite'),
    driver: sqlite3.Database
  });

  // Run schema initialization
  const fs = require('fs');
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schema);
  }

  return db;
};

export const getDb = async () => {
  if (!db) {
    return await initDb();
  }
  return db;
};
