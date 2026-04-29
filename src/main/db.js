const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'app.db')
  : path.join(__dirname, '../../app.db')

let SQL
let db

async function init() {
  SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(filebuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)
  save()
}

function save() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function addItem(name, value) {
  const stmt = db.prepare('INSERT INTO items (name, value) VALUES (?, ?)')
  stmt.run([name, value])
  stmt.free()

  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()

  save()
  return result.id
}

function getAllItems() {
  const stmt = db.prepare('SELECT * FROM items ORDER BY created_at DESC')
  const items = []
  while (stmt.step()) {
    items.push(stmt.getAsObject())
  }
  stmt.free()
  return items
}

function getItemById(id) {
  const stmt = db.prepare('SELECT * FROM items WHERE id = ?')
  stmt.bind([id])
  let item = null
  if (stmt.step()) {
    item = stmt.getAsObject()
  }
  stmt.free()
  return item
}

function updateItem(id, name, value) {
  const stmt = db.prepare('UPDATE items SET name = ?, value = ? WHERE id = ?')
  stmt.run([name, value, id])
  stmt.free()
  save()
  return true
}

function deleteItem(id) {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

function close() {
  if (db) {
    save()
    db.close()
  }
}

module.exports = {
  init,
  addItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  close,
}
