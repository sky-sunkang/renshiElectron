/**
 * 权限模块
 * 提供RBAC权限管理：角色、权限、用户角色关联
 */

const { getDb, save } = require('./core')

/**
 * 初始化权限相关表结构
 */
function initPermissionTables() {
  const db = getDb()

  // 创建角色表
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 创建权限表
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 创建角色权限关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_code TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(role_id, permission_code)
    )
  `)

  // 创建用户角色关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 添加员工表角色字段（兼容旧版）
  try {
    db.run('ALTER TABLE employees ADD COLUMN role_code TEXT')
    console.log('[DB] employees.role_code added')
  } catch (e) {
    // role_code 列已存在
  }

  // 初始化系统角色
  initSystemRoles()

  // 初始化系统权限
  initSystemPermissions()

  // 初始化超级管理员
  initSuperAdmin()

  console.log('[DB] permission tables initialized')
}

/**
 * 初始化系统角色
 */
function initSystemRoles() {
  const db = getDb()

  const roles = [
    { code: 'sysadmin', name: '超级管理员', description: '系统超级管理员，拥有所有权限', is_system: 1 },
    { code: 'admin', name: '管理员', description: '系统管理员，拥有大部分管理权限', is_system: 1 },
    { code: 'hr', name: '人事专员', description: '人事部门专员，管理员工信息', is_system: 1 },
    { code: 'user', name: '普通用户', description: '普通员工，只能查看', is_system: 1 }
  ]

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO roles (code, name, description, is_system) VALUES (?, ?, ?, ?)
  `)
  roles.forEach(role => stmt.run([role.code, role.name, role.description, role.is_system]))
  stmt.free()
}

/**
 * 初始化系统权限
 */
function initSystemPermissions() {
  const db = getDb()

  // 权限类型：menu-菜单权限，button-按钮权限，api-接口权限
  const permissions = [
    // 菜单权限
    { code: 'menu:employee', name: '员工管理菜单', type: 'menu', description: '访问员工管理页面' },
    { code: 'menu:department', name: '部门管理菜单', type: 'menu', description: '访问部门管理页面' },
    { code: 'menu:dictionary', name: '字典管理菜单', type: 'menu', description: '访问字典管理页面' },
    { code: 'menu:statistics', name: '数据统计菜单', type: 'menu', description: '访问数据统计页面' },
    { code: 'menu:role', name: '角色管理菜单', type: 'menu', description: '访问角色管理页面' },

    // 员工管理按钮权限
    { code: 'emp:add', name: '新增员工', type: 'button', description: '新增员工按钮' },
    { code: 'emp:edit', name: '编辑员工', type: 'button', description: '编辑员工按钮' },
    { code: 'emp:delete', name: '删除员工', type: 'button', description: '删除员工按钮' },
    { code: 'emp:batchDelete', name: '批量删除员工', type: 'button', description: '批量删除员工按钮' },
    { code: 'emp:export', name: '导出员工', type: 'button', description: '导出员工数据按钮' },

    // 部门管理按钮权限
    { code: 'dept:add', name: '新增部门', type: 'button', description: '新增部门按钮' },
    { code: 'dept:edit', name: '编辑部门', type: 'button', description: '编辑部门按钮' },
    { code: 'dept:delete', name: '删除部门', type: 'button', description: '删除部门按钮' },

    // 字典管理按钮权限
    { code: 'dict:add', name: '新增字典', type: 'button', description: '新增字典类型按钮' },
    { code: 'dict:edit', name: '编辑字典', type: 'button', description: '编辑字典类型按钮' },
    { code: 'dict:delete', name: '删除字典', type: 'button', description: '删除字典类型按钮' },
    { code: 'dict:item:add', name: '新增字典项', type: 'button', description: '新增字典项按钮' },
    { code: 'dict:item:edit', name: '编辑字典项', type: 'button', description: '编辑字典项按钮' },
    { code: 'dict:item:delete', name: '删除字典项', type: 'button', description: '删除字典项按钮' },

    // 角色管理按钮权限
    { code: 'role:add', name: '新增角色', type: 'button', description: '新增角色按钮' },
    { code: 'role:edit', name: '编辑角色', type: 'button', description: '编辑角色按钮' },
    { code: 'role:delete', name: '删除角色', type: 'button', description: '删除角色按钮' },
    { code: 'role:assign', name: '分配权限', type: 'button', description: '分配角色权限按钮' },
    { code: 'role:assignUser', name: '分配用户', type: 'button', description: '为用户分配角色按钮' }
  ]

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO permissions (code, name, type, description) VALUES (?, ?, ?, ?)
  `)
  permissions.forEach(p => stmt.run([p.code, p.name, p.type, p.description]))
  stmt.free()

  // 分配权限给角色
  assignPermissionsToRoles()
}

/**
 * 分配权限给角色
 * @param {boolean} force - 是否强制重新分配，默认false
 */
function assignPermissionsToRoles(force = false) {
  const db = getDb()

  // 获取角色ID
  const getRoleId = (code) => {
    const stmt = db.prepare('SELECT id FROM roles WHERE code = ?')
    stmt.bind([code])
    let id = null
    if (stmt.step()) id = stmt.getAsObject().id
    stmt.free()
    return id
  }

  const sysadminId = getRoleId('sysadmin')
  const adminId = getRoleId('admin')
  const hrId = getRoleId('hr')
  const userId = getRoleId('user')

  if (!sysadminId || !adminId || !hrId || !userId) return

  // 如果不是强制模式，检查是否已有权限分配
  if (!force) {
    const checkStmt = db.prepare('SELECT COUNT(*) as c FROM role_permissions')
    checkStmt.step()
    const count = Number(checkStmt.getAsObject().c)
    checkStmt.free()
    if (count > 0) {
      console.log('[DB] role_permissions already initialized, skip')
      return
    }
  }

  // 清除现有权限分配
  db.run('DELETE FROM role_permissions')

  // 超级管理员拥有所有权限
  const allPermissions = db.prepare('SELECT code FROM permissions')
  const sysadminStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  while (allPermissions.step()) {
    const code = allPermissions.getAsObject().code
    sysadminStmt.run([sysadminId, code])
  }
  allPermissions.free()
  sysadminStmt.free()

  // 管理员权限（除角色管理外）
  const adminPermissions = [
    'menu:employee', 'menu:department', 'menu:dictionary', 'menu:statistics',
    'emp:add', 'emp:edit', 'emp:delete', 'emp:batchDelete', 'emp:export',
    'dept:add', 'dept:edit', 'dept:delete',
    'dict:add', 'dict:edit', 'dict:delete', 'dict:item:add', 'dict:item:edit', 'dict:item:delete'
  ]
  const adminStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  adminPermissions.forEach(code => adminStmt.run([adminId, code]))
  adminStmt.free()

  // 人事专员权限
  const hrPermissions = [
    'menu:employee', 'menu:department', 'menu:statistics',
    'emp:add', 'emp:edit', 'emp:export',
    'dept:add', 'dept:edit'
  ]
  const hrStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  hrPermissions.forEach(code => hrStmt.run([hrId, code]))
  hrStmt.free()

  // 普通用户权限（仅查看）
  const userPermissions = [
    'menu:employee', 'menu:department', 'menu:statistics'
  ]
  const userStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  userPermissions.forEach(code => userStmt.run([userId, code]))
  userStmt.free()

  save()
}

/**
 * 初始化超级管理员
 */
function initSuperAdmin() {
  const db = getDb()

  // 获取超级管理员角色ID
  const roleStmt = db.prepare("SELECT id FROM roles WHERE code = 'sysadmin'")
  roleStmt.step()
  const roleObj = roleStmt.getAsObject()
  const sysadminRoleId = roleObj?.id
  roleStmt.free()

  // 获取超级管理员用户ID
  const userStmt = db.prepare("SELECT id FROM employees WHERE account = 'sysadmin'")
  userStmt.step()
  const userObj = userStmt.getAsObject()
  const userId = userObj?.id
  userStmt.free()

  if (userId && sysadminRoleId) {
    // 检查是否已分配角色
    const checkStmt = db.prepare('SELECT COUNT(*) as c FROM user_roles WHERE user_id = ? AND role_id = ?')
    checkStmt.bind([userId, sysadminRoleId])
    checkStmt.step()
    const count = Number(checkStmt.getAsObject().c)
    checkStmt.free()

    if (count === 0) {
      // 分配超级管理员角色
      const assignStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)')
      assignStmt.run([userId, sysadminRoleId])
      assignStmt.free()

      // 更新用户角色代码
      const updateStmt = db.prepare("UPDATE employees SET role_code = 'sysadmin' WHERE id = ?")
      updateStmt.run([userId])
      updateStmt.free()

      save()
      console.log('[DB] sysadmin role assigned')
    }
  }
}

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
 * @param {number} userId - 用户ID
 * @returns {boolean} 是否为超级管理员
 */
function isSuperAdmin(userId) {
  const db = getDb()
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
  initPermissionTables,
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
  getAllPermissions,
  getRoleUsers
}
