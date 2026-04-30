const { contextBridge, ipcRenderer } = require('electron')

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
    add: (name, description, parent_id) => ipcRenderer.invoke('dept:add', name, description, parent_id),
    getAll: () => ipcRenderer.invoke('dept:getAll'),
    update: (id, name, description, parent_id) => ipcRenderer.invoke('dept:update', id, name, description, parent_id),
    delete: (id) => ipcRenderer.invoke('dept:delete', id),
    getChildren: (id) => ipcRenderer.invoke('dept:getChildren', id),
  },
  emp: {
    add: (data) => ipcRenderer.invoke('emp:add', data),
    getAll: () => ipcRenderer.invoke('emp:getAll'),
    getById: (id) => ipcRenderer.invoke('emp:getById', id),
    update: (id, data) => ipcRenderer.invoke('emp:update', id, data),
    delete: (id) => ipcRenderer.invoke('emp:delete', id),
    updatePassword: (id, password) => ipcRenderer.invoke('emp:updatePassword', id, password),
    updateAvatar: (id, avatarBase64) => ipcRenderer.invoke('emp:updateAvatar', id, avatarBase64),
    getAvatar: (id) => ipcRenderer.invoke('emp:getAvatar', id),
  },
  stats: {
    get: () => ipcRenderer.invoke('stats:get'),
  },
  dict: {
    getTypes: () => ipcRenderer.invoke('dict:getTypes'),
    addType: (code, name, description) => ipcRenderer.invoke('dict:addType', code, name, description),
    updateType: (id, code, name, description) => ipcRenderer.invoke('dict:updateType', id, code, name, description),
    deleteType: (id) => ipcRenderer.invoke('dict:deleteType', id),
    getItems: (typeCode) => ipcRenderer.invoke('dict:getItems', typeCode),
    addItem: (typeCode, label, value, sort) => ipcRenderer.invoke('dict:addItem', typeCode, label, value, sort),
    updateItem: (id, typeCode, label, value, sort) => ipcRenderer.invoke('dict:updateItem', id, typeCode, label, value, sort),
    deleteItem: (id) => ipcRenderer.invoke('dict:deleteItem', id),
  },
  perm: {
    getRoles: () => ipcRenderer.invoke('perm:getRoles'),
    getRoleById: (id) => ipcRenderer.invoke('perm:getRoleById', id),
    addRole: (data) => ipcRenderer.invoke('perm:addRole', data),
    updateRole: (id, data) => ipcRenderer.invoke('perm:updateRole', id, data),
    deleteRole: (id) => ipcRenderer.invoke('perm:deleteRole', id),
    getRolePermissions: (roleId) => ipcRenderer.invoke('perm:getRolePermissions', roleId),
    setRolePermissions: (roleId, codes) => ipcRenderer.invoke('perm:setRolePermissions', roleId, codes),
    setUserRoles: (userId, roleIds) => ipcRenderer.invoke('perm:setUserRoles', userId, roleIds),
    getRoleUsers: (roleId) => ipcRenderer.invoke('perm:getRoleUsers', roleId),
    getAllPermissions: () => ipcRenderer.invoke('perm:getAllPermissions'),
    hasPermission: (userId, code) => ipcRenderer.invoke('perm:hasPermission', userId, code),
    isSuperAdmin: (userId) => ipcRenderer.invoke('perm:isSuperAdmin', userId),
  },
})
