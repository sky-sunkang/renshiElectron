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
  },
  auth: {
    login: (name, password) => ipcRenderer.invoke('auth:login', name, password),
  },
  dept: {
    add: (name, description, parent_id, operator) => ipcRenderer.invoke('dept:add', name, description, parent_id, operator),
    getAll: () => ipcRenderer.invoke('dept:getAll'),
    update: (id, name, description, parent_id, operator) => ipcRenderer.invoke('dept:update', id, name, description, parent_id, operator),
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
})
