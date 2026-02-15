import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'time_tracking.db');

let db;

/**
 * Initialize database connection and create schema
 */
export async function initializeDB() {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        createSchema()
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

/**
 * Create tables if they don't exist
 */
async function createSchema() {
  const run = promisify(db.run.bind(db));

  const schema = `
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      project TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK (end_time > start_time)
    );

    CREATE INDEX IF NOT EXISTS idx_project ON entries(project);
    CREATE INDEX IF NOT EXISTS idx_start_time ON entries(start_time);
  `;

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await run(statement);
  }
}

/**
 * Get database instance
 */
export function getDB() {
  return db;
}

/**
 * Execute a query and return results as Promise
 */
export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Execute a statement that returns a single row
 */
export function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

/**
 * Execute a statement that doesn't return rows (INSERT, UPDATE, DELETE)
 */
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

/**
 * Create a new time entry
 */
export async function createEntry({ start_time, end_time, project, notes }) {
  const sql = `
    INSERT INTO entries (start_time, end_time, project, notes)
    VALUES (?, ?, ?, ?)
  `;
  const result = await run(sql, [start_time, end_time, project, notes || null]);
  return queryOne('SELECT * FROM entries WHERE id = ?', [result.id]);
}

/**
 * Get all entries with optional filters
 */
export async function getEntries({ project, limit = 100, offset = 0 } = {}) {
  let sql = 'SELECT * FROM entries';
  const params = [];

  if (project) {
    sql += ' WHERE project = ?';
    params.push(project);
  }

  sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return query(sql, params);
}

/**
 * Get entry by ID
 */
export async function getEntryById(id) {
  return queryOne('SELECT * FROM entries WHERE id = ?', [id]);
}

/**
 * Update entry
 */
export async function updateEntry(id, updates) {
  const fields = [];
  const values = [];

  if (updates.start_time !== undefined) {
    fields.push('start_time = ?');
    values.push(updates.start_time);
  }
  if (updates.end_time !== undefined) {
    fields.push('end_time = ?');
    values.push(updates.end_time);
  }
  if (updates.project !== undefined) {
    fields.push('project = ?');
    values.push(updates.project);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    return getEntryById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const sql = `UPDATE entries SET ${fields.join(', ')} WHERE id = ?`;
  await run(sql, values);

  return getEntryById(id);
}

/**
 * Delete entry
 */
export async function deleteEntry(id) {
  const result = await run('DELETE FROM entries WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * Get statistics - total hours by project
 */
export async function getStatsByProject() {
  const sql = `
    SELECT
      project,
      COUNT(*) as total_entries,
      SUM((julianday(end_time) - julianday(start_time)) * 24) as total_hours,
      MIN(start_time) as first_entry,
      MAX(end_time) as last_entry
    FROM entries
    GROUP BY project
    ORDER BY total_hours DESC
  `;
  return query(sql);
}

/**
 * Close database connection
 */
export async function closeDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}
