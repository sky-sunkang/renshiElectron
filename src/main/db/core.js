/**
 * 数据库核心模块
 * 提供数据库实例和持久化功能，避免循环依赖
 */

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

// 数据库文件路径
let dbPath
let db

/**
 * 获取数据库文件路径
 */
function getDbPath() {
  if (!dbPath) {
    dbPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'app.db')
      : path.join(__dirname, '../../../app.db')
  }
  return dbPath
}

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
  if (!db) return
  const data = db.export()
  fs.writeFileSync(getDbPath(), Buffer.from(data))
}

/**
 * 初始化数据库连接
 * 如果存在历史数据库文件则加载，否则创建新数据库
 */
async function initConnection() {
  const dbFilePath = getDbPath()

  // sql.js 配置 - 打包后需要指定 WASM 文件路径
  const sqlJsConfig = {}
  if (app.isPackaged) {
    // 打包后，WASM 文件在 app.asar 中
    sqlJsConfig.locateFile = (file) => {
      return path.join(__dirname, '../../node_modules/sql.js/dist', file)
    }
  }

  const SQL = await initSqlJs(sqlJsConfig)

  if (fs.existsSync(dbFilePath)) {
    const filebuffer = fs.readFileSync(dbFilePath)
    db = new SQL.Database(filebuffer)
  } else {
    db = new SQL.Database()
  }

  console.log('[DB] dbPath:', dbFilePath)
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