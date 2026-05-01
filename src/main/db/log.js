/**
 * 操作日志模块
 * 记录系统所有操作日志
 */

const { getDb, save } = require('./core')

/**
 * 添加操作日志
 * @param {Object} params - 日志参数
 * @param {number} params.userId - 操作用户ID
 * @param {string} params.userName - 操作用户名称
 * @param {string} params.module - 操作模块（如：员工管理、部门管理）
 * @param {string} params.action - 操作动作（如：新增、编辑、删除）
 * @param {string} params.targetType - 操作对象类型（如：员工、部门）
 * @param {number} params.targetId - 操作对象ID
 * @param {string} params.targetName - 操作对象名称
 * @param {string} params.detail - 操作详情（JSON格式）
 * @returns {number} 新增日志的ID
 */
function addLog(params) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_id, user_name, module, action, target_type, target_id, target_name, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    params.userId ?? null,
    params.userName ?? null,
    params.module,
    params.action,
    params.targetType ?? null,
    params.targetId ?? null,
    params.targetName ?? null,
    params.detail ?? null
  ])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  return result.id
}

/**
 * 获取操作日志列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.module - 模块筛选
 * @param {string} params.action - 操作类型筛选
 * @param {string} params.userName - 用户名筛选
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @returns {Object} { list: Array, total: number }
 */
function getLogs(params = {}) {
  const db = getDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = []
  const bindParams = []

  if (params.module) {
    conditions.push('module = ?')
    bindParams.push(params.module)
  }
  if (params.action) {
    conditions.push('action = ?')
    bindParams.push(params.action)
  }
  if (params.userName) {
    conditions.push('user_name LIKE ?')
    bindParams.push(`%${params.userName}%`)
  }
  if (params.startDate) {
    conditions.push('created_at >= ?')
    bindParams.push(new Date(params.startDate).getTime() / 1000)
  }
  if (params.endDate) {
    conditions.push('created_at <= ?')
    // 结束日期加一天，包含当天
    const endDate = new Date(params.endDate)
    endDate.setDate(endDate.getDate() + 1)
    bindParams.push(endDate.getTime() / 1000)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM operation_logs ${whereClause}`)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询列表
  const listStmt = db.prepare(`
    SELECT * FROM operation_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const listBindParams = [...bindParams, pageSize, offset]
  listStmt.bind(listBindParams)
  const list = []
  while (listStmt.step()) {
    const row = listStmt.getAsObject()
    // 格式化时间
    row.created_at_formatted = formatDateTime(row.created_at)
    list.push(row)
  }
  listStmt.free()

  return { list, total }
}

/**
 * 格式化时间戳为日期时间字符串
 * @param {number} timestamp - Unix时间戳
 * @returns {string} 格式化的日期时间
 */
function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 获取所有操作模块列表（用于筛选下拉）
 * @returns {Array} 模块列表
 */
function getModules() {
  const db = getDb()
  const stmt = db.prepare('SELECT DISTINCT module FROM operation_logs ORDER BY module')
  const modules = []
  while (stmt.step()) {
    modules.push(stmt.getAsObject().module)
  }
  stmt.free()
  return modules
}

/**
 * 获取所有操作类型列表（用于筛选下拉）
 * @returns {Array} 操作类型列表
 */
function getActions() {
  const db = getDb()
  const stmt = db.prepare('SELECT DISTINCT action FROM operation_logs ORDER BY action')
  const actions = []
  while (stmt.step()) {
    actions.push(stmt.getAsObject().action)
  }
  stmt.free()
  return actions
}

/**
 * 清空操作日志（保留最近N天）
 * @param {number} days - 保留天数
 * @returns {number} 删除的记录数
 */
function clearLogs(days = 90) {
  const db = getDb()
  const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60)
  const stmt = db.prepare('DELETE FROM operation_logs WHERE created_at < ?')
  stmt.run([cutoffTime])
  stmt.free()
  save()
  return true
}

module.exports = {
  addLog,
  getLogs,
  getModules,
  getActions,
  clearLogs
}
