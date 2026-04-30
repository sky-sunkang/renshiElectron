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
 * @returns {number} 新增部门的ID
 */
function addDepartment(name, description, parent_id) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO departments (name, description, parent_id) VALUES (?, ?, ?)')
  stmt.run([name, description, parent_id || 0])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  recalcAllDeptPaths()
  return result.id
}

/**
 * 获取所有部门列表
 * @returns {Array} 部门列表
 */
function getAllDepartments() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments ORDER BY created_at DESC')
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
 * @returns {boolean} 更新成功返回true
 */
function updateDepartment(id, name, description, parent_id) {
  const db = getDb()
  const stmt = db.prepare('UPDATE departments SET name = ?, description = ?, parent_id = ? WHERE id = ?')
  stmt.run([name, description, parent_id || 0, id])
  stmt.free()
  recalcAllDeptPaths()
  return true
}

/**
 * 删除部门
 * @param {number} id - 部门ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDepartment(id) {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM departments WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

/**
 * 获取指定部门的子部门列表
 * @param {number} id - 部门ID
 * @returns {Array} 子部门列表
 */
function getChildDepartments(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments WHERE parent_id = ?')
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