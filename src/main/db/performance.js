/**
 * 绩效考核模块
 * 处理考核指标设置、考核评分、绩效结果等
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

// ==================== 考核指标管理 ====================

/**
 * 获取所有考核指标
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getIndicators(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['is_deleted = 0']
  const bindParams = []

  if (options.category) {
    conditions.push('category = ?')
    bindParams.push(options.category)
  }

  if (options.keyword) {
    conditions.push('(name LIKE ? OR description LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM performance_indicators ${whereClause}`)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`SELECT * FROM performance_indicators ${whereClause} ORDER BY sort ASC, created_at DESC LIMIT ? OFFSET ?`)
  listStmt.bind([...bindParams, pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 根据ID获取考核指标
 * @param {number} id - 指标ID
 * @returns {Object|null} 指标信息
 */
function getIndicatorById(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM performance_indicators WHERE id = ? AND is_deleted = 0')
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增考核指标
 * @param {Object} data - 指标数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addIndicator(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO performance_indicators (name, category, description, max_score, weight, sort, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.name,
    data.category || null,
    data.description || null,
    data.max_score || 100,
    data.weight || 1,
    data.sort || 0,
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '新增指标',
    targetType: 'indicator',
    targetName: data.name,
    detail: JSON.stringify({ name: data.name, category: data.category })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新考核指标
 * @param {number} id - 指标ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateIndicator(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  const allowedFields = ['name', 'category', 'description', 'max_score', 'weight', 'sort']
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(data[field])
    }
  })

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE performance_indicators SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '编辑指标',
    targetType: 'indicator',
    targetId: id
  })

  return true
}

/**
 * 删除考核指标
 * @param {number} id - 指标ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteIndicator(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE performance_indicators SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '删除指标',
    targetType: 'indicator',
    targetId: id
  })

  return true
}

// ==================== 考核记录管理 ====================

/**
 * 获取考核记录
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getAssessments(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['a.is_deleted = 0']
  const bindParams = []

  if (options.employee_id) {
    conditions.push('a.employee_id = ?')
    bindParams.push(options.employee_id)
  }

  if (options.period) {
    conditions.push('a.period = ?')
    bindParams.push(options.period)
  }

  if (options.status) {
    conditions.push('a.status = ?')
    bindParams.push(options.status)
  }

  if (options.keyword) {
    conditions.push('(e.name LIKE ? OR e.account LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM assessments a
    LEFT JOIN employees e ON a.employee_id = e.id
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
    SELECT a.*, e.name as employee_name, e.account as employee_account, d.name as department_name
    FROM assessments a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${whereClause}
    ORDER BY a.created_at DESC
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
 * 根据ID获取考核记录
 * @param {number} id - 考核ID
 * @returns {Object|null} 考核信息
 */
function getAssessmentById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT a.*, e.name as employee_name, e.account as employee_account, d.name as department_name
    FROM assessments a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE a.id = ? AND a.is_deleted = 0
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
 * 新增考核记录
 * @param {Object} data - 考核数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addAssessment(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO assessments (employee_id, period, total_score, level, remark, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.employee_id,
    data.period,
    data.total_score || 0,
    data.level || null,
    data.remark || null,
    data.status || 'pending',
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '新增考核',
    targetType: 'assessment',
    targetId: data.employee_id,
    detail: JSON.stringify({ period: data.period })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新考核记录
 * @param {number} id - 考核ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateAssessment(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  const allowedFields = ['total_score', 'level', 'remark', 'status']
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(data[field])
    }
  })

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '编辑考核',
    targetType: 'assessment',
    targetId: id
  })

  return true
}

/**
 * 删除考核记录
 * @param {number} id - 考核ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteAssessment(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE assessments SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '删除考核',
    targetType: 'assessment',
    targetId: id
  })

  return true
}

// ==================== 考核评分明细 ====================

/**
 * 获取考核评分明细
 * @param {number} assessmentId - 考核ID
 * @returns {Array} 评分明细列表
 */
function getAssessmentDetails(assessmentId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT ad.*, pi.name as indicator_name, pi.category, pi.max_score
    FROM assessment_details ad
    LEFT JOIN performance_indicators pi ON ad.indicator_id = pi.id
    WHERE ad.assessment_id = ? AND ad.is_deleted = 0
    ORDER BY pi.sort ASC
  `)
  stmt.bind([assessmentId])
  const list = []
  while (stmt.step()) {
    list.push(stmt.getAsObject())
  }
  stmt.free()
  return list
}

/**
 * 保存考核评分明细
 * @param {number} assessmentId - 考核ID
 * @param {Array} details - 评分明细数组
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 保存成功返回true
 */
function saveAssessmentDetails(assessmentId, details, operator) {
  const db = getDb()

  // 先删除原有明细
  const deleteStmt = db.prepare('UPDATE assessment_details SET is_deleted = 1 WHERE assessment_id = ?')
  deleteStmt.run([assessmentId])
  deleteStmt.free()

  // 插入新明细
  const insertStmt = db.prepare(`
    INSERT INTO assessment_details (assessment_id, indicator_id, score, remark, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
  `)

  let totalScore = 0
  details.forEach(detail => {
    insertStmt.run([assessmentId, detail.indicator_id, detail.score || 0, detail.remark || null, operator?.id || null])
    totalScore += detail.score || 0
  })
  insertStmt.free()

  // 更新考核总分
  const updateStmt = db.prepare('UPDATE assessments SET total_score = ?, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  updateStmt.run([totalScore, operator?.id || null, assessmentId])
  updateStmt.free()

  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '绩效考核',
    action: '保存评分',
    targetType: 'assessment',
    targetId: assessmentId,
    detail: JSON.stringify({ totalScore, itemCount: details.length })
  })

  return true
}

module.exports = {
  // 考核指标
  getIndicators,
  getIndicatorById,
  addIndicator,
  updateIndicator,
  deleteIndicator,
  // 考核记录
  getAssessments,
  getAssessmentById,
  addAssessment,
  updateAssessment,
  deleteAssessment,
  // 评分明细
  getAssessmentDetails,
  saveAssessmentDetails
}
