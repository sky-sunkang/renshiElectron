/**
 * 数据库表结构定义
 * 集中管理所有表的创建和字段兼容
 */

const { getDb } = require('../core')

// ==================== 部门表 ====================

/**
 * 初始化部门表结构
 */
function initDepartmentTables() {
  const db = getDb()

  // 创建部门表
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER DEFAULT 0,
      path_ids TEXT,
      path_names TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 兼容旧版字段
  try { db.run('ALTER TABLE departments ADD COLUMN parent_id INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN path_ids TEXT') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN path_names TEXT') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN updated_at INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE departments ADD COLUMN code TEXT') } catch (e) {}
}

// ==================== 员工表 ====================

/**
 * 初始化员工表结构
 */
function initEmployeeTables() {
  const db = getDb()

  // 创建员工表
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      email TEXT,
      department_id INTEGER,
      position TEXT,
      salary REAL,
      password TEXT,
      avatar TEXT,
      role_code TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 兼容旧版字段
  try { db.run('ALTER TABLE employees ADD COLUMN password TEXT') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN account TEXT') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN avatar TEXT') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN role_code TEXT') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE employees ADD COLUMN updated_at INTEGER') } catch (e) {}
}

// ==================== 字典表 ====================

/**
 * 初始化字典表结构
 */
function initDictTables() {
  const db = getDb()

  // 创建字典类型表
  db.run(`
    CREATE TABLE IF NOT EXISTS dict_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建字典项表
  db.run(`
    CREATE TABLE IF NOT EXISTS dict_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_code TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      sort INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 兼容旧版字段
  try { db.run('ALTER TABLE dict_types ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE dict_types ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE dict_types ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE dict_types ADD COLUMN updated_at INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE dict_items ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE dict_items ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE dict_items ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE dict_items ADD COLUMN updated_at INTEGER') } catch (e) {}
}

// ==================== 权限表 ====================

/**
 * 初始化权限表结构
 */
function initPermissionTables() {
  const db = getDb()

  // 创建角色表
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建权限表
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建角色权限关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_code TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(role_id, permission_code)
    )
  `)

  // 创建用户角色关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // 兼容旧版字段 - roles
  try { db.run('ALTER TABLE roles ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE roles ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE roles ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE roles ADD COLUMN updated_at INTEGER') } catch (e) {}

  // 兼容旧版字段 - permissions
  try { db.run('ALTER TABLE permissions ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE permissions ADD COLUMN created_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE permissions ADD COLUMN updated_by INTEGER') } catch (e) {}
  try { db.run('ALTER TABLE permissions ADD COLUMN updated_at INTEGER') } catch (e) {}

  // 兼容旧版字段 - role_permissions
  try { db.run('ALTER TABLE role_permissions ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE role_permissions ADD COLUMN created_by INTEGER') } catch (e) {}

  // 兼容旧版字段 - user_roles
  try { db.run('ALTER TABLE user_roles ADD COLUMN is_deleted INTEGER DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE user_roles ADD COLUMN created_by INTEGER') } catch (e) {}

  // 创建权限分配表（支持多维度授权：角色、个人、部门、部门及下级）
  db.run(`
    CREATE TABLE IF NOT EXISTS permission_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permission_code TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)
}

// ==================== 操作日志表 ====================

/**
 * 初始化操作日志表结构
 */
function initOperationLogTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      target_name TEXT,
      detail TEXT,
      ip TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)
}

// ==================== 公告表 ====================

/**
 * 初始化公告表结构
 */
function initAnnouncementTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'published',
      publisher_id INTEGER,
      publisher_name TEXT,
      publish_time INTEGER,
      expire_time INTEGER,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 合同表 ====================

/**
 * 初始化合同表结构
 */
function initContractTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      contract_no TEXT,
      contract_type TEXT DEFAULT 'labor',
      start_date INTEGER,
      end_date INTEGER,
      sign_date INTEGER,
      status TEXT DEFAULT 'active',
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 考勤表 ====================

/**
 * 初始化考勤表结构
 */
function initAttendanceTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT DEFAULT 'check_in',
      check_time INTEGER,
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 招聘管理表 ====================

/**
 * 初始化招聘管理表结构
 */
function initRecruitmentTables() {
  const db = getDb()

  // 创建岗位表
  db.run(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department_id INTEGER,
      department_name TEXT,
      salary_range TEXT,
      requirements TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      headcount INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建候选人表
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      resume TEXT,
      source TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建面试表
  db.run(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      interviewer_id INTEGER,
      interview_time INTEGER,
      location TEXT,
      round INTEGER DEFAULT 1,
      type TEXT DEFAULT 'onsite',
      status TEXT DEFAULT 'scheduled',
      result TEXT,
      feedback TEXT,
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 绩效考核表 ====================

/**
 * 初始化绩效考核表结构
 */
function initPerformanceTables() {
  const db = getDb()

  // 创建考核指标表
  db.run(`
    CREATE TABLE IF NOT EXISTS performance_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      max_score INTEGER DEFAULT 100,
      weight REAL DEFAULT 1,
      sort INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建考核记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      period TEXT,
      total_score REAL DEFAULT 0,
      level TEXT,
      remark TEXT,
      status TEXT DEFAULT 'pending',
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建考核评分明细表
  db.run(`
    CREATE TABLE IF NOT EXISTS assessment_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      indicator_id INTEGER NOT NULL,
      score REAL DEFAULT 0,
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 薪资管理表 ====================

/**
 * 初始化薪资管理表结构
 */
function initSalaryTables() {
  const db = getDb()

  // 创建工资条表
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      base_salary REAL DEFAULT 0,
      overtime_pay REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      allowance REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      insurance REAL DEFAULT 0,
      actual_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)

  // 创建调薪记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT DEFAULT 'raise',
      before_salary REAL DEFAULT 0,
      adjust_amount REAL DEFAULT 0,
      after_salary REAL DEFAULT 0,
      effective_date INTEGER,
      reason TEXT,
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 工作日历表 ====================

/**
 * 初始化工作日历表结构
 */
function initCalendarTables() {
  const db = getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS work_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      date_str TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'workday',
      name TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_by INTEGER,
      updated_at INTEGER
    )
  `)
}

// ==================== 统一初始化入口 ====================

/**
 * 初始化所有数据库表结构
 */
function initAllTables() {
  initDepartmentTables()
  initEmployeeTables()
  initDictTables()
  initPermissionTables()
  initOperationLogTables()
  initAnnouncementTables()
  initContractTables()
  initAttendanceTables()
  initRecruitmentTables()
  initPerformanceTables()
  initSalaryTables()
  initCalendarTables()

  console.log('[DB] all tables initialized')
}

module.exports = {
  initAllTables,
  initDepartmentTables,
  initEmployeeTables,
  initDictTables,
  initPermissionTables,
  initOperationLogTables,
  initAnnouncementTables,
  initContractTables,
  initAttendanceTables,
  initRecruitmentTables,
  initPerformanceTables,
  initSalaryTables,
  initCalendarTables
}
