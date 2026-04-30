/**
 * 字典模块
 * 提供字典类型和字典项的增删改查功能
 */

const { getDb, save } = require('./core')

/**
 * 获取所有字典类型
 * @returns {Array} 字典类型列表
 */
function getAllDictTypes() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM dict_types ORDER BY id')
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 新增字典类型
 * @param {string} code - 类型编码
 * @param {string} name - 类型名称
 * @param {string} description - 类型描述
 * @returns {number} 新增类型的ID
 */
function addDictType(code, name, description) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_types (code, name, description) VALUES (?, ?, ?)')
  stmt.run([code, name, description || ''])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  return result.id
}

/**
 * 更新字典类型
 * @param {number} id - 类型ID
 * @param {string} code - 类型编码
 * @param {string} name - 类型名称
 * @param {string} description - 类型描述
 * @returns {boolean} 更新成功返回true
 */
function updateDictType(id, code, name, description) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_types SET code = ?, name = ?, description = ? WHERE id = ?')
  stmt.run([code, name, description || '', id])
  stmt.free()
  save()
  return true
}

/**
 * 删除字典类型（同时删除关联的字典项）
 * @param {number} id - 类型ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDictType(id) {
  const db = getDb()
  // 先删除关联的字典项
  const itemStmt = db.prepare('DELETE FROM dict_items WHERE type_code = (SELECT code FROM dict_types WHERE id = ?)')
  itemStmt.run([id])
  itemStmt.free()
  // 再删除类型
  const stmt = db.prepare('DELETE FROM dict_types WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

/**
 * 根据类型编码获取字典项列表
 * @param {string} typeCode - 字典类型编码
 * @returns {Array} 字典项列表
 */
function getDictItemsByType(typeCode) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM dict_items WHERE type_code = ? ORDER BY sort, id')
  stmt.bind([typeCode])
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 新增字典项
 * @param {string} typeCode - 字典类型编码
 * @param {string} label - 显示名称
 * @param {string} value - 选项值
 * @param {number} sort - 排序
 * @returns {number} 新增字典项的ID
 */
function addDictItem(typeCode, label, value, sort) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort) VALUES (?, ?, ?, ?)')
  stmt.run([typeCode, label, value, sort || 0])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  return result.id
}

/**
 * 更新字典项
 * @param {number} id - 字典项ID
 * @param {string} typeCode - 字典类型编码
 * @param {string} label - 显示名称
 * @param {string} value - 选项值
 * @param {number} sort - 排序
 * @returns {boolean} 更新成功返回true
 */
function updateDictItem(id, typeCode, label, value, sort) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_items SET type_code = ?, label = ?, value = ?, sort = ? WHERE id = ?')
  stmt.run([typeCode, label, value, sort || 0, id])
  stmt.free()
  save()
  return true
}

/**
 * 删除字典项
 * @param {number} id - 字典项ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDictItem(id) {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM dict_items WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

/**
 * 初始化字典表结构和种子数据
 */
function initDictTables() {
  const db = getDb()

  // 创建字典类型表
  db.run(`
    CREATE TABLE IF NOT EXISTS dict_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 创建字典项表
  db.run(`
    CREATE TABLE IF NOT EXISTS dict_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_code TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      sort INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 初始化性别字典数据
  const typeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'gender'")
  typeCheckStmt.step()
  const typeCount = Number(typeCheckStmt.getAsObject().c)
  typeCheckStmt.free()
  if (typeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description) VALUES (?, ?, ?)')
    typeStmt.run(['gender', '性别', '员工性别选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort) VALUES (?, ?, ?, ?)')
    itemStmt.run(['gender', '男', '男', 1])
    itemStmt.run(['gender', '女', '女', 2])
    itemStmt.free()
    console.log('[DB] dictionaries seeded')
  }
}

module.exports = {
  getAllDictTypes,
  addDictType,
  updateDictType,
  deleteDictType,
  getDictItemsByType,
  addDictItem,
  updateDictItem,
  deleteDictItem,
  initDictTables
}