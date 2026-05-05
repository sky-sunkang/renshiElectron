/**
 * Electron 主进程入口
 * 负责窗口管理、IPC 通信注册、数据库初始化
 */

const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const db = require('./db')

/**
 * 创建应用主窗口
 * 窗口大小为屏幕工作区的 80%，无边框（自定义标题栏）
 * @returns {BrowserWindow} 创建的窗口实例
 */
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
  ipcMain.handle('dept:add', (_, name, code, description, parent_id, operator) => db.addDepartment(name, code, description, parent_id, operator))
  ipcMain.handle('dept:getAll', () => db.getAllDepartments())
  ipcMain.handle('dept:update', (_, id, name, code, description, parent_id, operator) => db.updateDepartment(id, name, code, description, parent_id, operator))
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
  ipcMain.handle('stats:getLogStats', () => db.getLogStatistics())

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
  ipcMain.handle('db:updateTableData', (_, tableName, id, data, operator) => db.updateTableData(tableName, id, data, operator))
  ipcMain.handle('db:deleteTableData', (_, tableName, id, operator) => db.deleteTableData(tableName, id, operator))
  ipcMain.handle('db:executeSql', (_, sql, operator) => db.executeSql(sql, operator))
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
  ipcMain.handle('window:openDevTools', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.webContents.openDevTools()
  })

  // Announcements
  ipcMain.handle('announcement:getAll', (_, options) => db.getAnnouncements(options))
  ipcMain.handle('announcement:getById', (_, id) => db.getAnnouncementById(id))
  ipcMain.handle('announcement:add', (_, data, operator) => {
    console.log('[Main] 收到新增公告请求, 内容长度:', data?.content?.length)
    return db.addAnnouncement(data, operator)
  })
  ipcMain.handle('announcement:update', (_, id, data, operator) => db.updateAnnouncement(id, data, operator))
  ipcMain.handle('announcement:delete', (_, id, operator) => db.deleteAnnouncement(id, operator))
  ipcMain.handle('announcement:getActive', (_, limit) => db.getActiveAnnouncements(limit))

  // Contracts
  ipcMain.handle('contract:getAll', (_, options) => db.getContracts(options))
  ipcMain.handle('contract:getById', (_, id) => db.getContractById(id))
  ipcMain.handle('contract:add', (_, data, operator) => db.addContract(data, operator))
  ipcMain.handle('contract:update', (_, id, data, operator) => db.updateContract(id, data, operator))
  ipcMain.handle('contract:delete', (_, id, operator) => db.deleteContract(id, operator))
  ipcMain.handle('contract:getExpiring', (_, days) => db.getExpiringContracts(days))

  // Attendance
  ipcMain.handle('attendance:getAll', (_, options) => db.getAttendance(options))
  ipcMain.handle('attendance:add', (_, data, operator) => db.addAttendance(data, operator))
  ipcMain.handle('attendance:update', (_, id, data, operator) => db.updateAttendance(id, data, operator))
  ipcMain.handle('attendance:delete', (_, id, operator) => db.deleteAttendance(id, operator))
  ipcMain.handle('attendance:getToday', (_, employeeId) => db.getTodayAttendance(employeeId))
  ipcMain.handle('attendance:getStats', (_, employeeId, month) => db.getAttendanceStats(employeeId, month))

  // Recruitment - Positions
  ipcMain.handle('position:getAll', (_, options) => db.getPositions(options))
  ipcMain.handle('position:getById', (_, id) => db.getPositionById(id))
  ipcMain.handle('position:add', (_, data, operator) => db.addPosition(data, operator))
  ipcMain.handle('position:update', (_, id, data, operator) => db.updatePosition(id, data, operator))
  ipcMain.handle('position:delete', (_, id, operator) => db.deletePosition(id, operator))

  // Recruitment - Candidates
  ipcMain.handle('candidate:getAll', (_, options) => db.getCandidates(options))
  ipcMain.handle('candidate:getById', (_, id) => db.getCandidateById(id))
  ipcMain.handle('candidate:add', (_, data, operator) => db.addCandidate(data, operator))
  ipcMain.handle('candidate:update', (_, id, data, operator) => db.updateCandidate(id, data, operator))
  ipcMain.handle('candidate:delete', (_, id, operator) => db.deleteCandidate(id, operator))

  // Recruitment - Interviews
  ipcMain.handle('interview:getAll', (_, options) => db.getInterviews(options))
  ipcMain.handle('interview:add', (_, data, operator) => db.addInterview(data, operator))
  ipcMain.handle('interview:update', (_, id, data, operator) => db.updateInterview(id, data, operator))
  ipcMain.handle('interview:delete', (_, id, operator) => db.deleteInterview(id, operator))

  // Performance - Indicators
  ipcMain.handle('indicator:getAll', (_, options) => db.getIndicators(options))
  ipcMain.handle('indicator:getById', (_, id) => db.getIndicatorById(id))
  ipcMain.handle('indicator:add', (_, data, operator) => db.addIndicator(data, operator))
  ipcMain.handle('indicator:update', (_, id, data, operator) => db.updateIndicator(id, data, operator))
  ipcMain.handle('indicator:delete', (_, id, operator) => db.deleteIndicator(id, operator))

  // Performance - Assessments
  ipcMain.handle('assessment:getAll', (_, options) => db.getAssessments(options))
  ipcMain.handle('assessment:getById', (_, id) => db.getAssessmentById(id))
  ipcMain.handle('assessment:add', (_, data, operator) => db.addAssessment(data, operator))
  ipcMain.handle('assessment:update', (_, id, data, operator) => db.updateAssessment(id, data, operator))
  ipcMain.handle('assessment:delete', (_, id, operator) => db.deleteAssessment(id, operator))
  ipcMain.handle('assessment:getDetails', (_, assessmentId) => db.getAssessmentDetails(assessmentId))
  ipcMain.handle('assessment:saveDetails', (_, assessmentId, details, operator) => db.saveAssessmentDetails(assessmentId, details, operator))

  // Salary - Salary Sheets
  ipcMain.handle('salarySheet:getAll', (_, options) => db.getSalarySheets(options))
  ipcMain.handle('salarySheet:getById', (_, id) => db.getSalarySheetById(id))
  ipcMain.handle('salarySheet:add', (_, data, operator) => db.addSalarySheet(data, operator))
  ipcMain.handle('salarySheet:update', (_, id, data, operator) => db.updateSalarySheet(id, data, operator))
  ipcMain.handle('salarySheet:delete', (_, id, operator) => db.deleteSalarySheet(id, operator))
  ipcMain.handle('salarySheet:batchGenerate', (_, month, employeeIds, operator) => db.batchGenerateSalarySheets(month, employeeIds, operator))

  // Salary - Adjustments
  ipcMain.handle('salaryAdjustment:getAll', (_, options) => db.getSalaryAdjustments(options))
  ipcMain.handle('salaryAdjustment:getById', (_, id) => db.getSalaryAdjustmentById(id))
  ipcMain.handle('salaryAdjustment:add', (_, data, operator) => db.addSalaryAdjustment(data, operator))
  ipcMain.handle('salaryAdjustment:delete', (_, id, operator) => db.deleteSalaryAdjustment(id, operator))

  // Salary - Statistics
  ipcMain.handle('salaryStatistics:get', (_, options) => db.getSalaryStatistics(options))

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
