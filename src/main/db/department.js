/**
 * 部门模块
 * 提供部门的增删改查及路径计算功能
 */

const { getDb, save } = require('./core')

/**
 * 获取所有部门路径并更新到数据库
 * 用于新增或编辑部门后重新计算全表路径
 */
function recalcAllDeptPaths() {
  const db = getDb()
  const all = getAllDepartments()
  all.forEach(d => {
    const ids = [d.id]
    const names = [d.name]
    let pid = d.parent_id || 0
    while (pid) {
      const parent = all.find(p => p.id == pid)
      if (!parent) break
      ids.unshift(parent.id)
      names.unshift(parent.name)
      pid = parent.parent_id || 0
    }
    const stmt = db.prepare('UPDATE departments SET path_ids = ?, path_names = ? WHERE id = ?')
    stmt.run([ids.join('/'), names.join('/'), d.id])
    stmt.free()
  })
  save()
}

/**
 * 新增部门
 * @param {string} name - 部门名称
 * @param {string} description - 部门描述
 * @param {number} parent_id - 上级部门ID
 * @returns {number} 新增部门的ID
 */
function addDepartment(name, description, parent_id) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO departments (name, description, parent_id) VALUES (?, ?, ?)')
  stmt.run([name, description, parent_id || 0])
  stmt.free()
  const idStmt = db.prepare('SELECT last_insert_rowid() as id')
  idStmt.step()
  const result = idStmt.getAsObject()
  idStmt.free()
  recalcAllDeptPaths()
  return result.id
}

/**
 * 获取所有部门列表
 * @returns {Array} 部门列表
 */
function getAllDepartments() {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments ORDER BY created_at DESC')
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 更新部门信息
 * @param {number} id - 部门ID
 * @param {string} name - 部门名称
 * @param {string} description - 部门描述
 * @param {number} parent_id - 上级部门ID
 * @returns {boolean} 更新成功返回true
 */
function updateDepartment(id, name, description, parent_id) {
  const db = getDb()
  const stmt = db.prepare('UPDATE departments SET name = ?, description = ?, parent_id = ? WHERE id = ?')
  stmt.run([name, description, parent_id || 0, id])
  stmt.free()
  recalcAllDeptPaths()
  return true
}

/**
 * 删除部门
 * @param {number} id - 部门ID
 * @returns {boolean} 删除成功返回true
 */
function deleteDepartment(id) {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM departments WHERE id = ?')
  stmt.run([id])
  stmt.free()
  save()
  return true
}

/**
 * 获取指定部门的子部门列表
 * @param {number} id - 部门ID
 * @returns {Array} 子部门列表
 */
function getChildDepartments(id) {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM departments WHERE parent_id = ?')
  stmt.bind([id])
  const items = []
  while (stmt.step()) { items.push(stmt.getAsObject()) }
  stmt.free()
  return items
}

/**
 * 初始化部门表结构和种子数据
 */
function initDepartmentTables() {
  const db = getDb()

  // 创建部门表
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id INTEGER DEFAULT 0,
      path_ids TEXT,
      path_names TEXT,
      created_at INTEGER DEFAULT (unixepoch())
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

  // 初始化种子数据
  const deptStmt = db.prepare('SELECT COUNT(*) as c FROM departments')
  deptStmt.step()
  const deptCount = deptStmt.getAsObject()
  deptStmt.free()
  if (Number(deptCount.c) === 0) {
    const stmt = db.prepare('INSERT INTO departments (name, description, parent_id) VALUES (?, ?, ?)')
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

  // 计算并存储所有部门路径
  recalcAllDeptPaths()
}

module.exports = {
  addDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getChildDepartments,
  recalcAllDeptPaths,
  initDepartmentTables
}