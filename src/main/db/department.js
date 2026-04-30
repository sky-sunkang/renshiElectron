/**
 * 部门模块
 * 提供部门的增删改查及路径计算功能
 */

const { getDb, save } = require('./core')

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
 * @param {number} createdBy - 创建人ID
 * @returns {number} 新增部门的ID
 */
function addDepartment(name, description, parent_id, createdBy) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO departments (name, description, parent_id, created_by, is_deleted) VALUES (?, ?, ?, ?, 0)')
  stmt.run([name, description, parent_id || 0, createdBy || null])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  recalcAllDeptPaths()
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
 * @param {number} updatedBy - 修改人ID
 * @returns {boolean} 更新成功返回true
 */
function updateDepartment(id, name, description, parent_id, updatedBy) {
  const db = getDb()
  const stmt = db.prepare('UPDATE departments SET name = ?, description = ?, parent_id = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([name, description, parent_id || 0, updatedBy || null, id])
  stmt.free()
  recalcAllDeptPaths()
  return true
}

/**
 * 删除部门（逻辑删除）
 * @param {number} id - 部门ID
 * @param {number} deletedBy - 删除人ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDepartment(id, deletedBy) {
  const db = getDb()
  const stmt = db.prepare('UPDATE departments SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([deletedBy || null, id])
  stmt.free()
  save()
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