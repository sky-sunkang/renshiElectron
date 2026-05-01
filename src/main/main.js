const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const db = require('./db')

const createWindow = () => {
  const preloadPath = app.isPackaged
    ? path.join(__dirname, '../preload/preload.js')
    : path.join(__dirname, '../../src/preload/index.js')

  // macOS 使用 icns，其他平台使用 png
  let iconPath
  if (app.isPackaged) {
    iconPath = path.join(__dirname, '../resources/icon.png')
  } else {
    if (process.platform === 'darwin') {
      iconPath = path.join(__dirname, '../../resources/icon.icns')
    } else {
      iconPath = path.join(__dirname, '../../resources/icon.png')
    }
  }

  // 获取屏幕尺寸，设置窗口为屏幕的80%
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const windowWidth = Math.floor(screenWidth * 0.8)
  const windowHeight = Math.floor(screenHeight * 0.8)

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://127.0.0.1:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  db.init()

  // Login
  ipcMain.handle('auth:login', (_, name, password) => db.login(name, password))

  // Departments
  ipcMain.handle('dept:add', (_, name, description, parent_id, operator) => db.addDepartment(name, description, parent_id, operator))
  ipcMain.handle('dept:getAll', () => db.getAllDepartments())
  ipcMain.handle('dept:update', (_, id, name, description, parent_id, operator) => db.updateDepartment(id, name, description, parent_id, operator))
  ipcMain.handle('dept:delete', (_, id, operator) => db.deleteDepartment(id, operator))
  ipcMain.handle('dept:getChildren', (_, id) => db.getChildDepartments(id))

  // Employees
  ipcMain.handle('emp:add', (_, data, operator) => db.addEmployee(data, operator))
  ipcMain.handle('emp:getAll', () => db.getAllEmployees())
  ipcMain.handle('emp:getById', (_, id) => db.getEmployeeById(id))
  ipcMain.handle('emp:update', (_, id, data, operator) => db.updateEmployee(id, data, operator))
  ipcMain.handle('emp:delete', (_, id, operator) => db.deleteEmployee(id, operator))
  ipcMain.handle('emp:updatePassword', (_, id, password, operator) => db.updatePassword(id, password, operator))
  ipcMain.handle('emp:updateAvatar', (_, id, avatarBase64, operator) => db.updateAvatar(id, avatarBase64, operator))
  ipcMain.handle('emp:getAvatar', (_, id) => db.getAvatar(id))

  // Statistics
  ipcMain.handle('stats:get', () => db.getStatistics())

  // Dictionaries
  ipcMain.handle('dict:getTypes', () => db.getAllDictTypes())
  ipcMain.handle('dict:addType', (_, code, name, description, operator) => db.addDictType(code, name, description, operator))
  ipcMain.handle('dict:updateType', (_, id, code, name, description, operator) => db.updateDictType(id, code, name, description, operator))
  ipcMain.handle('dict:deleteType', (_, id, operator) => db.deleteDictType(id, operator))
  ipcMain.handle('dict:getItems', (_, typeCode) => db.getDictItemsByType(typeCode))
  ipcMain.handle('dict:addItem', (_, typeCode, label, value, sort, operator) => db.addDictItem(typeCode, label, value, sort, operator))
  ipcMain.handle('dict:updateItem', (_, id, typeCode, label, value, sort, operator) => db.updateDictItem(id, typeCode, label, value, sort, operator))
  ipcMain.handle('dict:deleteItem', (_, id, operator) => db.deleteDictItem(id, operator))

  // Permissions
  ipcMain.handle('perm:getRoles', () => db.getAllRoles())
  ipcMain.handle('perm:getRoleById', (_, id) => db.getRoleById(id))
  ipcMain.handle('perm:addRole', (_, data, operator) => db.addRole(data, operator))
  ipcMain.handle('perm:updateRole', (_, id, data, operator) => db.updateRole(id, data, operator))
  ipcMain.handle('perm:deleteRole', (_, id, operator) => db.deleteRole(id, operator))
  ipcMain.handle('perm:getRolePermissions', (_, roleId) => db.getRolePermissions(roleId))
  ipcMain.handle('perm:setRolePermissions', (_, roleId, codes, operator) => db.setRolePermissions(roleId, codes, operator))
  ipcMain.handle('perm:setUserRoles', (_, userId, roleIds) => db.setUserRoles(userId, roleIds))
  ipcMain.handle('perm:addUserRole', (_, userId, roleId, operator) => db.addUserRole(userId, roleId, operator))
  ipcMain.handle('perm:removeUserRole', (_, userId, roleId, operator) => db.removeUserRole(userId, roleId, operator))
  ipcMain.handle('perm:getRoleUsers', (_, roleId) => db.getRoleUsers(roleId))
  ipcMain.handle('perm:getAllPermissions', () => db.getAllPermissions())
  ipcMain.handle('perm:hasPermission', (_, userId, code) => db.hasPermission(userId, code))
  ipcMain.handle('perm:isSuperAdmin', (_, userId) => db.isSuperAdmin(userId))

  // Operation log
  ipcMain.handle('log:add', (_, params) => db.addLog(params))
  ipcMain.handle('log:getList', (_, params) => db.getLogs(params))
  ipcMain.handle('log:getModules', () => db.getLogModules())
  ipcMain.handle('log:getActions', () => db.getLogActions())
  ipcMain.handle('log:clear', (_, days) => db.clearLogs(days))

  // Database management
  ipcMain.handle('db:getTables', () => db.getTables())
  ipcMain.handle('db:getTableSchema', (_, tableName) => db.getTableSchema(tableName))
  ipcMain.handle('db:getTableData', (_, tableName, options) => db.getTableData(tableName, options))
  ipcMain.handle('db:updateTableData', (_, tableName, id, data) => db.updateTableData(tableName, id, data))
  ipcMain.handle('db:deleteTableData', (_, tableName, id) => db.deleteTableData(tableName, id))
  ipcMain.handle('db:executeSql', (_, sql) => db.executeSql(sql))
  ipcMain.handle('db:getComments', () => ({ tableComments: db.tableComments, fieldComments: db.fieldComments }))

  // Window controls
  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
    }
  })
  ipcMain.handle('window:isMaximized', () => {
    const win = BrowserWindow.getFocusedWindow()
    return win ? win.isMaximized() : false
  })
  ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  db.close()
  // 开发模式下强制退出，避免进程残留
  if (!app.isPackaged) {
    app.quit()
  } else if (process.platform !== 'darwin') {
    app.quit()
  }
})
