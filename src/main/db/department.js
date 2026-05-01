/**
 * 部门模块
 * 提供部门的增删改查及路径计算功能
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

/**
 * 获取所有部门路径并更新到数据库
 * 用于新增或编辑部门后重新计算全表路径
 */
function recalcAllDeptPaths() {
  const db = getDb()
  const all = getAllDepartments()
  all.forEach(d => {
    const ids = [d.id]
    const names = [d.name]
    let pid = d.parent_id || 0
    while (pid) {
      const parent = all.find(p => p.id == pid)
      if (!parent) break
      ids.unshift(parent.id)
      names.unshift(parent.name)
      pid = parent.parent_id || 0
    }
    const stmt = db.prepare('UPDATE departments SET path_ids = ?, path_names = ? WHERE id = ?')
    stmt.run([ids.join('/'), names.join('/'), d.id])
    stmt.free()
  })
  save()
}

/**
 * 新增部门
 * @param {string} name - 部门名称
 * @param {string} description - 部门描述
 * @param {number} parent_id - 上级部门ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {number} 新增部门的ID
 */
function addDepartment(name, description, parent_id, operator) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO departments (name, description, parent_id, created_by, is_deleted) VALUES (?, ?, ?, ?, 0)')
  stmt.run([name, description, parent_id || 0, operator?.id || null])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  recalcAllDeptPaths()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '部门管理',
    action: '新增',
    targetType: '部门',
    targetId: result.id,
    targetName: name,
    detail: JSON.stringify({ description, parent_id })
  })
  return result.id
}

/**
 * 获取所有部门列表（排除已删除的）
 * @returns {Array} 部门列表
 */
function getAllDepartments() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments WHERE is_deleted = 0 ORDER BY created_at DESC')
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 更新部门信息
 * @param {number} id - 部门ID
 * @param {string} name - 部门名称
 * @param {string} description - 部门描述
 * @param {number} parent_id - 上级部门ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateDepartment(id, name, description, parent_id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE departments SET name = ?, description = ?, parent_id = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([name, description, parent_id || 0, operator?.id || null, id])
  stmt.free()
  recalcAllDeptPaths()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '部门管理',
    action: '编辑',
    targetType: '部门',
    targetId: id,
    targetName: name,
    detail: JSON.stringify({ description, parent_id })
  })
  return true
}

/**
 * 删除部门（逻辑删除）
 * @param {number} id - 部门ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteDepartment(id, operator) {
  const db = getDb()
  // 获取部门信息用于日志记录
  const infoStmt = db.prepare('SELECT name FROM departments WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const deptInfo = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE departments SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '部门管理',
    action: '删除',
    targetType: '部门',
    targetId: id,
    targetName: deptInfo?.name
  })
  return true
}

/**
 * 获取指定部门的子部门列表（排除已删除的）
 * @param {number} id - 部门ID
 * @returns {Array} 子部门列表
 */
function getChildDepartments(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments WHERE parent_id = ? AND is_deleted = 0')
  stmt.bind([id])
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

module.exports = {
  addDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getChildDepartments,
  recalcAllDeptPaths
}