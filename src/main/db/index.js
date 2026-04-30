/**
 * 数据库模块入口
 * 整合所有子模块并统一导出
 */

const core = require('./core')
const department = require('./department')
const employee = require('./employee')
const dict = require('./dict')
const statistics = require('./statistics')
const permission = require('./permission')
const init = require('./init')

/**
 * 初始化数据库
 * 创建表结构、兼容旧版字段、初始化种子数据
 */
async function initDatabase() {
  // 初始化数据库连接
  await core.initConnection()

  // 执行完整初始化（表结构 + 种子数据）
  init.initDatabase()

  console.log('[DB] ready')
}

module.exports = {
  // 基础功能
  init: initDatabase,
  close: core.close,
  // 部门模块
  addDepartment: department.addDepartment,
  getAllDepartments: department.getAllDepartments,
  updateDepartment: department.updateDepartment,
  deleteDepartment: department.deleteDepartment,
  getChildDepartments: department.getChildDepartments,
  // 员工模块
  login: employee.login,
  addEmployee: employee.addEmployee,
  getAllEmployees: employee.getAllEmployees,
  getEmployeeById: employee.getEmployeeById,
  updateEmployee: employee.updateEmployee,
  updatePassword: employee.updatePassword,
  deleteEmployee: employee.deleteEmployee,
  updateAvatar: employee.updateAvatar,
  getAvatar: employee.getAvatar,
  // 字典模块
  getAllDictTypes: dict.getAllDictTypes,
  addDictType: dict.addDictType,
  updateDictType: dict.updateDictType,
  deleteDictType: dict.deleteDictType,
  getDictItemsByType: dict.getDictItemsByType,
  addDictItem: dict.addDictItem,
  updateDictItem: dict.updateDictItem,
  deleteDictItem: dict.deleteDictItem,
  // 统计模块
  getStatistics: statistics.getStatistics,
  // 权限模块
  getAllRoles: permission.getAllRoles,
  getRoleById: permission.getRoleById,
  addRole: permission.addRole,
  updateRole: permission.updateRole,
  deleteRole: permission.deleteRole,
  getRolePermissions: permission.getRolePermissions,
  setRolePermissions: permission.setRolePermissions,
  setUserRoles: permission.setUserRoles,
  addUserRole: permission.addUserRole,
  removeUserRole: permission.removeUserRole,
  getRoleUsers: permission.getRoleUsers,
  getAllPermissions: permission.getAllPermissions,
  getUserPermissions: permission.getUserPermissions,
  hasPermission: permission.hasPermission,
  isSuperAdmin: permission.isSuperAdmin
}