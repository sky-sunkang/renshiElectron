/**
 * 数据库核心模块
 * 提供数据库实例和持久化功能，避免循环依赖
 */

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

// 数据库文件路径
const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'app.db')
  : path.join(__dirname, '../../../app.db')

let db

/**
 * 获取数据库实例
 * @returns {Object} 数据库实例
 */
function getDb() {
  return db
}

/**
 * 持久化数据库到文件
 */
function save() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

/**
 * 初始化数据库连接
 * 如果存在历史数据库文件则加载，否则创建新数据库
 */
async function initConnection() {
  SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(filebuffer)
  } else {
    db = new SQL.Database()
  }

  console.log('[DB] dbPath:', dbPath)
}

/**
 * 关闭数据库连接
 */
function close() {
  if (db) {
    save()
    db.close()
  }
}

module.exports = {
  getDb,
  save,
  initConnection,
  close
}