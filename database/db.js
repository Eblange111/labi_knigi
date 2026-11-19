const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = {
  all(sql, params, callback) {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      callback(null, rows);
    } catch (err) {
      callback(err);
    }
  },
  get(sql, params, callback) {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      callback(null, row);
    } catch (err) {
      callback(err);
    }
  },
  run(sql, params, callback) {
    try {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      if (callback) callback.call({ lastID: info.lastInsertRowid, changes: info.changes }, null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
};
