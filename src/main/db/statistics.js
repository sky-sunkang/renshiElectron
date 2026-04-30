/**
 * 统计模块
 * 提供员工统计、部门统计、薪资统计等功能
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

module.exports = {
  getStatistics
}