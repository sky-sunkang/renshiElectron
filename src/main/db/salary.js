/**
 * 薪资管理模块
 * 处理工资条生成、调薪记录、薪资统计等
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

// ==================== 工资条管理 ====================

/**
 * 获取工资条列表
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getSalarySheets(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['s.is_deleted = 0']
  const bindParams = []

  if (options.employee_id) {
    conditions.push('s.employee_id = ?')
    bindParams.push(options.employee_id)
  }

  if (options.month) {
    conditions.push('s.month = ?')
    bindParams.push(options.month)
  }

  if (options.status) {
    conditions.push('s.status = ?')
    bindParams.push(options.status)
  }

  if (options.keyword) {
    conditions.push('(e.name LIKE ? OR e.account LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM salary_sheets s
    LEFT JOIN employees e ON s.employee_id = e.id
    ${whereClause}
  `)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`
    SELECT s.*, e.name as employee_name, e.account as employee_account, e.position,
           d.name as department_name
    FROM salary_sheets s
    LEFT JOIN employees e ON s.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${whereClause}
    ORDER BY s.month DESC, s.created_at DESC
    LIMIT ? OFFSET ?
  `)
  listStmt.bind([...bindParams, pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 根据ID获取工资条
 * @param {number} id - 工资条ID
 * @returns {Object|null} 工资条信息
 */
function getSalarySheetById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT s.*, e.name as employee_name, e.account as employee_account, e.position,
           d.name as department_name
    FROM salary_sheets s
    LEFT JOIN employees e ON s.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE s.id = ? AND s.is_deleted = 0
  `)
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增工资条
 * @param {Object} data - 工资条数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addSalarySheet(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO salary_sheets (
      employee_id, month, base_salary, overtime_pay, bonus, allowance,
      deduction, tax, insurance, actual_salary, status, remark,
      created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.employee_id,
    data.month,
    data.base_salary || 0,
    data.overtime_pay || 0,
    data.bonus || 0,
    data.allowance || 0,
    data.deduction || 0,
    data.tax || 0,
    data.insurance || 0,
    data.actual_salary || 0,
    data.status || 'draft',
    data.remark || null,
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '新增工资条',
    targetType: 'salary_sheet',
    targetId: data.employee_id,
    detail: JSON.stringify({ month: data.month, actual_salary: data.actual_salary })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新工资条
 * @param {number} id - 工资条ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateSalarySheet(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  const allowedFields = [
    'base_salary', 'overtime_pay', 'bonus', 'allowance',
    'deduction', 'tax', 'insurance', 'actual_salary', 'status', 'remark'
  ]
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(data[field])
    }
  })

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE salary_sheets SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '编辑工资条',
    targetType: 'salary_sheet',
    targetId: id
  })

  return true
}

/**
 * 删除工资条
 * @param {number} id - 工资条ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteSalarySheet(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE salary_sheets SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '删除工资条',
    targetType: 'salary_sheet',
    targetId: id
  })

  return true
}

/**
 * 批量生成工资条
 * @param {string} month - 月份，如 2024-01
 * @param {Array} employeeIds - 员工ID数组，为空则全部员工
 * @param {Object} operator - 操作人信息
 * @returns {Object} { success: number, failed: number }
 */
function batchGenerateSalarySheets(month, employeeIds, operator) {
  const db = getDb()

  // 获取员工列表
  let employees = []
  if (employeeIds && employeeIds.length > 0) {
    const placeholders = employeeIds.map(() => '?').join(',')
    const empStmt = db.prepare(`SELECT id, salary FROM employees WHERE id IN (${placeholders}) AND is_deleted = 0`)
    empStmt.bind(employeeIds)
    while (empStmt.step()) {
      employees.push(empStmt.getAsObject())
    }
    empStmt.free()
  } else {
    const empStmt = db.prepare('SELECT id, salary FROM employees WHERE is_deleted = 0')
    while (empStmt.step()) {
      employees.push(empStmt.getAsObject())
    }
    empStmt.free()
  }

  let success = 0
  let failed = 0

  // 检查是否已存在
  employees.forEach(emp => {
    const checkStmt = db.prepare('SELECT id FROM salary_sheets WHERE employee_id = ? AND month = ? AND is_deleted = 0')
    checkStmt.bind([emp.id, month])
    const exists = checkStmt.step()
    checkStmt.free()

    if (exists) {
      failed++
      return
    }

    // 生成工资条
    const baseSalary = emp.salary || 0
    const actualSalary = baseSalary // 初始实际工资等于基本工资

    const insertStmt = db.prepare(`
      INSERT INTO salary_sheets (
        employee_id, month, base_salary, overtime_pay, bonus, allowance,
        deduction, tax, insurance, actual_salary, status,
        created_by, created_at
      ) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, ?, 'draft', ?, unixepoch())
    `)
    insertStmt.run([emp.id, month, baseSalary, actualSalary, operator?.id || null])
    insertStmt.free()
    success++
  })

  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '批量生成工资条',
    targetType: 'salary_sheet',
    detail: JSON.stringify({ month, success, failed })
  })

  return { success, failed }
}

// ==================== 调薪记录管理 ====================

/**
 * 获取调薪记录列表
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getSalaryAdjustments(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['sa.is_deleted = 0']
  const bindParams = []

  if (options.employee_id) {
    conditions.push('sa.employee_id = ?')
    bindParams.push(options.employee_id)
  }

  if (options.type) {
    conditions.push('sa.type = ?')
    bindParams.push(options.type)
  }

  if (options.keyword) {
    conditions.push('(e.name LIKE ? OR e.account LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM salary_adjustments sa
    LEFT JOIN employees e ON sa.employee_id = e.id
    ${whereClause}
  `)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`
    SELECT sa.*, e.name as employee_name, e.account as employee_account,
           d.name as department_name
    FROM salary_adjustments sa
    LEFT JOIN employees e ON sa.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${whereClause}
    ORDER BY sa.effective_date DESC, sa.created_at DESC
    LIMIT ? OFFSET ?
  `)
  listStmt.bind([...bindParams, pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 根据ID获取调薪记录
 * @param {number} id - 调薪记录ID
 * @returns {Object|null} 调薪记录信息
 */
function getSalaryAdjustmentById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT sa.*, e.name as employee_name, e.account as employee_account,
           d.name as department_name
    FROM salary_adjustments sa
    LEFT JOIN employees e ON sa.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE sa.id = ? AND sa.is_deleted = 0
  `)
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增调薪记录
 * @param {Object} data - 调薪记录数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addSalaryAdjustment(data, operator) {
  const db = getDb()

  // 获取员工当前薪资
  const empStmt = db.prepare('SELECT salary FROM employees WHERE id = ? AND is_deleted = 0')
  empStmt.bind([data.employee_id])
  let currentSalary = 0
  if (empStmt.step()) {
    currentSalary = empStmt.getAsObject().salary || 0
  }
  empStmt.free()

  // 计算调整后薪资
  const adjustAmount = data.adjust_amount || 0
  const newSalary = currentSalary + adjustAmount

  // 插入调薪记录
  const stmt = db.prepare(`
    INSERT INTO salary_adjustments (
      employee_id, type, before_salary, adjust_amount, after_salary,
      effective_date, reason, remark, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.employee_id,
    data.type || 'raise',
    currentSalary,
    adjustAmount,
    newSalary,
    data.effective_date || null,
    data.reason || null,
    data.remark || null,
    operator?.id || null
  ])
  stmt.free()

  // 更新员工薪资
  const updateStmt = db.prepare('UPDATE employees SET salary = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  updateStmt.run([newSalary, operator?.id || null, data.employee_id])
  updateStmt.free()

  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '新增调薪记录',
    targetType: 'salary_adjustment',
    targetId: data.employee_id,
    detail: JSON.stringify({
      before: currentSalary,
      adjust: adjustAmount,
      after: newSalary,
      type: data.type
    })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 删除调薪记录
 * @param {number} id - 调薪记录ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteSalaryAdjustment(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE salary_adjustments SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '薪资管理',
    action: '删除调薪记录',
    targetType: 'salary_adjustment',
    targetId: id
  })

  return true
}

// ==================== 薪资统计 ====================

/**
 * 获取薪资统计数据
 * @param {Object} options - 查询选项
 * @returns {Object} 统计数据
 */
function getSalaryStatistics(options = {}) {
  const db = getDb()

  // 总薪资支出
  const totalStmt = db.prepare(`
    SELECT COALESCE(SUM(actual_salary), 0) as total
    FROM salary_sheets
    WHERE is_deleted = 0 AND status = 'paid'
    ${options.month ? 'AND month = ?' : ''}
  `)
  if (options.month) {
    totalStmt.bind([options.month])
  }
  totalStmt.step()
  const totalSalary = totalStmt.getAsObject().total
  totalStmt.free()

  // 部门薪资分布
  const deptStmt = db.prepare(`
    SELECT d.name as department_name, COALESCE(SUM(s.actual_salary), 0) as total_salary
    FROM salary_sheets s
    LEFT JOIN employees e ON s.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE s.is_deleted = 0 AND s.status = 'paid'
    ${options.month ? 'AND s.month = ?' : ''}
    GROUP BY d.id
    ORDER BY total_salary DESC
  `)
  if (options.month) {
    deptStmt.bind([options.month])
  }
  const deptDistribution = []
  while (deptStmt.step()) {
    deptDistribution.push(deptStmt.getAsObject())
  }
  deptStmt.free()

  // 月度薪资趋势（最近12个月）
  const trendStmt = db.prepare(`
    SELECT month, COALESCE(SUM(actual_salary), 0) as total_salary, COUNT(*) as count
    FROM salary_sheets
    WHERE is_deleted = 0 AND status = 'paid'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `)
  const monthlyTrend = []
  while (trendStmt.step()) {
    monthlyTrend.push(trendStmt.getAsObject())
  }
  trendStmt.free()

  // 薪资区间分布
  const rangeStmt = db.prepare(`
    SELECT
      CASE
        WHEN actual_salary < 5000 THEN '0-5000'
        WHEN actual_salary < 10000 THEN '5000-10000'
        WHEN actual_salary < 15000 THEN '10000-15000'
        WHEN actual_salary < 20000 THEN '15000-20000'
        ELSE '20000+'
      END as salary_range,
      COUNT(*) as count
    FROM salary_sheets
    WHERE is_deleted = 0 AND status = 'paid'
    ${options.month ? 'AND month = ?' : ''}
    GROUP BY salary_range
    ORDER BY
      CASE salary_range
        WHEN '0-5000' THEN 1
        WHEN '5000-10000' THEN 2
        WHEN '10000-15000' THEN 3
        WHEN '15000-20000' THEN 4
        ELSE 5
      END
  `)
  if (options.month) {
    rangeStmt.bind([options.month])
  }
  const salaryRange = []
  while (rangeStmt.step()) {
    salaryRange.push(rangeStmt.getAsObject())
  }
  rangeStmt.free()

  return {
    totalSalary,
    deptDistribution,
    monthlyTrend: monthlyTrend.reverse(),
    salaryRange
  }
}

module.exports = {
  // 工资条管理
  getSalarySheets,
  getSalarySheetById,
  addSalarySheet,
  updateSalarySheet,
  deleteSalarySheet,
  batchGenerateSalarySheets,
  // 调薪记录
  getSalaryAdjustments,
  getSalaryAdjustmentById,
  addSalaryAdjustment,
  deleteSalaryAdjustment,
  // 薪资统计
  getSalaryStatistics
}
