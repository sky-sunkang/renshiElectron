/**
 * 合同管理模块
 * 提供合同的增删改查功能
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

/**
 * 获取合同列表
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {number} options.employee_id - 员工ID筛选
 * @param {string} options.status - 状态筛选
 * @returns {Object} { list, total }
 */
function getContracts(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['c.is_deleted = 0']
  const params = []

  if (options.employee_id) {
    conditions.push('c.employee_id = ?')
    params.push(options.employee_id)
  }
  if (options.status) {
    conditions.push('c.status = ?')
    params.push(options.status)
  }

  const whereClause = conditions.join(' AND ')

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM contracts c WHERE ${whereClause}`
  const countStmt = db.prepare(countSql)
  if (params.length > 0) {
    countStmt.bind(params)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询列表，关联员工和部门信息
  const listSql = `
    SELECT c.*, e.name as employee_name, e.account as employee_account, d.name as department_name
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
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
 * 获取合同详情
 * @param {number} id - 合同ID
 * @returns {Object|null} 合同详情
 */
function getContractById(id) {
  const db = getDb()
  const sql = `
    SELECT c.*, e.name as employee_name, e.account as employee_account, d.name as department_name
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE c.id = ? AND c.is_deleted = 0
  `
  const stmt = db.prepare(sql)
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增合同
 * @param {Object} data - 合同数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增合同ID
 */
function addContract(data, operator) {
  const db = getDb()

  const stmt = db.prepare(`
    INSERT INTO contracts (
      employee_id, contract_no, contract_type, start_date, end_date,
      sign_date, status, remark, created_by, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `)
  stmt.bind([
    data.employee_id,
    data.contract_no || null,
    data.contract_type || 'labor',
    data.start_date || null,
    data.end_date || null,
    data.sign_date || null,
    data.status || 'active',
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
    module: '合同管理',
    action: '新增',
    targetType: '合同',
    targetId: result.id,
    targetName: data.contract_no || `合同${result.id}`,
    detail: JSON.stringify({ employee_id: data.employee_id, contract_type: data.contract_type })
  })

  return result.id
}

/**
 * 更新合同
 * @param {number} id - 合同ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateContract(id, data, operator) {
  const db = getDb()

  const stmt = db.prepare(`
    UPDATE contracts SET
      employee_id = ?, contract_no = ?, contract_type = ?, start_date = ?,
      end_date = ?, sign_date = ?, status = ?, remark = ?,
      updated_by = ?, updated_at = ?
    WHERE id = ?
  `)
  stmt.bind([
    data.employee_id,
    data.contract_no || null,
    data.contract_type || 'labor',
    data.start_date || null,
    data.end_date || null,
    data.sign_date || null,
    data.status || 'active',
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
    module: '合同管理',
    action: '编辑',
    targetType: '合同',
    targetId: id,
    targetName: data.contract_no || `合同${id}`,
    detail: JSON.stringify({ status: data.status })
  })

  return true
}

/**
 * 删除合同（逻辑删除）
 * @param {number} id - 合同ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteContract(id, operator) {
  const db = getDb()

  // 获取合同信息用于日志
  const infoStmt = db.prepare('SELECT contract_no FROM contracts WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const info = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE contracts SET is_deleted = 1, updated_by = ?, updated_at = ? WHERE id = ?')
  stmt.bind([operator?.id || null, Math.floor(Date.now() / 1000), id])
  stmt.step()
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '合同管理',
    action: '删除',
    targetType: '合同',
    targetId: id,
    targetName: info?.contract_no || `合同${id}`
  })

  return true
}

/**
 * 获取即将到期的合同列表
 * @param {number} days - 提前天数
 * @returns {Array} 合同列表
 */
function getExpiringContracts(days = 30) {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const future = now + days * 86400

  const sql = `
    SELECT c.*, e.name as employee_name, d.name as department_name
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE c.is_deleted = 0
    AND c.status = 'active'
    AND c.end_date >= ?
    AND c.end_date <= ?
    ORDER BY c.end_date ASC
  `
  const stmt = db.prepare(sql)
  stmt.bind([now, future])
  const list = []
  while (stmt.step()) {
    list.push(stmt.getAsObject())
  }
  stmt.free()

  return list
}

module.exports = {
  getContracts,
  getContractById,
  addContract,
  updateContract,
  deleteContract,
  getExpiringContracts
}
