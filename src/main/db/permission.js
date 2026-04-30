/**
 * 权限模块
 * 提供RBAC权限管理：角色、权限、用户角色关联
 */

const { getDb, save } = require('./core')

/**
 * 获取用户的权限列表
 * @param {number} userId - 用户ID
 * @returns {Array} 权限代码列表
 */
function getUserPermissions(userId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT DISTINCT rp.permission_code
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
  `)
  stmt.bind([userId])
  const permissions = []
  while (stmt.step()) {
    permissions.push(stmt.getAsObject().permission_code)
  }
  stmt.free()
  return permissions
}

/**
 * 获取用户的角色列表
 * @param {number} userId - 用户ID
 * @returns {Array} 角色信息列表
 */
function getUserRoles(userId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT r.id, r.code, r.name, r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `)
  stmt.bind([userId])
  const roles = []
  while (stmt.step()) {
    roles.push(stmt.getAsObject())
  }
  stmt.free()
  return roles
}

/**
 * 检查用户是否有指定权限
 * @param {number} userId - 用户ID
 * @param {string} permissionCode - 权限代码
 * @returns {boolean} 是否有权限
 */
function hasPermission(userId, permissionCode) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT COUNT(*) as c
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = ? AND rp.permission_code = ?
  `)
  stmt.bind([userId, permissionCode])
  stmt.step()
  const count = Number(stmt.getAsObject().c)
  stmt.free()
  return count > 0
}

/**
 * 检查用户是否为超级管理员
 * 系统管理员账号（sysadmin）始终是超级管理员
 * @param {number} userId - 用户ID
 * @returns {boolean} 是否为超级管理员
 */
function isSuperAdmin(userId) {
  const db = getDb()
  // 先检查是否为系统管理员账号
  const accountStmt = db.prepare('SELECT account FROM employees WHERE id = ?')
  accountStmt.bind([userId])
  accountStmt.step()
  const accountObj = accountStmt.getAsObject()
  accountStmt.free()

  // 系统管理员账号始终是超级管理员
  if (accountObj && accountObj.account === 'sysadmin') {
    return true
  }

  // 其他用户检查是否有 sysadmin 角色
  const stmt = db.prepare(`
    SELECT COUNT(*) as c
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND r.code = 'sysadmin'
  `)
  stmt.bind([userId])
  stmt.step()
  const count = Number(stmt.getAsObject().c)
  stmt.free()
  return count > 0
}

// ==================== 角色管理 ====================

/**
 * 获取所有角色
 * @returns {Array} 角色列表
 */
function getAllRoles() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM roles ORDER BY is_system DESC, created_at ASC')
  const roles = []
  while (stmt.step()) {
    const role = stmt.getAsObject()
    role.is_system = Boolean(role.is_system)
    roles.push(role)
  }
  stmt.free()
  return roles
}

/**
 * 根据ID获取角色
 * @param {number} id - 角色ID
 * @returns {Object|null} 角色信息
 */
function getRoleById(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM roles WHERE id = ?')
  stmt.bind([id])
  let role = null
  if (stmt.step()) {
    role = stmt.getAsObject()
    role.is_system = Boolean(role.is_system)
  }
  stmt.free()
  return role
}

/**
 * 新增角色
 * @param {Object} data - 角色数据
 * @returns {number} 新增角色的ID
 */
function addRole(data) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO roles (code, name, description) VALUES (?, ?, ?)')
  stmt.run([data.code, data.name, data.description])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  return result.id
}

/**
 * 更新角色
 * @param {number} id - 角色ID
 * @param {Object} data - 角色数据
 * @returns {boolean} 更新成功返回true
 */
function updateRole(id, data) {
  const db = getDb()
  const stmt = db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?')
  stmt.run([data.name, data.description, id])
  stmt.free()
  save()
  return true
}

/**
 * 删除角色
 * @param {number} id - 角色ID
 * @returns {boolean} 删除成功返回true
 */
function deleteRole(id) {
  const db = getDb()

  // 检查是否为系统角色
  const checkStmt = db.prepare('SELECT is_system FROM roles WHERE id = ?')
  checkStmt.bind([id])
  checkStmt.step()
  const isSystem = Boolean(checkStmt.getAsObject()?.is_system)
  checkStmt.free()

  if (isSystem) {
    throw new Error('系统角色不能删除')
  }

  // 删除角色权限关联
  const permStmt = db.prepare('DELETE FROM role_permissions WHERE role_id = ?')
  permStmt.run([id])
  permStmt.free()

  // 删除用户角色关联
  const userStmt = db.prepare('DELETE FROM user_roles WHERE role_id = ?')
  userStmt.run([id])
  userStmt.free()

  // 删除角色
  const stmt = db.prepare('DELETE FROM roles WHERE id = ?')
  stmt.run([id])
  stmt.free()

  save()
  return true
}

/**
 * 获取角色的权限列表
 * @param {number} roleId - 角色ID
 * @returns {Array} 权限代码列表
 */
function getRolePermissions(roleId) {
  const db = getDb()
  const stmt = db.prepare('SELECT permission_code FROM role_permissions WHERE role_id = ?')
  stmt.bind([roleId])
  const permissions = []
  while (stmt.step()) {
    permissions.push(stmt.getAsObject().permission_code)
  }
  stmt.free()
  return permissions
}

/**
 * 设置角色的权限
 * @param {number} roleId - 角色ID
 * @param {Array} permissionCodes - 权限代码列表
 * @returns {boolean} 设置成功返回true
 */
function setRolePermissions(roleId, permissionCodes) {
  const db = getDb()

  // 删除原有权限
  const delStmt = db.prepare('DELETE FROM role_permissions WHERE role_id = ?')
  delStmt.run([roleId])
  delStmt.free()

  // 添加新权限
  const stmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  permissionCodes.forEach(code => stmt.run([roleId, code]))
  stmt.free()

  save()
  return true
}

// ==================== 用户角色管理 ====================

/**
 * 设置用户的角色
 * @param {number} userId - 用户ID
 * @param {Array} roleIds - 角色ID列表
 * @returns {boolean} 设置成功返回true
 */
function setUserRoles(userId, roleIds) {
  const db = getDb()

  // 删除原有角色
  const delStmt = db.prepare('DELETE FROM user_roles WHERE user_id = ?')
  delStmt.run([userId])
  delStmt.free()

  // 添加新角色
  const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)')
  roleIds.forEach(roleId => stmt.run([userId, roleId]))
  stmt.free()

  // 更新用户主角色代码
  if (roleIds.length > 0) {
    const roleStmt = db.prepare('SELECT code FROM roles WHERE id = ?')
    roleStmt.bind([roleIds[0]])
    roleStmt.step()
    const roleCode = roleStmt.getAsObject()?.code
    roleStmt.free()

    if (roleCode) {
      const updateStmt = db.prepare('UPDATE employees SET role_code = ? WHERE id = ?')
      updateStmt.run([roleCode, userId])
      updateStmt.free()
    }
  }

  save()
  return true
}

/**
 * 为用户添加单个角色
 * @param {number} userId - 用户ID
 * @param {number} roleId - 角色ID
 * @returns {boolean} 添加成功返回true
 */
function addUserRole(userId, roleId) {
  const db = getDb()

  // 检查是否已有该角色
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM user_roles WHERE user_id = ? AND role_id = ?')
  checkStmt.bind([userId, roleId])
  checkStmt.step()
  const count = Number(checkStmt.getAsObject().c)
  checkStmt.free()

  if (count === 0) {
    const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)')
    stmt.run([userId, roleId])
    stmt.free()
    save()
  }

  return true
}

/**
 * 移除用户的单个角色
 * @param {number} userId - 用户ID
 * @param {number} roleId - 角色ID
 * @returns {boolean} 移除成功返回true
 */
function removeUserRole(userId, roleId) {
  const db = getDb()

  const stmt = db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?')
  stmt.run([userId, roleId])
  stmt.free()

  save()
  return true
}

/**
 * 获取所有权限列表
 * @returns {Array} 权限列表
 */
function getAllPermissions() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM permissions ORDER BY type, code')
  const permissions = []
  while (stmt.step()) {
    permissions.push(stmt.getAsObject())
  }
  stmt.free()
  return permissions
}

/**
 * 获取角色的用户列表
 * @param {number} roleId - 角色ID
 * @returns {Array} 用户信息列表
 */
function getRoleUsers(roleId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.account, e.position, e.department_id,
           d.name as department_name
    FROM user_roles ur
    JOIN employees e ON ur.user_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ur.role_id = ?
  `)
  stmt.bind([roleId])
  const users = []
  while (stmt.step()) {
    users.push(stmt.getAsObject())
  }
  stmt.free()
  return users
}

module.exports = {
  getUserPermissions,
  getUserRoles,
  hasPermission,
  isSuperAdmin,
  getAllRoles,
  getRoleById,
  addRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  setRolePermissions,
  setUserRoles,
  addUserRole,
  removeUserRole,
  getAllPermissions,
  getRoleUsers
}
