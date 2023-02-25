import sqlite3 from "sqlite3";
import { promisify } from "node:util";

export const DB_FILE_NAME = "./calls.db";

export async function getDB() {
  const db = await openDB(DB_FILE_NAME);

  db.run = promisify(db.run);
  db.get = promisify(db.get);
  db.all = promisify(db.all);
  db.each = promisify(db.each);
  db.exec = promisify(db.exec);
  db.prepare = promisify(db.prepare);
  db.serialize = promisify(db.serialize);
  db.parallelize = promisify(db.parallelize);

  return db;
}

async function openDB(fileName) {
  return new Promise((res, rej) => {
    const db = new sqlite3.Database(fileName, err => {
      if (err) {
        rej(err);
      } else {
        res(db);
      }
    });
  });
}

export async function initDB(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS calls(
      id INTEGER PRIMARY KEY,
      host_id TEXT,
      call_id TEXT,
      sdp TEXT,
      expires_at DATETIME
    );
  `);
}
