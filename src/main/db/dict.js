/**
 * 字典模块
 * 提供字典类型和字典项的增删改查功能
 */

const { getDb, save } = require('./core')

/**
 * 获取所有字典类型（排除已删除的）
 * @returns {Array} 字典类型列表
 */
function getAllDictTypes() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM dict_types WHERE is_deleted = 0 ORDER BY id')
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
 * @param {number} createdBy - 创建人ID
 * @returns {number} 新增类型的ID
 */
function addDictType(code, name, description, createdBy) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_types (code, name, description, created_by, is_deleted) VALUES (?, ?, ?, ?, 0)')
  stmt.run([code, name, description || '', createdBy || null])
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
 * @param {number} updatedBy - 修改人ID
 * @returns {boolean} 更新成功返回true
 */
function updateDictType(id, code, name, description, updatedBy) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_types SET code = ?, name = ?, description = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([code, name, description || '', updatedBy || null, id])
  stmt.free()
  save()
  return true
}

/**
 * 删除字典类型（逻辑删除，同时逻辑删除关联的字典项）
 * @param {number} id - 类型ID
 * @param {number} deletedBy - 删除人ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDictType(id, deletedBy) {
  const db = getDb()
  // 先逻辑删除关联的字典项
  const itemStmt = db.prepare('UPDATE dict_items SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE type_code = (SELECT code FROM dict_types WHERE id = ?)')
  itemStmt.run([deletedBy || null, id])
  itemStmt.free()
  // 再逻辑删除类型
  const stmt = db.prepare('UPDATE dict_types SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([deletedBy || null, id])
  stmt.free()
  save()
  return true
}

/**
 * 根据类型编码获取字典项列表（排除已删除的）
 * @param {string} typeCode - 字典类型编码
 * @returns {Array} 字典项列表
 */
function getDictItemsByType(typeCode) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM dict_items WHERE type_code = ? AND is_deleted = 0 ORDER BY sort, id')
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
 * @param {number} createdBy - 创建人ID
 * @returns {number} 新增字典项的ID
 */
function addDictItem(typeCode, label, value, sort, createdBy) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, created_by, is_deleted) VALUES (?, ?, ?, ?, ?, 0)')
  stmt.run([typeCode, label, value, sort || 0, createdBy || null])
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
 * @param {number} updatedBy - 修改人ID
 * @returns {boolean} 更新成功返回true
 */
function updateDictItem(id, typeCode, label, value, sort, updatedBy) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_items SET type_code = ?, label = ?, value = ?, sort = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([typeCode, label, value, sort || 0, updatedBy || null, id])
  stmt.free()
  save()
  return true
}

/**
 * 删除字典项（逻辑删除）
 * @param {number} id - 字典项ID
 * @param {number} deletedBy - 删除人ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDictItem(id, deletedBy) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_items SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([deletedBy || null, id])
  stmt.free()
  save()
  return true
}

module.exports = {
  getAllDictTypes,
  addDictType,
  updateDictType,
  deleteDictType,
  getDictItemsByType,
  addDictItem,
  updateDictItem,
  deleteDictItem
}