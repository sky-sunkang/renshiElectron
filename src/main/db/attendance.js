/**
 * 考勤管理模块
 * 提供考勤记录的增删改查功能
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

/**
 * 获取考勤记录列表
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {number} options.employee_id - 员工ID筛选
 * @param {string} options.type - 类型筛选
 * @param {number} options.start_time - 开始时间
 * @param {number} options.end_time - 结束时间
 * @returns {Object} { list, total }
 */
function getAttendance(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['a.is_deleted = 0']
  const params = []

  if (options.employee_id) {
    conditions.push('a.employee_id = ?')
    params.push(options.employee_id)
  }
  if (options.type) {
    conditions.push('a.type = ?')
    params.push(options.type)
  }
  if (options.start_time) {
    conditions.push('a.check_time >= ?')
    params.push(options.start_time)
  }
  if (options.end_time) {
    conditions.push('a.check_time <= ?')
    params.push(options.end_time)
  }

  const whereClause = conditions.join(' AND ')

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM attendance a WHERE ${whereClause}`
  const countStmt = db.prepare(countSql)
  if (params.length > 0) {
    countStmt.bind(params)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询列表，关联员工和部门信息
  const listSql = `
    SELECT a.*, e.name as employee_name, e.account as employee_account, d.name as department_name
    FROM attendance a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ${whereClause}
    ORDER BY a.check_time DESC
    LIMIT ? OFFSET ?
  `
  const listStmt = db.prepare(listSql)
  listStmt.bind([...params, pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 新增考勤记录
 * @param {Object} data - 考勤数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addAttendance(data, operator) {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    INSERT INTO attendance (
      employee_id, type, check_time, remark, created_by, is_deleted
    ) VALUES (?, ?, ?, ?, ?, 0)
  `)
  stmt.bind([
    data.employee_id,
    data.type || 'check_in',
    data.check_time || now,
    data.remark || null,
    operator?.id || null
  ])
  stmt.step()
  stmt.free()

  // 获取新增ID
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()

  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '考勤管理',
    action: '打卡',
    targetType: '考勤',
    targetId: result.id,
    targetName: data.type === 'check_in' ? '签到' : '签退'
  })

  return result.id
}

/**
 * 更新考勤记录
 * @param {number} id - 记录ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateAttendance(id, data, operator) {
  const db = getDb()

  const stmt = db.prepare(`
    UPDATE attendance SET
      employee_id = ?, type = ?, check_time = ?, remark = ?,
      updated_by = ?, updated_at = ?
    WHERE id = ?
  `)
  stmt.bind([
    data.employee_id,
    data.type || 'check_in',
    data.check_time || Math.floor(Date.now() / 1000),
    data.remark || null,
    operator?.id || null,
    Math.floor(Date.now() / 1000),
    id
  ])
  stmt.step()
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '考勤管理',
    action: '编辑',
    targetType: '考勤',
    targetId: id,
    targetName: '考勤记录'
  })

  return true
}

/**
 * 删除考勤记录（逻辑删除）
 * @param {number} id - 记录ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteAttendance(id, operator) {
  const db = getDb()

  const stmt = db.prepare('UPDATE attendance SET is_deleted = 1, updated_by = ?, updated_at = ? WHERE id = ?')
  stmt.bind([operator?.id || null, Math.floor(Date.now() / 1000), id])
  stmt.step()
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '考勤管理',
    action: '删除',
    targetType: '考勤',
    targetId: id,
    targetName: '考勤记录'
  })

  return true
}

/**
 * 获取今日考勤状态
 * @param {number} employee_id - 员工ID
 * @returns {Object} { check_in, check_out }
 */
function getTodayAttendance(employee_id) {
  const db = getDb()
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startTime = Math.floor(startOfDay.getTime() / 1000)
  const endTime = startTime + 86400

  const sql = `
    SELECT type, check_time FROM attendance
    WHERE employee_id = ? AND is_deleted = 0
    AND check_time >= ? AND check_time < ?
    ORDER BY check_time ASC
  `
  const stmt = db.prepare(sql)
  stmt.bind([employee_id, startTime, endTime])
  const records = []
  while (stmt.step()) {
    records.push(stmt.getAsObject())
  }
  stmt.free()

  const checkIn = records.find(r => r.type === 'check_in')
  const checkOut = records.filter(r => r.type === 'check_out').pop()

  return {
    check_in: checkIn ? checkIn.check_time : null,
    check_out: checkOut ? checkOut.check_time : null
  }
}

/**
 * 获取考勤统计
 * @param {number} employee_id - 员工ID
 * @param {number} month - 月份（格式：YYYYMM）
 * @returns {Object} 统计数据
 */
function getAttendanceStats(employee_id, month) {
  const db = getDb()

  // 计算月份的开始和结束时间
  const year = Math.floor(month / 100)
  const m = month % 100
  const startTime = Math.floor(new Date(year, m - 1, 1).getTime() / 1000)
  const endTime = Math.floor(new Date(year, m, 1).getTime() / 1000)

  // 获取该员工该月份的所有考勤记录
  const sql = `
    SELECT id, type, check_time FROM attendance
    WHERE employee_id = ? AND is_deleted = 0
    AND check_time >= ? AND check_time < ?
    ORDER BY check_time ASC
  `
  const stmt = db.prepare(sql)
  stmt.bind([employee_id, startTime, endTime])
  const records = []
  while (stmt.step()) {
    records.push(stmt.getAsObject())
  }
  stmt.free()

  // 按日期分组统计 - 使用普通对象
  const checkInDaysObj = {}
  const checkOutDaysObj = {}

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const date = new Date(record.check_time * 1000)
    const dateKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')

    if (record.type === 'check_in') {
      checkInDaysObj[dateKey] = true
    } else if (record.type === 'check_out') {
      checkOutDaysObj[dateKey] = true
    }
  }

  // 计算天数
  const checkInDays = Object.keys(checkInDaysObj).length
  const checkOutDays = Object.keys(checkOutDaysObj).length

  return {
    check_in: checkInDays,
    check_out: checkOutDays
  }
}

module.exports = {
  getAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getTodayAttendance,
  getAttendanceStats
}
