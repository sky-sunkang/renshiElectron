/**
 * 字典模块
 * 提供字典类型和字典项的增删改查功能
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

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
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {number} 新增类型的ID
 */
function addDictType(code, name, description, operator) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_types (code, name, description, created_by, is_deleted) VALUES (?, ?, ?, ?, 0)')
  stmt.run([code, name, description || '', operator?.id || null])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '新增类型',
    targetType: '字典类型',
    targetId: result.id,
    targetName: name,
    detail: JSON.stringify({ code, description })
  })
  return result.id
}

/**
 * 更新字典类型
 * @param {number} id - 类型ID
 * @param {string} code - 类型编码
 * @param {string} name - 类型名称
 * @param {string} description - 类型描述
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateDictType(id, code, name, description, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_types SET code = ?, name = ?, description = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([code, name, description || '', operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '编辑类型',
    targetType: '字典类型',
    targetId: id,
    targetName: name,
    detail: JSON.stringify({ code, description })
  })
  return true
}

/**
 * 删除字典类型（逻辑删除，同时逻辑删除关联的字典项）
 * @param {number} id - 类型ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteDictType(id, operator) {
  const db = getDb()
  // 获取类型信息用于日志记录
  const infoStmt = db.prepare('SELECT code, name FROM dict_types WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const typeInfo = infoStmt.getAsObject()
  infoStmt.free()

  // 先逻辑删除关联的字典项
  const itemStmt = db.prepare('UPDATE dict_items SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE type_code = (SELECT code FROM dict_types WHERE id = ?)')
  itemStmt.run([operator?.id || null, id])
  itemStmt.free()
  // 再逻辑删除类型
  const stmt = db.prepare('UPDATE dict_types SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '删除类型',
    targetType: '字典类型',
    targetId: id,
    targetName: typeInfo?.name,
    detail: JSON.stringify({ code: typeInfo?.code })
  })
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
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {number} 新增字典项的ID
 */
function addDictItem(typeCode, label, value, sort, operator) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, created_by, is_deleted) VALUES (?, ?, ?, ?, ?, 0)')
  stmt.run([typeCode, label, value, sort || 0, operator?.id || null])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '新增项',
    targetType: '字典项',
    targetId: result.id,
    targetName: label,
    detail: JSON.stringify({ typeCode, value, sort })
  })
  return result.id
}

/**
 * 更新字典项
 * @param {number} id - 字典项ID
 * @param {string} typeCode - 字典类型编码
 * @param {string} label - 显示名称
 * @param {string} value - 选项值
 * @param {number} sort - 排序
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateDictItem(id, typeCode, label, value, sort, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE dict_items SET type_code = ?, label = ?, value = ?, sort = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([typeCode, label, value, sort || 0, operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '编辑项',
    targetType: '字典项',
    targetId: id,
    targetName: label,
    detail: JSON.stringify({ typeCode, value, sort })
  })
  return true
}

/**
 * 删除字典项（逻辑删除）
 * @param {number} id - 字典项ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteDictItem(id, operator) {
  const db = getDb()
  // 获取字典项信息用于日志记录
  const infoStmt = db.prepare('SELECT label, type_code FROM dict_items WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const itemInfo = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE dict_items SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '字典管理',
    action: '删除项',
    targetType: '字典项',
    targetId: id,
    targetName: itemInfo?.label,
    detail: JSON.stringify({ typeCode: itemInfo?.type_code })
  })
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