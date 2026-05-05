/**
 * 预加载脚本
 * 通过 contextBridge 安全地暴露 IPC 接口给渲染进程
 * 所有通信通过 window.electronAPI 访问
 */

const { contextBridge, ipcRenderer } = require('electron')

/**
 * 暴露安全的 Electron API 给渲染进程
 * 包含平台信息、窗口控制、业务模块 IPC 调用
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    close: () => ipcRenderer.invoke('window:close'),
    openDevTools: () => ipcRenderer.invoke('window:openDevTools'),
  },
  auth: {
    login: (name, password) => ipcRenderer.invoke('auth:login', name, password),
  },
  dept: {
    add: (name, code, description, parent_id, operator) => ipcRenderer.invoke('dept:add', name, code, description, parent_id, operator),
    getAll: () => ipcRenderer.invoke('dept:getAll'),
    update: (id, name, code, description, parent_id, operator) => ipcRenderer.invoke('dept:update', id, name, code, description, parent_id, operator),
    delete: (id, operator) => ipcRenderer.invoke('dept:delete', id, operator),
    getChildren: (id) => ipcRenderer.invoke('dept:getChildren', id),
  },
  emp: {
    add: (data, operator) => ipcRenderer.invoke('emp:add', data, operator),
    getAll: () => ipcRenderer.invoke('emp:getAll'),
    getById: (id) => ipcRenderer.invoke('emp:getById', id),
    update: (id, data, operator) => ipcRenderer.invoke('emp:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('emp:delete', id, operator),
    updatePassword: (id, password, operator) => ipcRenderer.invoke('emp:updatePassword', id, password, operator),
    updateAvatar: (id, avatarBase64, operator) => ipcRenderer.invoke('emp:updateAvatar', id, avatarBase64, operator),
    getAvatar: (id) => ipcRenderer.invoke('emp:getAvatar', id),
  },
  stats: {
    get: () => ipcRenderer.invoke('stats:get'),
    getLogStats: () => ipcRenderer.invoke('stats:getLogStats'),
  },
  dict: {
    getTypes: () => ipcRenderer.invoke('dict:getTypes'),
    addType: (code, name, description, operator) => ipcRenderer.invoke('dict:addType', code, name, description, operator),
    updateType: (id, code, name, description, operator) => ipcRenderer.invoke('dict:updateType', id, code, name, description, operator),
    deleteType: (id, operator) => ipcRenderer.invoke('dict:deleteType', id, operator),
    getItems: (typeCode) => ipcRenderer.invoke('dict:getItems', typeCode),
    addItem: (typeCode, label, value, sort, operator) => ipcRenderer.invoke('dict:addItem', typeCode, label, value, sort, operator),
    updateItem: (id, typeCode, label, value, sort, operator) => ipcRenderer.invoke('dict:updateItem', id, typeCode, label, value, sort, operator),
    deleteItem: (id, operator) => ipcRenderer.invoke('dict:deleteItem', id, operator),
  },
  perm: {
    getRoles: () => ipcRenderer.invoke('perm:getRoles'),
    getRoleById: (id) => ipcRenderer.invoke('perm:getRoleById', id),
    addRole: (data, operator) => ipcRenderer.invoke('perm:addRole', data, operator),
    updateRole: (id, data, operator) => ipcRenderer.invoke('perm:updateRole', id, data, operator),
    deleteRole: (id, operator) => ipcRenderer.invoke('perm:deleteRole', id, operator),
    getRolePermissions: (roleId) => ipcRenderer.invoke('perm:getRolePermissions', roleId),
    setRolePermissions: (roleId, codes, operator) => ipcRenderer.invoke('perm:setRolePermissions', roleId, codes, operator),
    setUserRoles: (userId, roleIds) => ipcRenderer.invoke('perm:setUserRoles', userId, roleIds),
    addUserRole: (userId, roleId, operator) => ipcRenderer.invoke('perm:addUserRole', userId, roleId, operator),
    removeUserRole: (userId, roleId, operator) => ipcRenderer.invoke('perm:removeUserRole', userId, roleId, operator),
    getRoleUsers: (roleId) => ipcRenderer.invoke('perm:getRoleUsers', roleId),
    getAllPermissions: () => ipcRenderer.invoke('perm:getAllPermissions'),
    hasPermission: (userId, code) => ipcRenderer.invoke('perm:hasPermission', userId, code),
    isSuperAdmin: (userId) => ipcRenderer.invoke('perm:isSuperAdmin', userId),
  },
  log: {
    add: (params) => ipcRenderer.invoke('log:add', params),
    getList: (params) => ipcRenderer.invoke('log:getList', params),
    getModules: () => ipcRenderer.invoke('log:getModules'),
    getActions: () => ipcRenderer.invoke('log:getActions'),
    clear: (days) => ipcRenderer.invoke('log:clear', days),
  },
  db: {
    getTables: () => ipcRenderer.invoke('db:getTables'),
    getTableSchema: (tableName) => ipcRenderer.invoke('db:getTableSchema', tableName),
    getTableData: (tableName, options) => ipcRenderer.invoke('db:getTableData', tableName, options),
    updateTableData: (tableName, id, data, operator) => ipcRenderer.invoke('db:updateTableData', tableName, id, data, operator),
    deleteTableData: (tableName, id, operator) => ipcRenderer.invoke('db:deleteTableData', tableName, id, operator),
    executeSql: (sql, operator) => ipcRenderer.invoke('db:executeSql', sql, operator),
    getComments: () => ipcRenderer.invoke('db:getComments'),
  },
  announcement: {
    getAll: (options) => ipcRenderer.invoke('announcement:getAll', options),
    getById: (id) => ipcRenderer.invoke('announcement:getById', id),
    add: (data, operator) => ipcRenderer.invoke('announcement:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('announcement:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('announcement:delete', id, operator),
    getActive: (limit) => ipcRenderer.invoke('announcement:getActive', limit),
  },
  contract: {
    getAll: (options) => ipcRenderer.invoke('contract:getAll', options),
    getById: (id) => ipcRenderer.invoke('contract:getById', id),
    add: (data, operator) => ipcRenderer.invoke('contract:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('contract:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('contract:delete', id, operator),
    getExpiring: (days) => ipcRenderer.invoke('contract:getExpiring', days),
  },
  attendance: {
    getAll: (options) => ipcRenderer.invoke('attendance:getAll', options),
    add: (data, operator) => ipcRenderer.invoke('attendance:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('attendance:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('attendance:delete', id, operator),
    getToday: (employeeId) => ipcRenderer.invoke('attendance:getToday', employeeId),
    getStats: (employeeId, month) => ipcRenderer.invoke('attendance:getStats', employeeId, month),
  },
  position: {
    getAll: (options) => ipcRenderer.invoke('position:getAll', options),
    getById: (id) => ipcRenderer.invoke('position:getById', id),
    add: (data, operator) => ipcRenderer.invoke('position:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('position:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('position:delete', id, operator),
  },
  candidate: {
    getAll: (options) => ipcRenderer.invoke('candidate:getAll', options),
    getById: (id) => ipcRenderer.invoke('candidate:getById', id),
    add: (data, operator) => ipcRenderer.invoke('candidate:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('candidate:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('candidate:delete', id, operator),
  },
  interview: {
    getAll: (options) => ipcRenderer.invoke('interview:getAll', options),
    add: (data, operator) => ipcRenderer.invoke('interview:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('interview:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('interview:delete', id, operator),
  },
  indicator: {
    getAll: (options) => ipcRenderer.invoke('indicator:getAll', options),
    getById: (id) => ipcRenderer.invoke('indicator:getById', id),
    add: (data, operator) => ipcRenderer.invoke('indicator:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('indicator:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('indicator:delete', id, operator),
  },
  assessment: {
    getAll: (options) => ipcRenderer.invoke('assessment:getAll', options),
    getById: (id) => ipcRenderer.invoke('assessment:getById', id),
    add: (data, operator) => ipcRenderer.invoke('assessment:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('assessment:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('assessment:delete', id, operator),
    getDetails: (assessmentId) => ipcRenderer.invoke('assessment:getDetails', assessmentId),
    saveDetails: (assessmentId, details, operator) => ipcRenderer.invoke('assessment:saveDetails', assessmentId, details, operator),
  },
  // Salary - Salary Sheets
  salarySheet: {
    getAll: (options) => ipcRenderer.invoke('salarySheet:getAll', options),
    getById: (id) => ipcRenderer.invoke('salarySheet:getById', id),
    add: (data, operator) => ipcRenderer.invoke('salarySheet:add', data, operator),
    update: (id, data, operator) => ipcRenderer.invoke('salarySheet:update', id, data, operator),
    delete: (id, operator) => ipcRenderer.invoke('salarySheet:delete', id, operator),
    batchGenerate: (month, employeeIds, operator) => ipcRenderer.invoke('salarySheet:batchGenerate', month, employeeIds, operator),
  },
  // Salary - Adjustments
  salaryAdjustment: {
    getAll: (options) => ipcRenderer.invoke('salaryAdjustment:getAll', options),
    getById: (id) => ipcRenderer.invoke('salaryAdjustment:getById', id),
    add: (data, operator) => ipcRenderer.invoke('salaryAdjustment:add', data, operator),
    delete: (id, operator) => ipcRenderer.invoke('salaryAdjustment:delete', id, operator),
  },
  // Salary - Statistics
  salaryStatistics: {
    get: (options) => ipcRenderer.invoke('salaryStatistics:get', options),
  },
})
