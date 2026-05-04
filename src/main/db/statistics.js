/**
 * 统计模块
 * 提供员工统计、部门统计、薪资统计、操作日志统计等功能
 */

const { getDb } = require('./core')

/**
 * 获取综合统计数据
 * @returns {Object} 包含员工总数、部门统计、性别统计、薪资统计等
 */
function getStatistics() {
  const db = getDb()

  // 员工总数
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM employees')
  totalStmt.step()
  const total = totalStmt.getAsObject().count
  totalStmt.free()

  // 部门人数统计
  const deptStmt = db.prepare(`
    SELECT d.name, COUNT(e.id) as count
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department_id
    GROUP BY d.id
    ORDER BY count DESC
  `)
  const deptStats = []
  while (deptStmt.step()) { deptStats.push(deptStmt.getAsObject()) }
  deptStmt.free()

  // 性别统计
  const genderStmt = db.prepare(`
    SELECT gender, COUNT(*) as count FROM employees GROUP BY gender
  `)
  const genderStats = []
  while (genderStmt.step()) { genderStats.push(genderStmt.getAsObject()) }
  genderStmt.free()

  // 平均薪资
  const salaryStmt = db.prepare('SELECT AVG(salary) as avg FROM employees')
  salaryStmt.step()
  const avgSalary = salaryStmt.getAsObject().avg || 0
  salaryStmt.free()

  // 每个部门的薪资统计（平均、最高、最低）
  const deptSalaryStmt = db.prepare(`
    SELECT d.name,
           AVG(e.salary) as avgSalary,
           MAX(e.salary) as maxSalary,
           MIN(e.salary) as minSalary
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department_id
    GROUP BY d.id
    HAVING COUNT(e.id) > 0
    ORDER BY d.id
  `)
  const deptSalaryStats = []
  while (deptSalaryStmt.step()) {
    const row = deptSalaryStmt.getAsObject()
    deptSalaryStats.push({
      name: row.name,
      avgSalary: Math.round(row.avgSalary || 0),
      maxSalary: row.maxSalary || 0,
      minSalary: row.minSalary || 0
    })
  }
  deptSalaryStmt.free()

  return { total, deptStats, genderStats, avgSalary, deptSalaryStats }
}

/**
 * 获取操作日志统计数据
 * @returns {Object} 操作日志统计信息
 */
function getLogStatistics() {
  const db = getDb()

  // 今日操作总数
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
  const todayStmt = db.prepare('SELECT COUNT(*) as count FROM operation_logs WHERE created_at >= ?')
  todayStmt.bind([todayStart])
  todayStmt.step()
  const todayCount = todayStmt.getAsObject().count
  todayStmt.free()

  // 本周操作总数
  const weekStart = Math.floor((new Date().setDate(new Date().getDate() - new Date().getDay())) / 1000)
  const weekStmt = db.prepare('SELECT COUNT(*) as count FROM operation_logs WHERE created_at >= ?')
  weekStmt.bind([weekStart])
  weekStmt.step()
  const weekCount = weekStmt.getAsObject().count
  weekStmt.free()

  // 本月操作总数
  const monthStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
  const monthStmt = db.prepare('SELECT COUNT(*) as count FROM operation_logs WHERE created_at >= ?')
  monthStmt.bind([monthStart])
  monthStmt.step()
  const monthCount = monthStmt.getAsObject().count
  monthStmt.free()

  // 操作总数
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM operation_logs')
  totalStmt.step()
  const totalCount = totalStmt.getAsObject().count
  totalStmt.free()

  // 按模块统计
  const moduleStmt = db.prepare(`
    SELECT module, COUNT(*) as count
    FROM operation_logs
    GROUP BY module
    ORDER BY count DESC
    LIMIT 10
  `)
  const moduleStats = []
  while (moduleStmt.step()) { moduleStats.push(moduleStmt.getAsObject()) }
  moduleStmt.free()

  // 按操作类型统计
  const actionStmt = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM operation_logs
    GROUP BY action
    ORDER BY count DESC
  `)
  const actionStats = []
  while (actionStmt.step()) { actionStats.push(actionStmt.getAsObject()) }
  actionStmt.free()

  // 按用户统计（前10名）
  const userStmt = db.prepare(`
    SELECT user_name, COUNT(*) as count
    FROM operation_logs
    WHERE user_name IS NOT NULL
    GROUP BY user_id
    ORDER BY count DESC
    LIMIT 10
  `)
  const userStats = []
  while (userStmt.step()) { userStats.push(userStmt.getAsObject()) }
  userStmt.free()

  // 最近7天每日操作趋势
  const dailyStmt = db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date, COUNT(*) as count
    FROM operation_logs
    WHERE created_at >= ?
    GROUP BY date
    ORDER BY date
  `)
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
  dailyStmt.bind([sevenDaysAgo])
  const dailyStats = []
  while (dailyStmt.step()) { dailyStats.push(dailyStmt.getAsObject()) }
  dailyStmt.free()

  return {
    todayCount,
    weekCount,
    monthCount,
    totalCount,
    moduleStats,
    actionStats,
    userStats,
    dailyStats
  }
}

module.exports = {
  getStatistics,
  getLogStatistics
}