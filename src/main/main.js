const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const db = require('./db')

const createWindow = () => {
  const preloadPath = app.isPackaged
    ? path.join(__dirname, '../preload/preload.js')
    : path.join(__dirname, '../../src/preload/index.js')

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
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

  ipcMain.handle('db:addItem', (_, name, value) => db.addItem(name, value))
  ipcMain.handle('db:getAllItems', () => db.getAllItems())
  ipcMain.handle('db:getItemById', (_, id) => db.getItemById(id))
  ipcMain.handle('db:updateItem', (_, id, name, value) => db.updateItem(id, name, value))
  ipcMain.handle('db:deleteItem', (_, id) => db.deleteItem(id))

  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
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
