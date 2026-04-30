const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const db = require('./db')

const createWindow = () => {
  const preloadPath = app.isPackaged
    ? path.join(__dirname, '../preload/preload.js')
    : path.join(__dirname, '../../src/preload/index.js')

  const iconPath = app.isPackaged
    ? path.join(__dirname, '../resources/icon.png')
    : path.join(__dirname, '../../resources/icon.png')

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
  ipcMain.handle('dept:add', (_, name, description, parent_id) => db.addDepartment(name, description, parent_id))
  ipcMain.handle('dept:getAll', () => db.getAllDepartments())
  ipcMain.handle('dept:update', (_, id, name, description, parent_id) => db.updateDepartment(id, name, description, parent_id))
  ipcMain.handle('dept:delete', (_, id) => db.deleteDepartment(id))
  ipcMain.handle('dept:getChildren', (_, id) => db.getChildDepartments(id))

  // Employees
  ipcMain.handle('emp:add', (_, data) => db.addEmployee(data))
  ipcMain.handle('emp:getAll', () => db.getAllEmployees())
  ipcMain.handle('emp:getById', (_, id) => db.getEmployeeById(id))
  ipcMain.handle('emp:update', (_, id, data) => db.updateEmployee(id, data))
  ipcMain.handle('emp:delete', (_, id) => db.deleteEmployee(id))
  ipcMain.handle('emp:updatePassword', (_, id, password) => db.updatePassword(id, password))
  ipcMain.handle('emp:updateAvatar', (_, id, avatarBase64) => db.updateAvatar(id, avatarBase64))
  ipcMain.handle('emp:getAvatar', (_, id) => db.getAvatar(id))

  // Statistics
  ipcMain.handle('stats:get', () => db.getStatistics())

  // Dictionaries
  ipcMain.handle('dict:getTypes', () => db.getAllDictTypes())
  ipcMain.handle('dict:addType', (_, code, name, description) => db.addDictType(code, name, description))
  ipcMain.handle('dict:updateType', (_, id, code, name, description) => db.updateDictType(id, code, name, description))
  ipcMain.handle('dict:deleteType', (_, id) => db.deleteDictType(id))
  ipcMain.handle('dict:getItems', (_, typeCode) => db.getDictItemsByType(typeCode))
  ipcMain.handle('dict:addItem', (_, typeCode, label, value, sort) => db.addDictItem(typeCode, label, value, sort))
  ipcMain.handle('dict:updateItem', (_, id, typeCode, label, value, sort) => db.updateDictItem(id, typeCode, label, value, sort))
  ipcMain.handle('dict:deleteItem', (_, id) => db.deleteDictItem(id))

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
  if (process.platform !== 'darwin') app.quit()
})
