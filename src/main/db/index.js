/**
 * 数据库模块入口
 * 整合所有子模块并统一导出
 */

const core = require('./core')
const department = require('./department')
const employee = require('./employee')
const dict = require('./dict')
const statistics = require('./statistics')
const permission = require('./permission')
const log = require('./log')
const init = require('./init')
const comments = require('./comments')

/**
 * 初始化数据库
 * 创建表结构、兼容旧版字段、初始化种子数据
 */
async function initDatabase() {
  // 初始化数据库连接
  await core.initConnection()

  // 执行完整初始化（表结构 + 种子数据）
  init.initDatabase()

  console.log('[DB] ready')
}

/**
 * 获取所有表名
 * @returns {Array} 表名列表
 */
function getTables() {
  const db = core.getDb()
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  const tables = []
  while (stmt.step()) {
    tables.push(stmt.getAsObject().name)
  }
  stmt.free()
  return tables
}

/**
 * 获取表结构
 * @param {string} tableName - 表名
 * @returns {Array} 列信息列表
 */
function getTableSchema(tableName) {
  const db = core.getDb()
  const stmt = db.prepare(`PRAGMA table_info(${tableName})`)
  const columns = []
  while (stmt.step()) {
    columns.push(stmt.getAsObject())
  }
  stmt.free()
  return columns
}

/**
 * 查询表数据
 * @param {string} tableName - 表名
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.where - WHERE 条件
 * @param {string} options.orderBy - 排序字段
 * @returns {Object} { list: Array, total: number }
 */
function getTableData(tableName, options = {}) {
  const db = core.getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 50
  const offset = (page - 1) * pageSize
  const where = options.where ? `WHERE ${options.where}` : ''
  const orderBy = options.orderBy ? `ORDER BY ${options.orderBy}` : ''

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM ${tableName} ${where}`)
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`SELECT * FROM ${tableName} ${where} ${orderBy} LIMIT ? OFFSET ?`)
  listStmt.bind([pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 更新表数据
 * @param {string} tableName - 表名
 * @param {number} id - 记录ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 更新成功返回true
 */
function updateTableData(tableName, id, data, operator) {
  const db = core.getDb()
  const columns = Object.keys(data).filter(k => k !== 'id')
  const setClause = columns.map(k => `${k} = ?`).join(', ')
  const values = columns.map(k => data[k])

  const stmt = db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`)
  stmt.run([...values, id])
  stmt.free()
  core.save()
  // 记录操作日志
  log.addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '数据库管理',
    action: '编辑',
    targetType: tableName,
    targetId: id,
    detail: JSON.stringify({ fields: columns })
  })
  return true
}

/**
 * 删除表数据
 * @param {string} tableName - 表名
 * @param {number} id - 记录ID
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {boolean} 删除成功返回true
 */
function deleteTableData(tableName, id, operator) {
  const db = core.getDb()
  const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`)
  stmt.run([id])
  stmt.free()
  core.save()
  // 记录操作日志
  log.addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '数据库管理',
    action: '删除',
    targetType: tableName,
    targetId: id,
    detail: JSON.stringify({ id })
  })
  return true
}

/**
 * 执行SQL语句
 * @param {string} sql - SQL语句
 * @param {Object} operator - 操作人信息 { id, name }
 * @returns {Array|Object} 查询结果或执行结果
 */
function executeSql(sql, operator) {
  const db = core.getDb()
  const sqlUpper = sql.trim().toUpperCase()

  if (sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('PRAGMA')) {
    const stmt = db.prepare(sql)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  } else {
    db.run(sql)
    core.save()
    // 记录操作日志
    log.addLog({
      userId: operator?.id,
      userName: operator?.name,
      module: '数据库管理',
      action: '执行SQL',
      targetType: 'SQL',
      detail: JSON.stringify({ sql: sql.substring(0, 500) })
    })
    return { affected: db.getRowsModified() }
  }
}

module.exports = {
  // 基础功能
  init: initDatabase,
  close: core.close,
  // 部门模块
  addDepartment: department.addDepartment,
  getAllDepartments: department.getAllDepartments,
  updateDepartment: department.updateDepartment,
  deleteDepartment: department.deleteDepartment,
  getChildDepartments: department.getChildDepartments,
  // 员工模块
  login: employee.login,
  addEmployee: employee.addEmployee,
  getAllEmployees: employee.getAllEmployees,
  getEmployeeById: employee.getEmployeeById,
  updateEmployee: employee.updateEmployee,
  updatePassword: employee.updatePassword,
  deleteEmployee: employee.deleteEmployee,
  updateAvatar: employee.updateAvatar,
  getAvatar: employee.getAvatar,
  // 字典模块
  getAllDictTypes: dict.getAllDictTypes,
  addDictType: dict.addDictType,
  updateDictType: dict.updateDictType,
  deleteDictType: dict.deleteDictType,
  getDictItemsByType: dict.getDictItemsByType,
  addDictItem: dict.addDictItem,
  updateDictItem: dict.updateDictItem,
  deleteDictItem: dict.deleteDictItem,
  // 统计模块
  getStatistics: statistics.getStatistics,
  getLogStatistics: statistics.getLogStatistics,
  // 权限模块
  getAllRoles: permission.getAllRoles,
  getRoleById: permission.getRoleById,
  addRole: permission.addRole,
  updateRole: permission.updateRole,
  deleteRole: permission.deleteRole,
  getRolePermissions: permission.getRolePermissions,
  setRolePermissions: permission.setRolePermissions,
  setUserRoles: permission.setUserRoles,
  addUserRole: permission.addUserRole,
  removeUserRole: permission.removeUserRole,
  getRoleUsers: permission.getRoleUsers,
  getAllPermissions: permission.getAllPermissions,
  getUserPermissions: permission.getUserPermissions,
  hasPermission: permission.hasPermission,
  isSuperAdmin: permission.isSuperAdmin,
  // 操作日志模块
  addLog: log.addLog,
  getLogs: log.getLogs,
  getLogModules: log.getModules,
  getLogActions: log.getActions,
  clearLogs: log.clearLogs,
  // 数据库管理
  getTables,
  getTableSchema,
  getTableData,
  updateTableData,
  deleteTableData,
  executeSql,
  // 表和字段注释
  tableComments: comments.tableComments,
  fieldComments: comments.fieldComments
}