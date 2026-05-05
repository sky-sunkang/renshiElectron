/**
 * 数据库初始化脚本
 * 集中管理所有表结构创建和种子数据初始化
 */

const { getDb, save } = require('./core')
const { recalcAllDeptPaths } = require('./department')

// ==================== 种子数据定义 ====================

/**
 * 员工种子数据
 * 格式：[name, account, gender, age, phone, email, department_id, position, salary, password]
 */
const seedEmployees = [
  // 总公司
  ['张三', 'zhangsan', '男', 45, '13800000001', 'zhangsan@xx.com', 1, 'CEO', 50000, '123456'],
  ['李四', 'lisi', '女', 42, '13800000002', 'lisi@xx.com', 1, 'CTO', 45000, '123456'],
  ['王五', 'wangwu', '男', 40, '13800000003', 'wangwu@xx.com', 1, 'CFO', 45000, '123456'],
  // 技术部
  ['赵六', 'zhaoliu', '男', 38, '13800000004', 'zhaoliu@xx.com', 2, '技术总监', 35000, '123456'],
  ['孙七', 'sunqi', '女', 35, '13800000005', 'sunqi@xx.com', 2, '技术经理', 28000, '123456'],
  // 前端组
  ['周八', 'zhouba', '男', 28, '13800000006', 'zhouba@xx.com', 8, '前端工程师', 18000, '123456'],
  ['吴九', 'wujiu', '女', 26, '13800000007', 'wujiu@xx.com', 8, '前端工程师', 16000, '123456'],
  ['郑十', 'zhengshi', '男', 30, '13800000008', 'zhengshi@xx.com', 8, '前端组长', 22000, '123456'],
  // 后端组
  ['钱十一', 'qianshiyi', '男', 32, '13800000009', 'qianshiyi@xx.com', 9, '后端工程师', 20000, '123456'],
  ['冯十二', 'fengshier', '女', 29, '13800000010', 'fengshier@xx.com', 9, '后端工程师', 18000, '123456'],
  ['陈十三', 'chenshisan', '男', 33, '13800000011', 'chenshisan@xx.com', 9, '后端组长', 24000, '123456'],
  // 测试组
  ['褚十四', 'chushisi', '女', 27, '13800000012', 'chushisi@xx.com', 10, '测试工程师', 16000, '123456'],
  ['卫十五', 'weishiwu', '男', 31, '13800000013', 'weishiwu@xx.com', 10, '测试组长', 20000, '123456'],
  // 运维组
  ['蒋十六', 'jiangshiliu', '男', 34, '13800000014', 'jiangshiliu@xx.com', 11, '运维工程师', 19000, '123456'],
  ['沈十七', 'shenshiqi', '女', 30, '13800000015', 'shenshiqi@xx.com', 11, '运维组长', 22000, '123456'],
  // 市场部
  ['韩十八', 'hanbashi', '男', 36, '13800000016', 'hanbashi@xx.com', 3, '市场总监', 32000, '123456'],
  ['杨十九', 'yangshijiu', '女', 33, '13800000017', 'yangshijiu@xx.com', 3, '市场经理', 26000, '123456'],
  // 品牌推广组
  ['朱二十', 'zhuershi', '女', 28, '13800000018', 'zhuershi@xx.com', 12, '品牌专员', 15000, '123456'],
  ['秦二十一', 'qinershiyi', '男', 29, '13800000019', 'qinershiyi@xx.com', 12, '品牌组长', 19000, '123456'],
  // 销售组
  ['尤二十二', 'youershier', '男', 32, '13800000020', 'youershier@xx.com', 13, '销售代表', 15000, '123456'],
  ['许二十三', 'xuershisan', '女', 30, '13800000021', 'xuershisan@xx.com', 13, '销售代表', 15000, '123456'],
  ['何二十四', 'heershisi', '男', 35, '13800000022', 'heershisi@xx.com', 13, '销售组长', 20000, '123456'],
  // 客户支持组
  ['吕二十五', 'luershiwu', '女', 26, '13800000023', 'luershiwu@xx.com', 14, '客服专员', 12000, '123456'],
  ['施二十六', 'shiershiliu', '男', 28, '13800000024', 'shiershiliu@xx.com', 14, '客服组长', 16000, '123456'],
  // 人事部
  ['张二十七', 'zhangershiqi', '女', 38, '13800000025', 'zhangershiqi@xx.com', 4, '人事总监', 30000, '123456'],
  ['孔二十八', 'kongershiba', '男', 35, '13800000026', 'kongershiba@xx.com', 4, '人事经理', 25000, '123456'],
  // 招聘组
  ['曹二十九', 'caoershijiu', '女', 27, '13800000027', 'caoershijiu@xx.com', 15, '招聘专员', 14000, '123456'],
  ['严三十', 'yansanshi', '男', 30, '13800000028', 'yansanshi@xx.com', 15, '招聘组长', 18000, '123456'],
  // 培训组
  ['华三十一', 'huasanshiyi', '女', 29, '13800000029', 'huasanshiyi@xx.com', 16, '培训专员', 15000, '123456'],
  ['金三十二', 'jinsanshier', '男', 32, '13800000030', 'jinsanshier@xx.com', 16, '培训组长', 19000, '123456'],
  // 财务部
  ['魏三十三', 'weisanshisan', '女', 41, '13800000031', 'weisanshisan@xx.com', 5, '财务总监', 35000, '123456'],
  ['陶三十四', 'taosanshisi', '男', 38, '13800000032', 'taosanshisi@xx.com', 5, '财务经理', 28000, '123456'],
  // 会计组
  ['姜三十五', 'jiangsanshiwu', '女', 30, '13800000033', 'jiangsanshiwu@xx.com', 17, '会计专员', 16000, '123456'],
  ['戚三十六', 'qisanshiliu', '男', 33, '13800000034', 'qisanshiliu@xx.com', 17, '会计组长', 20000, '123456'],
  // 审计组
  ['谢三十七', 'xiesanshiqi', '女', 32, '13800000035', 'xiesanshiqi@xx.com', 18, '审计专员', 18000, '123456'],
  ['邹三十八', 'zousanshiba', '男', 35, '13800000036', 'zousanshiba@xx.com', 18, '审计组长', 22000, '123456'],
  // 运营部
  ['喻三十九', 'yusanshijiu', '男', 37, '13800000037', 'yusanshijiu@xx.com', 6, '运营总监', 32000, '123456'],
  ['柏四十', 'baisishi', '女', 34, '13800000038', 'baisishi@xx.com', 6, '运营经理', 26000, '123456'],
  // 产品组
  ['水四十一', 'shuisishiyi', '男', 31, '13800000039', 'shuisishiyi@xx.com', 19, '产品经理', 25000, '123456'],
  ['窦四十二', 'dousishier', '女', 29, '13800000040', 'dousishier@xx.com', 19, '产品专员', 18000, '123456'],
  // 数据组
  ['章四十三', 'zhangsishisan', '男', 30, '13800000041', 'zhangsishisan@xx.com', 20, '数据分析师', 22000, '123456'],
  ['云四十四', 'yunsishisi', '女', 28, '13800000042', 'yunsishisi@xx.com', 20, '数据专员', 17000, '123456'],
  // 行政部
  ['苏四十五', 'susishiwu', '女', 39, '13800000043', 'susishiwu@xx.com', 7, '行政总监', 28000, '123456'],
  ['潘四十六', 'pansishiliu', '男', 36, '13800000044', 'pansishiliu@xx.com', 7, '行政经理', 24000, '123456'],
  // 后勤组
  ['葛四十七', 'gesishiqi', '男', 33, '13800000045', 'gesishiqi@xx.com', 21, '后勤专员', 13000, '123456'],
  ['奚四十八', 'xisishiba', '女', 31, '13800000046', 'xisishiba@xx.com', 21, '后勤组长', 16000, '123456'],
]

/**
 * 从员工种子数据中提取不重复的职位列表
 * @returns {Array} 职位列表
 */
function extractPositionsFromEmployees() {
  const positionSet = new Set()
  seedEmployees.forEach(emp => {
    positionSet.add(emp[7]) // position 在索引 7
  })
  return Array.from(positionSet)
}

// ==================== 部门初始化 ====================

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
  try {
    db.run('ALTER TABLE departments ADD COLUMN parent_id INTEGER DEFAULT 0')
    console.log('[DB] departments.parent_id added')
  } catch (e) {
    // parent_id 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN path_ids TEXT')
    console.log('[DB] departments.path_ids added')
  } catch (e) {
    // path_ids 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN path_names TEXT')
    console.log('[DB] departments.path_names added')
  } catch (e) {
    // path_names 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] departments.is_deleted added')
  } catch (e) {
    // is_deleted 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN created_by INTEGER')
    console.log('[DB] departments.created_by added')
  } catch (e) {
    // created_by 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN updated_by INTEGER')
    console.log('[DB] departments.updated_by added')
  } catch (e) {
    // updated_by 列已存在
  }

  try {
    db.run('ALTER TABLE departments ADD COLUMN updated_at INTEGER')
    console.log('[DB] departments.updated_at added')
  } catch (e) {
    // updated_at 列已存在
  }

  // 添加部门编码字段
  try {
    db.run('ALTER TABLE departments ADD COLUMN code TEXT')
    console.log('[DB] departments.code added')
  } catch (e) {
    // code 列已存在
  }
}

/**
 * 初始化部门种子数据
 */
function initDepartmentSeedData() {
  const db = getDb()

  // 检查是否已有数据（排除已删除的）
  const deptStmt = db.prepare('SELECT COUNT(*) as c FROM departments WHERE is_deleted = 0')
  deptStmt.step()
  const deptCount = deptStmt.getAsObject()
  deptStmt.free()

  if (Number(deptCount.c) === 0) {
    const stmt = db.prepare('INSERT INTO departments (name, description, parent_id, is_deleted) VALUES (?, ?, ?, 0)')
    // 第一层：总公司
    stmt.run(['xx公司', '总公司', 0])
    // 第二层：一级部门
    stmt.run(['技术部', '负责产品研发与技术维护', 1])
    stmt.run(['市场部', '负责市场推广与客户拓展', 1])
    stmt.run(['人事部', '负责招聘与员工管理', 1])
    stmt.run(['财务部', '负责财务核算与资金管理', 1])
    stmt.run(['运营部', '负责产品运营与数据分析', 1])
    stmt.run(['行政部', '负责后勤与行政管理', 1])
    // 第三层：技术部
    stmt.run(['前端组', '负责前端开发', 2])
    stmt.run(['后端组', '负责后端开发', 2])
    stmt.run(['测试组', '负责产品质量测试', 2])
    stmt.run(['运维组', '负责系统运维', 2])
    // 第三层：市场部
    stmt.run(['品牌推广组', '负责品牌宣传', 3])
    stmt.run(['销售组', '负责客户销售', 3])
    stmt.run(['客户支持组', '负责客户服务', 3])
    // 第三层：人事部
    stmt.run(['招聘组', '负责人才招聘', 4])
    stmt.run(['培训组', '负责员工培训', 4])
    // 第三层：财务部
    stmt.run(['会计组', '负责财务核算', 5])
    stmt.run(['审计组', '负责内部审计', 5])
    // 第三层：运营部
    stmt.run(['产品组', '负责产品策划', 6])
    stmt.run(['数据组', '负责数据分析', 6])
    // 第三层：行政部
    stmt.run(['后勤组', '负责后勤保障', 7])
    stmt.free()
    console.log('[DB] departments seeded')
  }
}

// ==================== 员工初始化 ====================

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
  try {
    db.run('ALTER TABLE employees ADD COLUMN password TEXT')
    console.log('[DB] employees.password added')
  } catch (e) {
    // password 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN account TEXT')
    console.log('[DB] employees.account added')
  } catch (e) {
    // account 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN avatar TEXT')
    console.log('[DB] employees.avatar added')
  } catch (e) {
    // avatar 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN role_code TEXT')
    console.log('[DB] employees.role_code added')
  } catch (e) {
    // role_code 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] employees.is_deleted added')
  } catch (e) {
    // is_deleted 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN created_by INTEGER')
    console.log('[DB] employees.created_by added')
  } catch (e) {
    // created_by 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN updated_by INTEGER')
    console.log('[DB] employees.updated_by added')
  } catch (e) {
    // updated_by 列已存在
  }

  try {
    db.run('ALTER TABLE employees ADD COLUMN updated_at INTEGER')
    console.log('[DB] employees.updated_at added')
  } catch (e) {
    // updated_at 列已存在
  }
}

/**
 * 初始化员工种子数据
 */
function initEmployeeSeedData() {
  const db = getDb()

  // 初始化超级管理员（排除已删除的）
  const adminStmt = db.prepare("SELECT COUNT(*) as c FROM employees WHERE account = 'sysadmin' AND is_deleted = 0")
  adminStmt.step()
  const adminCount = Number(adminStmt.getAsObject().c)
  adminStmt.free()

  if (adminCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
    )
    stmt.run(['系统管理员', 'sysadmin', '男', 30, '', '', 1, '系统管理员', 0, '123456'])
    stmt.free()
    console.log('[DB] sysadmin seeded')
  }

  // 初始化其他员工种子数据（排除已删除的）
  const empCheckStmt = db.prepare("SELECT COUNT(*) as c FROM employees WHERE account != 'sysadmin' AND is_deleted = 0")
  empCheckStmt.step()
  const otherEmpCount = Number(empCheckStmt.getAsObject().c)
  empCheckStmt.free()

  if (otherEmpCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
    )
    seedEmployees.forEach(emp => stmt.run(emp))
    stmt.free()
    console.log('[DB] employees seeded')
  }
}

// ==================== 字典初始化 ====================

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
  try {
    db.run('ALTER TABLE dict_types ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] dict_types.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_types ADD COLUMN created_by INTEGER')
    console.log('[DB] dict_types.created_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_types ADD COLUMN updated_by INTEGER')
    console.log('[DB] dict_types.updated_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_types ADD COLUMN updated_at INTEGER')
    console.log('[DB] dict_types.updated_at added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_items ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] dict_items.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_items ADD COLUMN created_by INTEGER')
    console.log('[DB] dict_items.created_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_items ADD COLUMN updated_by INTEGER')
    console.log('[DB] dict_items.updated_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE dict_items ADD COLUMN updated_at INTEGER')
    console.log('[DB] dict_items.updated_at added')
  } catch (e) {}
}

/**
 * 初始化字典种子数据
 */
function initDictSeedData() {
  const db = getDb()

  // 初始化性别字典数据（排除已删除的）
  const typeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'gender' AND is_deleted = 0")
  typeCheckStmt.step()
  const typeCount = Number(typeCheckStmt.getAsObject().c)
  typeCheckStmt.free()

  if (typeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['gender', '性别', '员工性别选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['gender', '男', '男', 1])
    itemStmt.run(['gender', '女', '女', 2])
    itemStmt.free()
    console.log('[DB] gender dictionary seeded')
  }

  // 初始化职位字典数据（从员工种子数据中提取，排除已删除的）
  const positionCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'position' AND is_deleted = 0")
  positionCheckStmt.step()
  const positionCount = Number(positionCheckStmt.getAsObject().c)
  positionCheckStmt.free()

  if (positionCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['position', '职位', '员工职位选项'])
    typeStmt.free()

    // 从员工种子数据中提取职位
    const positions = extractPositionsFromEmployees()
    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    positions.forEach((position, index) => {
      itemStmt.run(['position', position, position, index + 1])
    })
    itemStmt.free()
    console.log('[DB] position dictionary seeded')
  }

  // 初始化合同类型字典
  const contractTypeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'contract_type' AND is_deleted = 0")
  contractTypeCheckStmt.step()
  const contractTypeCount = Number(contractTypeCheckStmt.getAsObject().c)
  contractTypeCheckStmt.free()

  if (contractTypeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['contract_type', '合同类型', '合同类型选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['contract_type', '劳动合同', 'labor', 1])
    itemStmt.run(['contract_type', '实习合同', 'intern', 2])
    itemStmt.run(['contract_type', '外包合同', 'outsource', 3])
    itemStmt.free()
    console.log('[DB] contract_type dictionary seeded')
  }

  // 初始化合同状态字典
  const contractStatusCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'contract_status' AND is_deleted = 0")
  contractStatusCheckStmt.step()
  const contractStatusCount = Number(contractStatusCheckStmt.getAsObject().c)
  contractStatusCheckStmt.free()

  if (contractStatusCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['contract_status', '合同状态', '合同状态选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['contract_status', '生效中', 'active', 1])
    itemStmt.run(['contract_status', '已过期', 'expired', 2])
    itemStmt.run(['contract_status', '已终止', 'terminated', 3])
    itemStmt.free()
    console.log('[DB] contract_status dictionary seeded')
  }

  // 初始化考勤类型字典
  const attendanceTypeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'attendance_type' AND is_deleted = 0")
  attendanceTypeCheckStmt.step()
  const attendanceTypeCount = Number(attendanceTypeCheckStmt.getAsObject().c)
  attendanceTypeCheckStmt.free()

  if (attendanceTypeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['attendance_type', '考勤类型', '考勤类型选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['attendance_type', '签到', 'check_in', 1])
    itemStmt.run(['attendance_type', '签退', 'check_out', 2])
    itemStmt.free()
    console.log('[DB] attendance_type dictionary seeded')
  }

  // 初始化岗位状态字典
  const positionStatusCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'position_status' AND is_deleted = 0")
  positionStatusCheckStmt.step()
  const positionStatusCount = Number(positionStatusCheckStmt.getAsObject().c)
  positionStatusCheckStmt.free()

  if (positionStatusCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['position_status', '岗位状态', '招聘岗位状态选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['position_status', '招聘中', 'open', 1])
    itemStmt.run(['position_status', '已关闭', 'closed', 2])
    itemStmt.run(['position_status', '已暂停', 'paused', 3])
    itemStmt.free()
    console.log('[DB] position_status dictionary seeded')
  }

  // 初始化候选人状态字典
  const candidateStatusCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'candidate_status' AND is_deleted = 0")
  candidateStatusCheckStmt.step()
  const candidateStatusCount = Number(candidateStatusCheckStmt.getAsObject().c)
  candidateStatusCheckStmt.free()

  if (candidateStatusCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['candidate_status', '候选人状态', '候选人状态选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['candidate_status', '待筛选', 'pending', 1])
    itemStmt.run(['candidate_status', '面试中', 'interviewing', 2])
    itemStmt.run(['candidate_status', '已通过', 'passed', 3])
    itemStmt.run(['candidate_status', '已拒绝', 'rejected', 4])
    itemStmt.run(['candidate_status', '已入职', 'hired', 5])
    itemStmt.free()
    console.log('[DB] candidate_status dictionary seeded')
  }

  // 初始化面试状态字典
  const interviewStatusCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'interview_status' AND is_deleted = 0")
  interviewStatusCheckStmt.step()
  const interviewStatusCount = Number(interviewStatusCheckStmt.getAsObject().c)
  interviewStatusCheckStmt.free()

  if (interviewStatusCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['interview_status', '面试状态', '面试状态选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['interview_status', '待面试', 'scheduled', 1])
    itemStmt.run(['interview_status', '进行中', 'ongoing', 2])
    itemStmt.run(['interview_status', '已完成', 'completed', 3])
    itemStmt.run(['interview_status', '已取消', 'cancelled', 4])
    itemStmt.free()
    console.log('[DB] interview_status dictionary seeded')
  }

  // 初始化面试类型字典
  const interviewTypeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'interview_type' AND is_deleted = 0")
  interviewTypeCheckStmt.step()
  const interviewTypeCount = Number(interviewTypeCheckStmt.getAsObject().c)
  interviewTypeCheckStmt.free()

  if (interviewTypeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['interview_type', '面试类型', '面试类型选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['interview_type', '现场面试', 'onsite', 1])
    itemStmt.run(['interview_type', '电话面试', 'phone', 2])
    itemStmt.run(['interview_type', '视频面试', 'video', 3])
    itemStmt.free()
    console.log('[DB] interview_type dictionary seeded')
  }

  // 初始化考核等级字典
  const assessmentLevelCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'assessment_level' AND is_deleted = 0")
  assessmentLevelCheckStmt.step()
  const assessmentLevelCount = Number(assessmentLevelCheckStmt.getAsObject().c)
  assessmentLevelCheckStmt.free()

  if (assessmentLevelCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['assessment_level', '考核等级', '绩效考核等级选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['assessment_level', '优秀', 'excellent', 1])
    itemStmt.run(['assessment_level', '良好', 'good', 2])
    itemStmt.run(['assessment_level', '合格', 'qualified', 3])
    itemStmt.run(['assessment_level', '待改进', 'improve', 4])
    itemStmt.run(['assessment_level', '不合格', 'unqualified', 5])
    itemStmt.free()
    console.log('[DB] assessment_level dictionary seeded')
  }

  // 初始化考核指标类别字典
  const indicatorCategoryCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'indicator_category' AND is_deleted = 0")
  indicatorCategoryCheckStmt.step()
  const indicatorCategoryCount = Number(indicatorCategoryCheckStmt.getAsObject().c)
  indicatorCategoryCheckStmt.free()

  if (indicatorCategoryCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['indicator_category', '指标类别', '考核指标类别选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['indicator_category', '工作业绩', 'performance', 1])
    itemStmt.run(['indicator_category', '工作态度', 'attitude', 2])
    itemStmt.run(['indicator_category', '工作能力', 'ability', 3])
    itemStmt.run(['indicator_category', '团队协作', 'teamwork', 4])
    itemStmt.free()
    console.log('[DB] indicator_category dictionary seeded')
  }

  // 初始化工资条状态字典
  const salarySheetStatusCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'salary_sheet_status' AND is_deleted = 0")
  salarySheetStatusCheckStmt.step()
  const salarySheetStatusCount = Number(salarySheetStatusCheckStmt.getAsObject().c)
  salarySheetStatusCheckStmt.free()

  if (salarySheetStatusCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['salary_sheet_status', '工资条状态', '工资条状态选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['salary_sheet_status', '草稿', 'draft', 1])
    itemStmt.run(['salary_sheet_status', '已发布', 'published', 2])
    itemStmt.run(['salary_sheet_status', '已发放', 'paid', 3])
    itemStmt.free()
    console.log('[DB] salary_sheet_status dictionary seeded')
  }

  // 初始化调薪类型字典
  const salaryAdjustTypeCheckStmt = db.prepare("SELECT COUNT(*) as c FROM dict_types WHERE code = 'salary_adjust_type' AND is_deleted = 0")
  salaryAdjustTypeCheckStmt.step()
  const salaryAdjustTypeCount = Number(salaryAdjustTypeCheckStmt.getAsObject().c)
  salaryAdjustTypeCheckStmt.free()

  if (salaryAdjustTypeCount === 0) {
    const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
    typeStmt.run(['salary_adjust_type', '调薪类型', '调薪类型选项'])
    typeStmt.free()

    const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
    itemStmt.run(['salary_adjust_type', '涨薪', 'raise', 1])
    itemStmt.run(['salary_adjust_type', '降薪', 'cut', 2])
    itemStmt.run(['salary_adjust_type', '转正调薪', 'regular', 3])
    itemStmt.run(['salary_adjust_type', '晋升调薪', 'promotion', 4])
    itemStmt.free()
    console.log('[DB] salary_adjust_type dictionary seeded')
  }
}

// ==================== 权限初始化 ====================

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
  try {
    db.run('ALTER TABLE roles ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] roles.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE roles ADD COLUMN created_by INTEGER')
    console.log('[DB] roles.created_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE roles ADD COLUMN updated_by INTEGER')
    console.log('[DB] roles.updated_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE roles ADD COLUMN updated_at INTEGER')
    console.log('[DB] roles.updated_at added')
  } catch (e) {}

  // 兼容旧版字段 - permissions
  try {
    db.run('ALTER TABLE permissions ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] permissions.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE permissions ADD COLUMN created_by INTEGER')
    console.log('[DB] permissions.created_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE permissions ADD COLUMN updated_by INTEGER')
    console.log('[DB] permissions.updated_by added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE permissions ADD COLUMN updated_at INTEGER')
    console.log('[DB] permissions.updated_at added')
  } catch (e) {}

  // 兼容旧版字段 - role_permissions
  try {
    db.run('ALTER TABLE role_permissions ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] role_permissions.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE role_permissions ADD COLUMN created_by INTEGER')
    console.log('[DB] role_permissions.created_by added')
  } catch (e) {}

  // 兼容旧版字段 - user_roles
  try {
    db.run('ALTER TABLE user_roles ADD COLUMN is_deleted INTEGER DEFAULT 0')
    console.log('[DB] user_roles.is_deleted added')
  } catch (e) {}

  try {
    db.run('ALTER TABLE user_roles ADD COLUMN created_by INTEGER')
    console.log('[DB] user_roles.created_by added')
  } catch (e) {}
}

/**
 * 初始化权限种子数据
 */
function initPermissionSeedData() {
  const db = getDb()

  // 初始化系统角色（排除已删除的）
  const roles = [
    { code: 'sysadmin', name: '超级管理员', description: '系统超级管理员，拥有所有权限', is_system: 1 },
    { code: 'admin', name: '管理员', description: '系统管理员，拥有大部分管理权限', is_system: 1 },
    { code: 'hr', name: '人事专员', description: '人事部门专员，管理员工信息', is_system: 1 },
    { code: 'user', name: '普通用户', description: '普通员工，只能查看', is_system: 1 }
  ]

  roles.forEach(role => {
    // 检查角色是否存在（包括已删除的）
    const checkStmt = db.prepare('SELECT id, is_deleted FROM roles WHERE code = ?')
    checkStmt.bind([role.code])
    const hasRow = checkStmt.step()
    const existing = hasRow ? checkStmt.getAsObject() : null
    checkStmt.free()

    if (!existing) {
      // 不存在，新增
      const stmt = db.prepare('INSERT INTO roles (code, name, description, is_system, is_deleted) VALUES (?, ?, ?, ?, 0)')
      stmt.run([role.code, role.name, role.description, role.is_system])
      stmt.free()
      console.log(`[DB] role ${role.code} seeded`)
    } else if (existing.is_deleted === 1) {
      // 已存在但被删除，恢复它
      const stmt = db.prepare('UPDATE roles SET is_deleted = 0, name = ?, description = ? WHERE id = ?')
      stmt.run([role.name, role.description, existing.id])
      stmt.free()
      console.log(`[DB] role ${role.code} restored`)
    }
    // 已存在且未删除，无需操作
  })

  // 初始化系统权限
  const permissions = [
    // 菜单权限
    { code: 'menu:employee', name: '员工管理菜单', type: 'menu', description: '访问员工管理页面' },
    { code: 'menu:department', name: '部门管理菜单', type: 'menu', description: '访问部门管理页面' },
    { code: 'menu:statistics', name: '统计管理菜单', type: 'menu', description: '访问统计管理页面' },
    { code: 'menu:statistics:employee', name: '员工统计菜单', type: 'menu', description: '访问员工统计页面' },
    { code: 'menu:statistics:log', name: '操作统计菜单', type: 'menu', description: '访问操作统计页面' },
    { code: 'menu:system', name: '系统管理菜单', type: 'menu', description: '访问系统管理页面' },
    { code: 'menu:dictionary', name: '字典管理菜单', type: 'menu', description: '访问字典管理页面' },
    { code: 'menu:role', name: '角色管理菜单', type: 'menu', description: '访问角色管理页面' },
    { code: 'menu:permission', name: '权限管理菜单', type: 'menu', description: '访问权限管理页面' },
    { code: 'menu:log', name: '操作日志菜单', type: 'menu', description: '访问操作日志页面' },
    { code: 'menu:database', name: '数据库管理菜单', type: 'menu', description: '访问数据库管理页面' },
    { code: 'menu:announcement', name: '公告管理菜单', type: 'menu', description: '访问公告管理页面' },
    { code: 'menu:import-export', name: '数据导入导出菜单', type: 'menu', description: '访问数据导入导出页面' },
    // 员工管理按钮权限
    { code: 'emp:add', name: '新增员工', type: 'button', description: '新增员工按钮' },
    { code: 'emp:edit', name: '编辑员工', type: 'button', description: '编辑员工按钮' },
    { code: 'emp:delete', name: '删除员工', type: 'button', description: '删除员工按钮' },
    { code: 'emp:batchDelete', name: '批量删除员工', type: 'button', description: '批量删除员工按钮' },
    { code: 'emp:export', name: '导出员工', type: 'button', description: '导出员工数据按钮' },
    { code: 'emp:import', name: '导入员工', type: 'button', description: '导入员工数据按钮' },
    // 部门管理按钮权限
    { code: 'dept:add', name: '新增部门', type: 'button', description: '新增部门按钮' },
    { code: 'dept:edit', name: '编辑部门', type: 'button', description: '编辑部门按钮' },
    { code: 'dept:delete', name: '删除部门', type: 'button', description: '删除部门按钮' },
    { code: 'dept:export', name: '导出部门', type: 'button', description: '导出部门数据按钮' },
    // 字典管理按钮权限
    { code: 'dict:add', name: '新增字典', type: 'button', description: '新增字典类型按钮' },
    { code: 'dict:edit', name: '编辑字典', type: 'button', description: '编辑字典类型按钮' },
    { code: 'dict:delete', name: '删除字典', type: 'button', description: '删除字典类型按钮' },
    { code: 'dict:item:add', name: '新增字典项', type: 'button', description: '新增字典项按钮' },
    { code: 'dict:item:edit', name: '编辑字典项', type: 'button', description: '编辑字典项按钮' },
    { code: 'dict:item:delete', name: '删除字典项', type: 'button', description: '删除字典项按钮' },
    // 角色管理按钮权限
    { code: 'role:add', name: '新增角色', type: 'button', description: '新增角色按钮' },
    { code: 'role:edit', name: '编辑角色', type: 'button', description: '编辑角色按钮' },
    { code: 'role:delete', name: '删除角色', type: 'button', description: '删除角色按钮' },
    { code: 'role:assignUser', name: '分配用户', type: 'button', description: '为用户分配角色按钮' },
    // 权限管理按钮权限
    { code: 'permission:assign', name: '分配权限', type: 'button', description: '分配角色权限按钮' },
    // 数据库管理按钮权限
    { code: 'db:query', name: '执行SQL', type: 'button', description: '执行SQL查询按钮' },
    { code: 'db:export', name: '导出数据', type: 'button', description: '导出数据库数据按钮' },
    { code: 'db:edit', name: '编辑数据', type: 'button', description: '编辑表数据按钮' },
    { code: 'db:delete', name: '删除数据', type: 'button', description: '删除表数据按钮' },
    // 公告管理按钮权限
    { code: 'announcement:add', name: '发布公告', type: 'button', description: '发布公告按钮' },
    { code: 'announcement:edit', name: '编辑公告', type: 'button', description: '编辑公告按钮' },
    { code: 'announcement:delete', name: '删除公告', type: 'button', description: '删除公告按钮' },
    // 数据导入导出按钮权限
    { code: 'import-export:emp:import', name: '导入员工', type: 'button', description: '导入员工数据按钮' },
    { code: 'import-export:emp:export', name: '导出员工', type: 'button', description: '导出员工数据按钮' },
    { code: 'import-export:log:export', name: '导出日志', type: 'button', description: '导出操作日志按钮' },
    // 合同管理菜单权限
    { code: 'menu:contract', name: '合同管理菜单', type: 'menu', description: '访问合同管理页面' },
    // 合同管理按钮权限
    { code: 'contract:add', name: '新增合同', type: 'button', description: '新增合同按钮' },
    { code: 'contract:edit', name: '编辑合同', type: 'button', description: '编辑合同按钮' },
    { code: 'contract:delete', name: '删除合同', type: 'button', description: '删除合同按钮' },
    { code: 'contract:export', name: '导出合同', type: 'button', description: '导出合同数据按钮' },
    // 考勤管理菜单权限
    { code: 'menu:attendance', name: '考勤管理菜单', type: 'menu', description: '访问考勤管理页面' },
    // 考勤管理按钮权限
    { code: 'attendance:check', name: '打卡', type: 'button', description: '签到签退按钮' },
    { code: 'attendance:edit', name: '编辑考勤', type: 'button', description: '编辑考勤记录按钮' },
    { code: 'attendance:delete', name: '删除考勤', type: 'button', description: '删除考勤记录按钮' },
    { code: 'attendance:export', name: '导出考勤', type: 'button', description: '导出考勤数据按钮' },
    // 招聘管理菜单权限
    { code: 'menu:recruitment', name: '招聘管理菜单', type: 'menu', description: '访问招聘管理页面' },
    // 招聘管理按钮权限
    { code: 'position:add', name: '新增岗位', type: 'button', description: '新增招聘岗位按钮' },
    { code: 'position:edit', name: '编辑岗位', type: 'button', description: '编辑招聘岗位按钮' },
    { code: 'position:delete', name: '删除岗位', type: 'button', description: '删除招聘岗位按钮' },
    { code: 'candidate:add', name: '新增候选人', type: 'button', description: '新增候选人按钮' },
    { code: 'candidate:edit', name: '编辑候选人', type: 'button', description: '编辑候选人按钮' },
    { code: 'candidate:delete', name: '删除候选人', type: 'button', description: '删除候选人按钮' },
    { code: 'interview:add', name: '安排面试', type: 'button', description: '安排面试按钮' },
    { code: 'interview:edit', name: '编辑面试', type: 'button', description: '编辑面试按钮' },
    { code: 'interview:delete', name: '删除面试', type: 'button', description: '删除面试按钮' },
    // 绩效考核菜单权限
    { code: 'menu:performance', name: '绩效考核菜单', type: 'menu', description: '访问绩效考核页面' },
    // 绩效考核按钮权限
    { code: 'indicator:add', name: '新增指标', type: 'button', description: '新增考核指标按钮' },
    { code: 'indicator:edit', name: '编辑指标', type: 'button', description: '编辑考核指标按钮' },
    { code: 'indicator:delete', name: '删除指标', type: 'button', description: '删除考核指标按钮' },
    { code: 'assessment:add', name: '新增考核', type: 'button', description: '新增考核记录按钮' },
    { code: 'assessment:edit', name: '编辑考核', type: 'button', description: '编辑考核记录按钮' },
    { code: 'assessment:delete', name: '删除考核', type: 'button', description: '删除考核记录按钮' },
    { code: 'assessment:score', name: '评分', type: 'button', description: '考核评分按钮' },
    // 薪资管理菜单权限
    { code: 'menu:salary', name: '薪资管理菜单', type: 'menu', description: '访问薪资管理页面' },
    // 薪资管理按钮权限
    { code: 'salary:add', name: '新增工资条', type: 'button', description: '新增工资条按钮' },
    { code: 'salary:edit', name: '编辑工资条', type: 'button', description: '编辑工资条按钮' },
    { code: 'salary:delete', name: '删除工资条', type: 'button', description: '删除工资条按钮' },
    { code: 'salary:generate', name: '批量生成', type: 'button', description: '批量生成工资条按钮' },
    { code: 'salary:export', name: '导出工资条', type: 'button', description: '导出工资条数据按钮' },
    { code: 'adjustment:add', name: '新增调薪', type: 'button', description: '新增调薪记录按钮' },
    { code: 'adjustment:delete', name: '删除调薪', type: 'button', description: '删除调薪记录按钮' }
  ]

  // 使用 INSERT OR IGNORE 防止重复插入（code字段有UNIQUE约束）
  // 先确保permissions表有UNIQUE约束
  try {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)')
  } catch (e) {
    // 索引已存在
  }

  const permStmt = db.prepare('INSERT OR IGNORE INTO permissions (code, name, type, description, is_deleted) VALUES (?, ?, ?, ?, 0)')
  permissions.forEach(p => permStmt.run([p.code, p.name, p.type, p.description]))
  permStmt.free()
  console.log('[DB] permissions initialized')

  // 分配权限给角色
  assignPermissionsToRoles()

  // 初始化超级管理员角色关联
  initSuperAdminRole()

  console.log('[DB] permission tables initialized')
}

/**
 * 分配权限给角色
 */
function assignPermissionsToRoles() {
  const db = getDb()

  // 获取角色ID
  const getRoleId = (code) => {
    const stmt = db.prepare('SELECT id FROM roles WHERE code = ? AND is_deleted = 0')
    stmt.bind([code])
    let id = null
    if (stmt.step()) id = stmt.getAsObject().id
    stmt.free()
    return id
  }

  const sysadminId = getRoleId('sysadmin')
  const adminId = getRoleId('admin')
  const hrId = getRoleId('hr')
  const userId = getRoleId('user')

  if (!sysadminId || !adminId || !hrId || !userId) return

  // 检查是否已有权限分配（排除已删除的）
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM role_permissions WHERE is_deleted = 0')
  checkStmt.step()
  const count = Number(checkStmt.getAsObject().c)
  checkStmt.free()

  if (count > 0) {
    console.log('[DB] role_permissions already initialized, skip')
    // 但仍需为超级管理员补充新权限
    syncSuperAdminPermissions(sysadminId)
    return
  }

  // 超级管理员拥有所有权限
  const allPermissions = db.prepare('SELECT code FROM permissions')
  const sysadminStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  while (allPermissions.step()) {
    const code = allPermissions.getAsObject().code
    sysadminStmt.run([sysadminId, code])
  }
  allPermissions.free()
  sysadminStmt.free()

  // 管理员权限（除角色管理和数据库管理外）
  const adminPermissions = [
    'menu:employee', 'menu:department', 'menu:statistics', 'menu:statistics:employee', 'menu:statistics:log', 'menu:system', 'menu:dictionary',
    'menu:contract', 'menu:attendance', 'menu:announcement', 'menu:import-export', 'menu:recruitment', 'menu:performance', 'menu:salary',
    'emp:add', 'emp:edit', 'emp:delete', 'emp:batchDelete', 'emp:export', 'emp:import',
    'dept:add', 'dept:edit', 'dept:delete', 'dept:export',
    'dict:add', 'dict:edit', 'dict:delete', 'dict:item:add', 'dict:item:edit', 'dict:item:delete',
    'contract:add', 'contract:edit', 'contract:delete', 'contract:export',
    'attendance:check', 'attendance:edit', 'attendance:delete', 'attendance:export',
    'announcement:add', 'announcement:edit', 'announcement:delete',
    'import-export:emp:import', 'import-export:emp:export', 'import-export:log:export',
    'position:add', 'position:edit', 'position:delete',
    'candidate:add', 'candidate:edit', 'candidate:delete',
    'interview:add', 'interview:edit', 'interview:delete',
    'indicator:add', 'indicator:edit', 'indicator:delete',
    'assessment:add', 'assessment:edit', 'assessment:delete', 'assessment:score',
    'salary:add', 'salary:edit', 'salary:delete', 'salary:generate', 'salary:export',
    'adjustment:add', 'adjustment:delete'
  ]
  const adminStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  adminPermissions.forEach(code => adminStmt.run([adminId, code]))
  adminStmt.free()

  // 人事专员权限
  const hrPermissions = [
    'menu:employee', 'menu:department', 'menu:statistics', 'menu:statistics:employee', 'menu:statistics:log', 'menu:system', 'menu:log',
    'menu:contract', 'menu:attendance', 'menu:announcement', 'menu:import-export', 'menu:recruitment', 'menu:performance', 'menu:salary',
    'emp:add', 'emp:edit', 'emp:export', 'emp:import',
    'dept:add', 'dept:edit',
    'contract:add', 'contract:edit', 'contract:export',
    'attendance:check', 'attendance:edit', 'attendance:export',
    'announcement:add', 'announcement:edit', 'announcement:delete',
    'import-export:emp:import', 'import-export:emp:export', 'import-export:log:export',
    'position:add', 'position:edit',
    'candidate:add', 'candidate:edit',
    'interview:add', 'interview:edit',
    'indicator:add', 'indicator:edit',
    'assessment:add', 'assessment:edit', 'assessment:score',
    'salary:add', 'salary:edit', 'salary:generate', 'salary:export',
    'adjustment:add'
  ]
  const hrStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  hrPermissions.forEach(code => hrStmt.run([hrId, code]))
  hrStmt.free()

  // 普通用户权限（仅查看和打卡）
  const userPermissions = [
    'menu:employee', 'menu:department', 'menu:statistics', 'menu:statistics:employee', 'menu:statistics:log',
    'menu:attendance', 'menu:announcement',
    'attendance:check'
  ]
  const userStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  userPermissions.forEach(code => userStmt.run([userId, code]))
  userStmt.free()
}

/**
 * 同步超级管理员权限（确保拥有所有权限）
 * @param {number} sysadminId - 超级管理员角色ID
 */
function syncSuperAdminPermissions(sysadminId) {
  const db = getDb()

  // 获取超级管理员已有的权限
  const existingStmt = db.prepare('SELECT permission_code FROM role_permissions WHERE role_id = ? AND is_deleted = 0')
  existingStmt.bind([sysadminId])
  const existingPermissions = new Set()
  while (existingStmt.step()) {
    existingPermissions.add(existingStmt.getAsObject().permission_code)
  }
  existingStmt.free()

  // 获取所有权限
  const allStmt = db.prepare('SELECT code FROM permissions WHERE is_deleted = 0')
  const newPermissions = []
  while (allStmt.step()) {
    const code = allStmt.getAsObject().code
    if (!existingPermissions.has(code)) {
      newPermissions.push(code)
    }
  }
  allStmt.free()

  // 添加缺失的权限
  if (newPermissions.length > 0) {
    const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code, is_deleted) VALUES (?, ?, 0)')
    newPermissions.forEach(code => insertStmt.run([sysadminId, code]))
    insertStmt.free()
    save()
    console.log(`[DB] synced ${newPermissions.length} new permissions to sysadmin`)
  }
}

/**
 * 初始化超级管理员角色关联
 */
function initSuperAdminRole() {
  const db = getDb()

  // 获取超级管理员角色ID
  const roleStmt = db.prepare("SELECT id FROM roles WHERE code = 'sysadmin' AND is_deleted = 0")
  const roleHasRow = roleStmt.step()
  const roleObj = roleHasRow ? roleStmt.getAsObject() : null
  const sysadminRoleId = roleObj?.id
  roleStmt.free()

  // 获取超级管理员用户ID
  const userStmt = db.prepare("SELECT id FROM employees WHERE account = 'sysadmin' AND is_deleted = 0")
  const userHasRow = userStmt.step()
  const userObj = userHasRow ? userStmt.getAsObject() : null
  const userId = userObj?.id
  userStmt.free()

  if (userId && sysadminRoleId) {
    // 检查是否已分配角色（包括已删除的）
    const checkStmt = db.prepare('SELECT id, is_deleted FROM user_roles WHERE user_id = ? AND role_id = ?')
    checkStmt.bind([userId, sysadminRoleId])
    const checkHasRow = checkStmt.step()
    const existing = checkHasRow ? checkStmt.getAsObject() : null
    checkStmt.free()

    if (!existing) {
      // 不存在，新增
      const assignStmt = db.prepare('INSERT INTO user_roles (user_id, role_id, is_deleted) VALUES (?, ?, 0)')
      assignStmt.run([userId, sysadminRoleId])
      assignStmt.free()

      // 更新用户角色代码
      const updateStmt = db.prepare("UPDATE employees SET role_code = 'sysadmin' WHERE id = ?")
      updateStmt.run([userId])
      updateStmt.free()

      console.log('[DB] sysadmin role assigned')
    } else if (existing.is_deleted === 1) {
      // 已存在但被删除，恢复它
      const restoreStmt = db.prepare('UPDATE user_roles SET is_deleted = 0 WHERE id = ?')
      restoreStmt.run([existing.id])
      restoreStmt.free()

      // 更新用户角色代码
      const updateStmt = db.prepare("UPDATE employees SET role_code = 'sysadmin' WHERE id = ?")
      updateStmt.run([userId])
      updateStmt.free()

      console.log('[DB] sysadmin role restored')
    }
    // 已存在且未删除，无需操作
  }
}

/**
 * 为每个角色初始化默认用户
 * 从现有员工种子数据中选择用户分配角色
 */
function initDefaultUsersForRoles() {
  const db = getDb()

  // 定义每个角色对应的员工账号（从 seedEmployees 中选择）
  const roleUserMapping = [
    { account: 'sysadmin', roleCode: 'sysadmin' },  // 系统管理员 -> 超级管理员
    { account: 'zhaoliu', roleCode: 'admin' },       // 赵六（技术总监） -> 管理员
    { account: 'zhangershiqi', roleCode: 'hr' },     // 张二十七（人事总监） -> 人事专员
    { account: 'zhouba', roleCode: 'user' }          // 周八（前端工程师） -> 普通用户
  ]

  roleUserMapping.forEach(mapping => {
    // 获取用户ID
    const userStmt = db.prepare('SELECT id FROM employees WHERE account = ? AND is_deleted = 0')
    userStmt.bind([mapping.account])
    const userHasRow = userStmt.step()
    const userObj = userHasRow ? userStmt.getAsObject() : null
    const userId = userObj?.id
    userStmt.free()

    // 获取角色ID
    const roleStmt = db.prepare('SELECT id FROM roles WHERE code = ? AND is_deleted = 0')
    roleStmt.bind([mapping.roleCode])
    const roleHasRow = roleStmt.step()
    const roleObj = roleHasRow ? roleStmt.getAsObject() : null
    const roleId = roleObj?.id
    roleStmt.free()

    if (userId && roleId) {
      // 检查该用户是否已有此角色（包括已删除的）
      const checkStmt = db.prepare('SELECT id, is_deleted FROM user_roles WHERE user_id = ? AND role_id = ?')
      checkStmt.bind([userId, roleId])
      const checkHasRow = checkStmt.step()
      const existing = checkHasRow ? checkStmt.getAsObject() : null
      checkStmt.free()

      if (!existing) {
        // 不存在，新增
        const assignStmt = db.prepare('INSERT INTO user_roles (user_id, role_id, is_deleted) VALUES (?, ?, 0)')
        assignStmt.run([userId, roleId])
        assignStmt.free()
        console.log(`[DB] ${mapping.account} assigned role ${mapping.roleCode}`)
      } else if (existing.is_deleted === 1) {
        // 已存在但被删除，恢复它
        const restoreStmt = db.prepare('UPDATE user_roles SET is_deleted = 0 WHERE id = ?')
        restoreStmt.run([existing.id])
        restoreStmt.free()
        console.log(`[DB] ${mapping.account} role ${mapping.roleCode} restored`)
      }
      // 已存在且未删除，无需操作
    } else {
      console.log(`[DB] WARNING: user ${mapping.account} or role ${mapping.roleCode} not found`)
    }
  })
}

// ==================== 操作日志初始化 ====================

/**
 * 初始化操作日志表结构
 */
function initOperationLogTables() {
  const db = getDb()

  // 创建操作日志表
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

  console.log('[DB] operation_logs table initialized')
}

/**
 * 初始化公告表结构
 */
function initAnnouncementTables() {
  const db = getDb()

  // 创建公告表
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

  console.log('[DB] announcements table initialized')
}

/**
 * 初始化合同表结构
 */
function initContractTables() {
  const db = getDb()

  // 创建合同表
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

  console.log('[DB] contracts table initialized')
}

/**
 * 初始化考勤表结构
 */
function initAttendanceTables() {
  const db = getDb()

  // 创建考勤表
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

  console.log('[DB] attendance table initialized')
}

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

  console.log('[DB] recruitment tables initialized')
}

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

  console.log('[DB] performance tables initialized')
}

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

  console.log('[DB] salary tables initialized')
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
}

/**
 * 初始化所有种子数据
 */
function initAllSeedData() {
  initDepartmentSeedData()
  initEmployeeSeedData()
  initDictSeedData()
  initPermissionSeedData()
  initDefaultUsersForRoles()
}

/**
 * 数据库完整初始化
 * 创建表结构、初始化种子数据、保存数据库
 */
function initDatabase() {
  // 初始化所有表结构
  initAllTables()

  // 初始化所有种子数据
  initAllSeedData()

  // 计算并存储所有部门路径
  recalcAllDeptPaths()

  // 保存数据库
  save()

  console.log('[DB] init done')
}

module.exports = {
  initDatabase,
  initAllTables,
  initAllSeedData
}
