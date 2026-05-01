/**
 * 权限模块
 * 提供RBAC权限管理：角色、权限、用户角色关联
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

/**
 * 获取用户的权限列表（排除已删除的）
 * @param {number} userId - 用户ID
 * @returns {Array} 权限代码列表
 */
function getUserPermissions(userId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT DISTINCT rp.permission_code
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = ? AND ur.is_deleted = 0 AND rp.is_deleted = 0
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
 * 获取用户的角色列表（排除已删除的）
 * @param {number} userId - 用户ID
 * @returns {Array} 角色信息列表
 */
function getUserRoles(userId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT r.id, r.code, r.name, r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND ur.is_deleted = 0 AND r.is_deleted = 0
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
 * 检查用户是否有指定权限（排除已删除的）
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
    WHERE ur.user_id = ? AND rp.permission_code = ? AND ur.is_deleted = 0 AND rp.is_deleted = 0
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
  // 先检查是否为系统管理员账号（排除已删除的）
  const accountStmt = db.prepare('SELECT account FROM employees WHERE id = ? AND is_deleted = 0')
  accountStmt.bind([userId])
  accountStmt.step()
  const accountObj = accountStmt.getAsObject()
  accountStmt.free()

  // 系统管理员账号始终是超级管理员
  if (accountObj && accountObj.account === 'sysadmin') {
    return true
  }

  // 其他用户检查是否有 sysadmin 角色（排除已删除的）
  const stmt = db.prepare(`
    SELECT COUNT(*) as c
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND r.code = 'sysadmin' AND ur.is_deleted = 0 AND r.is_deleted = 0
  `)
  stmt.bind([userId])
  stmt.step()
  const count = Number(stmt.getAsObject().c)
  stmt.free()
  return count > 0
}

// ==================== 角色管理 ====================

/**
 * 获取所有角色（排除已删除的）
 * @returns {Array} 角色列表
 */
function getAllRoles() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM roles WHERE is_deleted = 0 ORDER BY is_system DESC, created_at ASC')
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
 * 根据ID获取角色（排除已删除的）
 * @param {number} id - 角色ID
 * @returns {Object|null} 角色信息
 */
function getRoleById(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM roles WHERE id = ? AND is_deleted = 0')
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
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {number} 新增角色的ID
 */
function addRole(data, operator) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO roles (code, name, description, created_by, is_deleted) VALUES (?, ?, ?, ?, 0)')
  stmt.run([data.code, data.name, data.description, operator?.id || null])
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
    module: '角色管理',
    action: '新增',
    targetType: '角色',
    targetId: result.id,
    targetName: data.name,
    detail: JSON.stringify({ code: data.code, description: data.description })
  })
  return result.id
}

/**
 * 更新角色
 * @param {number} id - 角色ID
 * @param {Object} data - 角色数据
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateRole(id, data, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE roles SET name = ?, description = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([data.name, data.description, operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '角色管理',
    action: '编辑',
    targetType: '角色',
    targetId: id,
    targetName: data.name,
    detail: JSON.stringify({ description: data.description })
  })
  return true
}

/**
 * 删除角色（逻辑删除）
 * @param {number} id - 角色ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteRole(id, operator) {
  const db = getDb()

  // 检查是否为系统角色
  const checkStmt = db.prepare('SELECT is_system, name FROM roles WHERE id = ?')
  checkStmt.bind([id])
  checkStmt.step()
  const roleInfo = checkStmt.getAsObject()
  checkStmt.free()

  if (roleInfo?.is_system) {
    throw new Error('系统角色不能删除')
  }

  // 逻辑删除角色权限关联
  const permStmt = db.prepare('UPDATE role_permissions SET is_deleted = 1 WHERE role_id = ?')
  permStmt.run([id])
  permStmt.free()

  // 逻辑删除用户角色关联
  const userStmt = db.prepare('UPDATE user_roles SET is_deleted = 1 WHERE role_id = ?')
  userStmt.run([id])
  userStmt.free()

  // 逻辑删除角色
  const stmt = db.prepare('UPDATE roles SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()

  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '角色管理',
    action: '删除',
    targetType: '角色',
    targetId: id,
    targetName: roleInfo?.name
  })
  return true
}

/**
 * 获取角色的权限列表（排除已删除的）
 * @param {number} roleId - 角色ID
 * @returns {Array} 权限代码列表
 */
function getRolePermissions(roleId) {
  const db = getDb()
  const stmt = db.prepare('SELECT permission_code FROM role_permissions WHERE role_id = ? AND is_deleted = 0')
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
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 设置成功返回true
 */
function setRolePermissions(roleId, permissionCodes, operator) {
  const db = getDb()

  // 获取角色名称
  const roleStmt = db.prepare('SELECT name FROM roles WHERE id = ?')
  roleStmt.bind([roleId])
  roleStmt.step()
  const roleName = roleStmt.getAsObject()?.name
  roleStmt.free()

  // 逻辑删除原有权限
  const delStmt = db.prepare('UPDATE role_permissions SET is_deleted = 1 WHERE role_id = ?')
  delStmt.run([roleId])
  delStmt.free()

  // 添加新权限
  const stmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code, created_by, is_deleted) VALUES (?, ?, ?, 0)')
  permissionCodes.forEach(code => stmt.run([roleId, code, operator?.id || null]))
  stmt.free()

  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '角色管理',
    action: '设置权限',
    targetType: '角色',
    targetId: roleId,
    targetName: roleName,
    detail: JSON.stringify({ permissions: permissionCodes })
  })
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
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 添加成功返回true
 */
function addUserRole(userId, roleId, operator) {
  const db = getDb()

  // 获取用户和角色信息
  const infoStmt = db.prepare(`
    SELECT e.name as userName, r.name as roleName
    FROM employees e, roles r
    WHERE e.id = ? AND r.id = ?
  `)
  infoStmt.bind([userId, roleId])
  infoStmt.step()
  const info = infoStmt.getAsObject()
  infoStmt.free()

  // 检查是否已有该角色（包括已删除的）
  const checkStmt = db.prepare('SELECT id, is_deleted FROM user_roles WHERE user_id = ? AND role_id = ?')
  checkStmt.bind([userId, roleId])
  checkStmt.step()
  const existing = checkStmt.getAsObject()
  checkStmt.free()

  if (existing) {
    if (existing.is_deleted === 0) {
      // 已存在且未删除，无需操作
      return true
    } else {
      // 已存在但已删除，恢复它
      const stmt = db.prepare('UPDATE user_roles SET is_deleted = 0, created_by = ? WHERE id = ?')
      stmt.run([operator?.id || null, existing.id])
      stmt.free()
      save()
    }
  } else {
    // 不存在，新增
    const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id, created_by, is_deleted) VALUES (?, ?, ?, 0)')
    stmt.run([userId, roleId, operator?.id || null])
    stmt.free()
    save()
  }

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '角色管理',
    action: '分配用户',
    targetType: '角色',
    targetId: roleId,
    targetName: info?.roleName,
    detail: JSON.stringify({ userId, userName: info?.userName })
  })
  return true
}

/**
 * 移除用户的单个角色（逻辑删除）
 * @param {number} userId - 用户ID
 * @param {number} roleId - 角色ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 移除成功返回true
 */
function removeUserRole(userId, roleId, operator) {
  const db = getDb()

  // 获取用户和角色信息
  const infoStmt = db.prepare(`
    SELECT e.name as userName, r.name as roleName
    FROM employees e, roles r
    WHERE e.id = ? AND r.id = ?
  `)
  infoStmt.bind([userId, roleId])
  infoStmt.step()
  const info = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE user_roles SET is_deleted = 1 WHERE user_id = ? AND role_id = ?')
  stmt.run([userId, roleId])
  stmt.free()

  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '角色管理',
    action: '移除用户',
    targetType: '角色',
    targetId: roleId,
    targetName: info?.roleName,
    detail: JSON.stringify({ userId, userName: info?.userName })
  })
  return true
}

/**
 * 获取所有权限列表（排除已删除的）
 * @returns {Array} 权限列表
 */
function getAllPermissions() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM permissions WHERE is_deleted = 0 ORDER BY type, code')
  const permissions = []
  while (stmt.step()) {
    permissions.push(stmt.getAsObject())
  }
  stmt.free()
  return permissions
}

/**
 * 获取角色的用户列表（排除已删除的）
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
    WHERE ur.role_id = ? AND ur.is_deleted = 0 AND e.is_deleted = 0
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
