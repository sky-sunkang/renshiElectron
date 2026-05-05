/**
 * 招聘管理模块
 * 处理岗位发布、候选人管理、面试安排等
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

// ==================== 岗位管理 ====================

/**
 * 获取所有岗位
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getPositions(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['is_deleted = 0']
  const bindParams = []

  if (options.status) {
    conditions.push('status = ?')
    bindParams.push(options.status)
  }

  if (options.keyword) {
    conditions.push('(title LIKE ? OR department_name LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM positions ${whereClause}`)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`SELECT * FROM positions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
  listStmt.bind([...bindParams, pageSize, offset])
  const list = []
  while (listStmt.step()) {
    list.push(listStmt.getAsObject())
  }
  listStmt.free()

  return { list, total }
}

/**
 * 根据ID获取岗位
 * @param {number} id - 岗位ID
 * @returns {Object|null} 岗位信息
 */
function getPositionById(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM positions WHERE id = ? AND is_deleted = 0')
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增岗位
 * @param {Object} data - 岗位数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addPosition(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO positions (title, department_id, department_name, salary_range, requirements, description, status, headcount, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.title,
    data.department_id || null,
    data.department_name || null,
    data.salary_range || null,
    data.requirements || null,
    data.description || null,
    data.status || 'open',
    data.headcount || 1,
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '新增岗位',
    targetType: 'position',
    targetName: data.title,
    detail: JSON.stringify({ title: data.title, department: data.department_name })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新岗位
 * @param {number} id - 岗位ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updatePosition(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  if (data.department_id !== undefined) {
    fields.push('department_id = ?')
    values.push(data.department_id)
  }
  if (data.department_name !== undefined) {
    fields.push('department_name = ?')
    values.push(data.department_name)
  }
  if (data.salary_range !== undefined) {
    fields.push('salary_range = ?')
    values.push(data.salary_range)
  }
  if (data.requirements !== undefined) {
    fields.push('requirements = ?')
    values.push(data.requirements)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }
  if (data.headcount !== undefined) {
    fields.push('headcount = ?')
    values.push(data.headcount)
  }

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE positions SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '编辑岗位',
    targetType: 'position',
    targetId: id,
    detail: JSON.stringify({ fields: fields.map(f => f.split(' ')[0]) })
  })

  return true
}

/**
 * 删除岗位
 * @param {number} id - 岗位ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deletePosition(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE positions SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '删除岗位',
    targetType: 'position',
    targetId: id
  })

  return true
}

// ==================== 候选人管理 ====================

/**
 * 获取所有候选人
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getCandidates(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['c.is_deleted = 0']
  const bindParams = []

  if (options.status) {
    conditions.push('c.status = ?')
    bindParams.push(options.status)
  }

  if (options.position_id) {
    conditions.push('c.position_id = ?')
    bindParams.push(options.position_id)
  }

  if (options.keyword) {
    conditions.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)')
    bindParams.push(`%${options.keyword}%`, `%${options.keyword}%`, `%${options.keyword}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM candidates c ${whereClause}`)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`
    SELECT c.*, p.title as position_title, p.department_name
    FROM candidates c
    LEFT JOIN positions p ON c.position_id = p.id
    ${whereClause}
    ORDER BY c.created_at DESC
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
 * 根据ID获取候选人
 * @param {number} id - 候选人ID
 * @returns {Object|null} 候选人信息
 */
function getCandidateById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT c.*, p.title as position_title, p.department_name
    FROM candidates c
    LEFT JOIN positions p ON c.position_id = p.id
    WHERE c.id = ? AND c.is_deleted = 0
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
 * 新增候选人
 * @param {Object} data - 候选人数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addCandidate(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO candidates (position_id, name, phone, email, resume, source, status, remark, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.position_id || null,
    data.name,
    data.phone || null,
    data.email || null,
    data.resume || null,
    data.source || null,
    data.status || 'pending',
    data.remark || null,
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '新增候选人',
    targetType: 'candidate',
    targetName: data.name,
    detail: JSON.stringify({ name: data.name, position_id: data.position_id })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新候选人
 * @param {number} id - 候选人ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateCandidate(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  const allowedFields = ['position_id', 'name', 'phone', 'email', 'resume', 'source', 'status', 'remark']
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(data[field])
    }
  })

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '编辑候选人',
    targetType: 'candidate',
    targetId: id,
    detail: JSON.stringify({ fields: fields.map(f => f.split(' ')[0]) })
  })

  return true
}

/**
 * 删除候选人
 * @param {number} id - 候选人ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteCandidate(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE candidates SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '删除候选人',
    targetType: 'candidate',
    targetId: id
  })

  return true
}

// ==================== 面试安排 ====================

/**
 * 获取面试记录
 * @param {Object} options - 查询选项
 * @returns {Object} { list: Array, total: number }
 */
function getInterviews(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['i.is_deleted = 0']
  const bindParams = []

  if (options.candidate_id) {
    conditions.push('i.candidate_id = ?')
    bindParams.push(options.candidate_id)
  }

  if (options.status) {
    conditions.push('i.status = ?')
    bindParams.push(options.status)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 查询总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM interviews i ${whereClause}`)
  if (bindParams.length > 0) {
    countStmt.bind(bindParams)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询数据
  const listStmt = db.prepare(`
    SELECT i.*, c.name as candidate_name, c.phone as candidate_phone,
           p.title as position_title, e.name as interviewer_name
    FROM interviews i
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN positions p ON c.position_id = p.id
    LEFT JOIN employees e ON i.interviewer_id = e.id
    ${whereClause}
    ORDER BY i.interview_time DESC
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
 * 新增面试安排
 * @param {Object} data - 面试数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增记录ID
 */
function addInterview(data, operator) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO interviews (candidate_id, interviewer_id, interview_time, location, round, type, status, remark, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
  `)
  stmt.run([
    data.candidate_id,
    data.interviewer_id || null,
    data.interview_time || null,
    data.location || null,
    data.round || 1,
    data.type || 'onsite',
    data.status || 'scheduled',
    data.remark || null,
    operator?.id || null
  ])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '安排面试',
    targetType: 'interview',
    targetId: data.candidate_id,
    detail: JSON.stringify({ interview_time: data.interview_time, round: data.round })
  })

  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/**
 * 更新面试状态
 * @param {number} id - 面试ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateInterview(id, data, operator) {
  const db = getDb()
  const fields = []
  const values = []

  const allowedFields = ['interviewer_id', 'interview_time', 'location', 'round', 'type', 'status', 'remark', 'result', 'feedback']
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(data[field])
    }
  })

  if (fields.length === 0) return false

  fields.push('updated_by = ?', 'updated_at = unixepoch()')
  values.push(operator?.id || null, id)

  const stmt = db.prepare(`UPDATE interviews SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`)
  stmt.run(values)
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '更新面试',
    targetType: 'interview',
    targetId: id
  })

  return true
}

/**
 * 删除面试记录
 * @param {number} id - 面试ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteInterview(id, operator) {
  const db = getDb()
  const stmt = db.prepare('UPDATE interviews SET is_deleted = 1, updated_by = ?, updated_at = unixepoch() WHERE id = ?')
  stmt.run([operator?.id || null, id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '招聘管理',
    action: '删除面试',
    targetType: 'interview',
    targetId: id
  })

  return true
}

module.exports = {
  // 岗位管理
  getPositions,
  getPositionById,
  addPosition,
  updatePosition,
  deletePosition,
  // 候选人管理
  getCandidates,
  getCandidateById,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  // 面试管理
  getInterviews,
  addInterview,
  updateInterview,
  deleteInterview
}
