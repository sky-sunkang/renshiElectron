/**
 * 工作日历模块
 * 管理工作日、节假日、调休日
 */

const { getDb, save } = require('./core')

/**
 * 初始化工作日历表
 */
function initCalendarTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS work_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      date_str TEXT NOT NULL,
      type TEXT DEFAULT 'workday',
      name TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建唯一索引
  try {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_date ON work_calendar(date_str)')
  } catch (e) {
    // 索引已存在
  }
}

/**
 * 初始化某年的日历数据
 * @param {number} year - 年份
 * @param {Object} operator - 操作人信息
 */
function initYearCalendar(year, operator = null) {
  const db = getDb()

  // 检查是否已有该年数据
  const checkStmt = db.prepare(`SELECT COUNT(*) as c FROM work_calendar WHERE date_str LIKE ? AND is_deleted = 0`)
  checkStmt.bind([`${year}-%`])
  checkStmt.step()
  const count = Number(checkStmt.getAsObject().c)
  checkStmt.free()

  if (count > 0) {
    console.log(`[DB] calendar for year ${year} already exists`)
    return
  }

  // 生成全年日历
  const stmt = db.prepare('INSERT INTO work_calendar (date, date_str, type, is_deleted, created_by) VALUES (?, ?, ?, 0, ?)')
  const operatorId = operator?.id || null

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const timestamp = Math.floor(date.getTime() / 1000)
      const dayOfWeek = date.getDay()

      // 默认：周末为休息日，工作日为工作日
      const type = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'workday'

      stmt.run([timestamp, dateStr, type, operatorId])
    }
  }
  stmt.free()
  save()
  console.log(`[DB] calendar for year ${year} initialized`)
}

/**
 * 获取某月的日历数据
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Array} 日历数据列表
 */
function getMonthCalendar(year, month) {
  const db = getDb()
  const pattern = `${year}-${String(month).padStart(2, '0')}-%`

  const stmt = db.prepare(`SELECT * FROM work_calendar WHERE date_str LIKE ? AND is_deleted = 0 ORDER BY date_str`)
  stmt.bind([pattern])

  const list = []
  while (stmt.step()) {
    list.push(stmt.getAsObject())
  }
  stmt.free()

  return list
}

/**
 * 获取某年的日历数据
 * @param {number} year - 年份
 * @returns {Array} 日历数据列表
 */
function getYearCalendar(year) {
  const db = getDb()
  const pattern = `${year}-%`

  const stmt = db.prepare(`SELECT * FROM work_calendar WHERE date_str LIKE ? AND is_deleted = 0 ORDER BY date_str`)
  stmt.bind([pattern])

  const list = []
  while (stmt.step()) {
    list.push(stmt.getAsObject())
  }
  stmt.free()

  return list
}

/**
 * 设置某天的类型
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @param {string} type - 类型 workday/holiday/weekend/adjustment
 * @param {string} name - 名称（节假日名称）
 * @param {Object} operator - 操作人信息
 */
function setDayType(dateStr, type, name = null, operator = null) {
  const db = getDb()

  // 解析日期
  const parts = dateStr.split('-')
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  const timestamp = Math.floor(date.getTime() / 1000)

  // 检查是否存在
  const checkStmt = db.prepare('SELECT id, is_deleted FROM work_calendar WHERE date_str = ?')
  checkStmt.bind([dateStr])
  const hasRow = checkStmt.step()
  const existing = hasRow ? checkStmt.getAsObject() : null
  checkStmt.free()

  if (!existing) {
    // 新增
    const stmt = db.prepare('INSERT INTO work_calendar (date, date_str, type, name, is_deleted, created_by, updated_by) VALUES (?, ?, ?, ?, 0, ?, ?)')
    stmt.run([timestamp, dateStr, type, name, operator?.id || null, operator?.id || null])
    stmt.free()
  } else if (existing.is_deleted === 1) {
    // 恢复并更新
    const stmt = db.prepare('UPDATE work_calendar SET is_deleted = 0, type = ?, name = ?, updated_by = ? WHERE id = ?')
    stmt.run([type, name, operator?.id || null, existing.id])
    stmt.free()
  } else {
    // 更新
    const stmt = db.prepare('UPDATE work_calendar SET type = ?, name = ?, updated_by = ? WHERE id = ?')
    stmt.run([type, name, operator?.id || null, existing.id])
    stmt.free()
  }

  save()
}

/**
 * 批量设置日期类型
 * @param {Array} days - 日期配置数组 [{dateStr, type, name}]
 * @param {Object} operator - 操作人信息
 */
function batchSetDays(days, operator = null) {
  const db = getDb()

  days.forEach(day => {
    const parts = day.dateStr.split('-')
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const timestamp = Math.floor(date.getTime() / 1000)

    // 检查是否存在
    const checkStmt = db.prepare('SELECT id, is_deleted FROM work_calendar WHERE date_str = ?')
    checkStmt.bind([day.dateStr])
    const hasRow = checkStmt.step()
    const existing = hasRow ? checkStmt.getAsObject() : null
    checkStmt.free()

    if (!existing) {
      const stmt = db.prepare('INSERT INTO work_calendar (date, date_str, type, name, is_deleted, created_by, updated_by) VALUES (?, ?, ?, ?, 0, ?, ?)')
      stmt.run([timestamp, day.dateStr, day.type, day.name || null, operator?.id || null, operator?.id || null])
      stmt.free()
    } else if (existing.is_deleted === 1) {
      const stmt = db.prepare('UPDATE work_calendar SET is_deleted = 0, type = ?, name = ?, updated_by = ? WHERE id = ?')
      stmt.run([day.type, day.name || null, operator?.id || null, existing.id])
      stmt.free()
    } else {
      const stmt = db.prepare('UPDATE work_calendar SET type = ?, name = ?, updated_by = ? WHERE id = ?')
      stmt.run([day.type, day.name || null, operator?.id || null, existing.id])
      stmt.free()
    }
  })

  save()
}

/**
 * 获取某月的工作日数量
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {number} 工作日数量
 */
function getWorkDays(year, month) {
  const db = getDb()
  const pattern = `${year}-${String(month).padStart(2, '0')}-%`

  // 工作日 + 调休日（周末调为工作日）
  const stmt = db.prepare(`SELECT COUNT(*) as c FROM work_calendar WHERE date_str LIKE ? AND type IN ('workday', 'adjustment') AND is_deleted = 0`)
  stmt.bind([pattern])
  stmt.step()
  const count = Number(stmt.getAsObject().c)
  stmt.free()

  // 如果没有数据，按默认计算（排除周末）
  if (count === 0) {
    const daysInMonth = new Date(year, month, 0).getDate()
    let workDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++
      }
    }
    return workDays
  }

  return count
}

/**
 * 获取某天的类型
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {Object|null} 日历记录
 */
function getDayType(dateStr) {
  const db = getDb()

  const stmt = db.prepare('SELECT * FROM work_calendar WHERE date_str = ? AND is_deleted = 0')
  stmt.bind([dateStr])
  const hasRow = stmt.step()
  const result = hasRow ? stmt.getAsObject() : null
  stmt.free()

  return result
}

module.exports = {
  initCalendarTables,
  initYearCalendar,
  getMonthCalendar,
  getYearCalendar,
  setDayType,
  batchSetDays,
  getWorkDays,
  getDayType
}