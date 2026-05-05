/**
 * 公告模块
 * 提供公告的增删改查功能
 */

const { getDb, save } = require('./core')
const { addLog } = require('./log')

/**
 * 获取所有公告列表
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.status - 状态筛选
 * @param {string} options.type - 类型筛选
 * @returns {Object} { list, total }
 */
function getAnnouncements(options = {}) {
  const db = getDb()
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = ['is_deleted = 0']
  const params = []

  if (options.status) {
    conditions.push('status = ?')
    params.push(options.status)
  }
  if (options.type) {
    conditions.push('type = ?')
    params.push(options.type)
  }

  const whereClause = conditions.join(' AND ')

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM announcements WHERE ${whereClause}`
  const countStmt = db.prepare(countSql)
  if (params.length > 0) {
    countStmt.bind(params)
  }
  countStmt.step()
  const total = countStmt.getAsObject().total
  countStmt.free()

  // 查询列表
  const listSql = `SELECT * FROM announcements WHERE ${whereClause} ORDER BY publish_time DESC LIMIT ? OFFSET ?`
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
 * 获取公告详情
 * @param {number} id - 公告ID
 * @returns {Object|null} 公告详情
 */
function getAnnouncementById(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM announcements WHERE id = ? AND is_deleted = 0')
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

/**
 * 新增公告
 * @param {Object} data - 公告数据
 * @param {Object} operator - 操作人信息
 * @returns {number} 新增公告ID
 */
function addAnnouncement(data, operator) {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  console.log('[DB] 新增公告, 标题:', data.title, '内容长度:', data.content?.length)

  // 使用 bind 方式插入，避免参数传递问题
  const stmt = db.prepare(`
    INSERT INTO announcements (title, content, type, status, publisher_id, publisher_name, publish_time, expire_time, created_by, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `)
  stmt.bind([
    data.title,
    data.content,
    data.type || 'normal',
    data.status || 'published',
    operator?.id || null,
    operator?.name || null,
    data.status === 'published' ? now : null,
    data.expire_time || null,
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

  // 验证保存结果
  const checkStmt = db.prepare('SELECT content FROM announcements WHERE id = ?')
  checkStmt.bind([result.id])
  checkStmt.step()
  const saved = checkStmt.getAsObject()
  checkStmt.free()
  console.log('[DB] 保存后内容长度:', saved.content?.length)

  console.log('[DB] 公告保存成功, ID:', result.id)

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '公告管理',
    action: '新增',
    targetType: '公告',
    targetId: result.id,
    targetName: data.title
  })

  return result.id
}

/**
 * 更新公告
 * @param {number} id - 公告ID
 * @param {Object} data - 更新数据
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 更新成功返回true
 */
function updateAnnouncement(id, data, operator) {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  console.log('[DB] 更新公告, ID:', id, '内容长度:', data.content?.length)

  // 如果状态改为已发布，设置发布时间
  let publishTimeSql = ''
  const params = [data.title, data.content, data.type, data.status, data.expire_time || null]

  if (data.status === 'published') {
    // 检查之前是否已发布
    const checkStmt = db.prepare('SELECT publish_time FROM announcements WHERE id = ?')
    checkStmt.bind([id])
    checkStmt.step()
    const existing = checkStmt.getAsObject()
    checkStmt.free()

    if (!existing?.publish_time) {
      publishTimeSql = ', publish_time = ?'
      params.push(now)
    }
  }

  params.push(operator?.id || null, now, id)

  const stmt = db.prepare(`
    UPDATE announcements
    SET title = ?, content = ?, type = ?, status = ?, expire_time = ?${publishTimeSql}, updated_by = ?, updated_at = ?
    WHERE id = ?
  `)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  save()

  // 验证保存结果
  const checkStmt = db.prepare('SELECT content FROM announcements WHERE id = ?')
  checkStmt.bind([id])
  checkStmt.step()
  const saved = checkStmt.getAsObject()
  checkStmt.free()
  console.log('[DB] 更新后内容长度:', saved.content?.length)

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '公告管理',
    action: '编辑',
    targetType: '公告',
    targetId: id,
    targetName: data.title,
    detail: JSON.stringify({ type: data.type, status: data.status })
  })

  return true
}

/**
 * 删除公告（逻辑删除）
 * @param {number} id - 公告ID
 * @param {Object} operator - 操作人信息
 * @returns {boolean} 删除成功返回true
 */
function deleteAnnouncement(id, operator) {
  const db = getDb()

  // 获取公告信息用于日志
  const infoStmt = db.prepare('SELECT title FROM announcements WHERE id = ?')
  infoStmt.bind([id])
  infoStmt.step()
  const info = infoStmt.getAsObject()
  infoStmt.free()

  const stmt = db.prepare('UPDATE announcements SET is_deleted = 1, updated_by = ?, updated_at = ? WHERE id = ?')
  stmt.run([operator?.id || null, Math.floor(Date.now() / 1000), id])
  stmt.free()
  save()

  // 记录操作日志
  addLog({
    userId: operator?.id,
    userName: operator?.name,
    module: '公告管理',
    action: '删除',
    targetType: '公告',
    targetId: id,
    targetName: info?.title
  })

  return true
}

/**
 * 获取有效公告列表（首页展示用）
 * @param {number} limit - 返回数量
 * @returns {Array} 公告列表
 */
function getActiveAnnouncements(limit = 5) {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    SELECT * FROM announcements
    WHERE is_deleted = 0
    AND status = 'published'
    AND (expire_time IS NULL OR expire_time > ?)
    ORDER BY publish_time DESC
    LIMIT ?
  `)
  stmt.bind([now, limit])
  const list = []
  while (stmt.step()) {
    list.push(stmt.getAsObject())
  }
  stmt.free()

  return list
}

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements
}
