/**
 * 数据库初始化入口
 * 整合表结构创建和种子数据初始化
 */

const { initAllTables } = require('./init/tables')
const { initDatabase, initAllSeedData } = require('./init/seeds')

module.exports = {
  initDatabase,
  initAllTables,
  initAllSeedData
}
