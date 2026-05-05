/**
 * 员工模块
 * 提供员工的增删改查及登录认证功能
 */

const { getDb, save } = require('./core')
const { getUserPermissions, getUserRoles, isSuperAdmin } = require('./permission')
const { addLog } = require('./log')

/**
 * 员工登录验证
 * @param {string} account - 账号
 * @param {string} password - 密码
 * @returns {Object|null} 登录成功返回用户信息（包含权限），失败返回null
 */
function login(account, password) {
  const db = getDb()
  console.log('[DB] login attempt:', account)
  const stmt = db.prepare('SELECT id, name, account, position FROM employees WHERE account = ? AND password = ? AND is_deleted = 0')
  stmt.bind([account, password])
  let user = null
  if (stmt.step()) {
    user = stmt.getAsObject()
    // 获取用户权限和角色信息
    user.permissions = getUserPermissions(user.id)
    user.roles = getUserRoles(user.id)
    user.isSuperAdmin = isSuperAdmin(user.id)
    // 记录登录日志
    addLog({
      userId: user.id,
      userName: user.name,
      module: '系统',
      action: '登录',
      targetType: '用户',
      targetId: user.id,
      targetName: user.name
    })
  }
  stmt.free()
  console.log('[DB] login result:', user)
  return user
}

/**
 * 检查账号是否已存在
 * @param {string} account - 账号
 * @param {number} excludeId - 排除的员工ID（编辑时排除自身）
 * @returns {boolean} 账号已存在返回true
 */
function isAccountExists(account, excludeId = null) {
  const db = getDb()
  let stmt
  if (excludeId) {
    stmt = db.prepare('SELECT id FROM employees WHERE account = ? AND id != ? AND is_deleted = 0')
    stmt.bind([account, excludeId])
  } else {
    stmt = db.prepare('SELECT id FROM employees WHERE account = ? AND is_deleted = 0')
    stmt.bind([account])
  }
  const exists = stmt.step()
  stmt.free()
  return exists
}

/**
 * 新增员工
 * @param {Object} data - 员工数据
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {number} 新增员工的ID
 * @throws {Error} 账号已存在时抛出错误
 */
function addEmployee(data, operator) {
  // 检查账号是否已存在
  if (isAccountExists(data.account)) {
    throw new Error('账号已存在')
  }

  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password, created_by, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
  )
  stmt.run([data.name, data.account, data.gender, data.age, data.phone, data.email, data.department_id, data.position, data.salary, data.password || '123456', operator?.id || null])
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
    module: '员工管理',
    action: '新增',
    targetType: '员工',
    targetId: result.id,
    targetName: data.name,
    detail: JSON.stringify({ account: data.account, position: data.position })
  })
  return result.id
}

/**
 * 获取所有员工列表（包含部门名称和头像，排除已删除的）
 * @returns {Array} 员工列表
 */
function getAllEmployees() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.account, e.gender, e.age, e.phone, e.email, e.department_id, e.position, e.salary, e.created_at, e.avatar, d.name as department_name, d.path_names as department_path
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.is_deleted = 0
    ORDER BY e.created_at DESC
  `)
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 根据ID获取员工详情（排除已删除的）
 * @param {number} id - 员工ID
 * @returns {Object|null} 员工信息
 */
function getEmployeeById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.account, e.gender, e.age, e.phone, e.email, e.department_id, e.position, e.salary, e.created_at, d.name as department_name, d.path_names as department_path
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ? AND e.is_deleted = 0
  `)
  stmt.bind([id])
  let item = null
  if (stmt.step()) { item = stmt.getAsObject() }
  stmt.free()
  return item
}

/**
 * 更新员工信息
 * @param {number} id - 员工ID
 * @param {Object} data - 员工数据
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 * @throws {Error} 账号已存在时抛出错误
 */
function updateEmployee(id, data, operator) {
  // 检查账号是否已被其他员工使用
  if (isAccountExists(data.account, id)) {
    throw new Error('账号已存在')
  }

  const db = getDb()
  const stmt = db.prepare(
    'UPDATE employees SET name = ?, account = ?, gender = ?, age = ?, phone = ?, email = ?, department_id = ?, position = ?, salary = ?, password = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?'
  )
  stmt.run([data.name, data.account, data.gender, data.age, data.phone, data.email, data.department_id, data.position, data.salary, data.password, operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '员工管理',
    action: '编辑',
    targetType: '员工',
    targetId: id,
    targetName: data.name,
    detail: JSON.stringify({ account: data.account, position: data.position })
  })
  return true
}

/**
 * 更新员工密码
 * @param {number} id - 员工ID
 * @param {string} password - 新密码
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updatePassword(id, password, operator) {
  const db = getDb()
  // 获取员工名称
  const nameStmt = db.prepare('SELECT name FROM employees WHERE id = ?')
  nameStmt.bind([id])
  nameStmt.step()
  const empName = nameStmt.getAsObject()?.name
  nameStmt.free()

  const stmt = db.prepare('UPDATE employees SET password = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([password, operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '员工管理',
    action: '修改密码',
    targetType: '员工',
    targetId: id,
    targetName: empName
  })
  return true
}

/**
 * 删除员工（逻辑删除）
 * @param {number} id - 员工ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteEmployee(id, operator) {
  const db = getDb()
  // 获取员工信息
  const infoStmt = db.prepare('SELECT name, account FROM employees WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const empInfo = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE employees SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()
  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '员工管理',
    action: '删除',
    targetType: '员工',
    targetId: id,
    targetName: empInfo?.name,
    detail: JSON.stringify({ account: empInfo?.account })
  })
  return true
}

/**
 * 生成默认头像（Base64格式的SVG）
 * @param {string} name - 员工姓名
 * @returns {string} Base64编码的SVG头像
 */
function generateDefaultAvatar(name) {
  // 提取姓氏（第一个字符）
  const surname = name ? name.charAt(0) : '员'
  // 生成随机颜色（根据名字哈希）
  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  const colorIndex = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0
  const bgColor = colors[colorIndex]

  // 创建SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}" rx="8"/>
      <text x="50" y="55" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${surname}</text>
    </svg>
  `
  // 转换为Base64
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * 更新员工头像
 * @param {number} id - 员工ID
 * @param {string} avatarBase64 - 头像Base64数据
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateAvatar(id, avatarBase64, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE employees SET avatar = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([avatarBase64, operator?.id || null, id])
  stmt.free()
  save()
  return true
}

/**
 * 获取员工头像（排除已删除的）
 * @param {number} id - 员工ID
 * @returns {string|null} 头像Base64数据，无头像返回null
 */
function getAvatar(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT avatar, name FROM employees WHERE id = ? AND is_deleted = 0')
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    const row = stmt.getAsObject()
    // 如果有头像数据则返回，否则生成默认头像
    result = row.avatar || generateDefaultAvatar(row.name)
  }
  stmt.free()
  return result
}

module.exports = {
  login,
  addEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  updatePassword,
  deleteEmployee,
  updateAvatar,
  getAvatar,
  isAccountExists,
  generateDefaultAvatar
}