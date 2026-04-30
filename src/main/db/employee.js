/**
 * 员工模块
 * 提供员工的增删改查及登录认证功能
 */

const { getDb, save } = require('./core')
const { getUserPermissions, getUserRoles, isSuperAdmin } = require('./permission')

/**
 * 员工登录验证
 * @param {string} account - 账号
 * @param {string} password - 密码
 * @returns {Object|null} 登录成功返回用户信息（包含权限），失败返回null
 */
function login(account, password) {
  const db = getDb()
  console.log('[DB] login attempt:', account)
  const stmt = db.prepare('SELECT id, name, account, position FROM employees WHERE account = ? AND password = ?')
  stmt.bind([account, password])
  let user = null
  if (stmt.step()) {
    user = stmt.getAsObject()
    // 获取用户权限和角色信息
    user.permissions = getUserPermissions(user.id)
    user.roles = getUserRoles(user.id)
    user.isSuperAdmin = isSuperAdmin(user.id)
  }
  stmt.free()
  console.log('[DB] login result:', user)
  return user
}

/**
 * 新增员工
 * @param {Object} data - 员工数据
 * @returns {number} 新增员工的ID
 */
function addEmployee(data) {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  stmt.run([data.name, data.account, data.gender, data.age, data.phone, data.email, data.department_id, data.position, data.salary, data.password || '123456'])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  save()
  return result.id
}

/**
 * 获取所有员工列表（包含部门名称和头像）
 * @returns {Array} 员工列表
 */
function getAllEmployees() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.account, e.gender, e.age, e.phone, e.email, e.department_id, e.position, e.salary, e.created_at, e.avatar, d.name as department_name, d.path_names as department_path
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.created_at DESC
  `)
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 根据ID获取员工详情
 * @param {number} id - 员工ID
 * @returns {Object|null} 员工信息
 */
function getEmployeeById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.account, e.gender, e.age, e.phone, e.email, e.department_id, e.position, e.salary, e.created_at, d.name as department_name, d.path_names as department_path
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ?
  `)
  stmt.bind([id])
  let item = null
  if (stmt.step()) { item = stmt.getAsObject() }
  stmt.free()
  return item
}

/**
 * 更新员工信息
 * @param {number} id - 员工ID
 * @param {Object} data - 员工数据
 * @returns {boolean} 更新成功返回true
 */
function updateEmployee(id, data) {
  const db = getDb()
  const stmt = db.prepare(
    'UPDATE employees SET name = ?, account = ?, gender = ?, age = ?, phone = ?, email = ?, department_id = ?, position = ?, salary = ?, password = ? WHERE id = ?'
  )
  stmt.run([data.name, data.account, data.gender, data.age, data.phone, data.email, data.department_id, data.position, data.salary, data.password, id])
  stmt.free()
  save()
  return true
}

/**
 * 更新员工密码
 * @param {number} id - 员工ID
 * @param {string} password - 新密码
 * @returns {boolean} 更新成功返回true
 */
function updatePassword(id, password) {
  const db = getDb()
  const stmt = db.prepare('UPDATE employees SET password = ? WHERE id = ?')
  stmt.run([password, id])
  stmt.free()
  save()
  return true
}

/**
 * 删除员工
 * @param {number} id - 员工ID
 * @returns {boolean} 删除成功返回true
 */
function deleteEmployee(id) {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

/**
 * 初始化员工表结构和种子数据
 */
function initEmployeeTables() {
  const db = getDb()

  // 创建员工表
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account TEXT NOT NULL UNIQUE,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      email TEXT,
      department_id INTEGER,
      position TEXT,
      salary REAL,
      password TEXT,
      created_at INTEGER DEFAULT (unixepoch())
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

  // 初始化超级管理员
  const adminStmt = db.prepare("SELECT COUNT(*) as c FROM employees WHERE account = 'sysadmin'")
  adminStmt.step()
  const adminCount = Number(adminStmt.getAsObject().c)
  adminStmt.free()
  if (adminCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(['系统管理员', 'sysadmin', '男', 30, '', '', 1, '系统管理员', 0, '123456'])
    stmt.free()
    console.log('[DB] sysadmin seeded')
  }

  // 初始化其他员工种子数据
  const empCheckStmt = db.prepare("SELECT COUNT(*) as c FROM employees WHERE account != 'sysadmin'")
  empCheckStmt.step()
  const otherEmpCount = Number(empCheckStmt.getAsObject().c)
  empCheckStmt.free()
  if (otherEmpCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO employees (name, account, gender, age, phone, email, department_id, position, salary, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
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
    seedEmployees.forEach(emp => stmt.run(emp))
    stmt.free()
    console.log('[DB] employees seeded')
  }
}

/**
 * 生成默认头像（Base64格式的SVG）
 * @param {string} name - 员工姓名
 * @returns {string} Base64编码的SVG头像
 */
function generateDefaultAvatar(name) {
  // 提取姓氏（第一个字符）
  const surname = name ? name.charAt(0) : '员'
  // 生成随机颜色（根据名字哈希）
  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  const colorIndex = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0
  const bgColor = colors[colorIndex]

  // 创建SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}" rx="8"/>
      <text x="50" y="55" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${surname}</text>
    </svg>
  `
  // 转换为Base64
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * 更新员工头像
 * @param {number} id - 员工ID
 * @param {string} avatarBase64 - 头像Base64数据
 * @returns {boolean} 更新成功返回true
 */
function updateAvatar(id, avatarBase64) {
  const db = getDb()
  const stmt = db.prepare('UPDATE employees SET avatar = ? WHERE id = ?')
  stmt.run([avatarBase64, id])
  stmt.free()
  save()
  return true
}

/**
 * 获取员工头像
 * @param {number} id - 员工ID
 * @returns {string|null} 头像Base64数据，无头像返回null
 */
function getAvatar(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT avatar, name FROM employees WHERE id = ?')
  stmt.bind([id])
  let result = null
  if (stmt.step()) {
    const row = stmt.getAsObject()
    // 如果有头像数据则返回，否则生成默认头像
    result = row.avatar || generateDefaultAvatar(row.name)
  }
  stmt.free()
  return result
}

module.exports = {
  login,
  addEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  updatePassword,
  deleteEmployee,
  initEmployeeTables,
  updateAvatar,
  getAvatar,
  generateDefaultAvatar
}