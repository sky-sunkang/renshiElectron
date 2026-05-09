/**
 * 数据库种子数据初始化
 * 集中管理所有种子数据的初始化
 */

const { getDb, save } = require('../core')
const { recalcAllDeptPaths } = require('../department')

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
  seedEmployees.forEach(emp => positionSet.add(emp[7]))
  return Array.from(positionSet)
}

// ==================== 部门种子数据 ====================

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
    const stmt = db.prepare('INSERT INTO departments (name, code, description, parent_id, is_deleted) VALUES (?, ?, ?, ?, 0)')
    // 第一层：总公司
    stmt.run(['xx公司', 'HQ', '总公司', 0])
    // 第二层：一级部门
    stmt.run(['技术部', 'TECH', '负责产品研发与技术维护', 1])
    stmt.run(['市场部', 'MARKET', '负责市场推广与客户拓展', 1])
    stmt.run(['人事部', 'HR', '负责招聘与员工管理', 1])
    stmt.run(['财务部', 'FIN', '负责财务核算与资金管理', 1])
    stmt.run(['运营部', 'OPS', '负责产品运营与数据分析', 1])
    stmt.run(['行政部', 'ADMIN', '负责后勤与行政管理', 1])
    // 第三层：技术部
    stmt.run(['前端组', 'TECH-FE', '负责前端开发', 2])
    stmt.run(['后端组', 'TECH-BE', '负责后端开发', 2])
    stmt.run(['测试组', 'TECH-QA', '负责产品质量测试', 2])
    stmt.run(['运维组', 'TECH-OPS', '负责系统运维', 2])
    // 第三层：市场部
    stmt.run(['品牌推广组', 'MARKET-BRAND', '负责品牌宣传', 3])
    stmt.run(['销售组', 'MARKET-SALES', '负责客户销售', 3])
    stmt.run(['客户支持组', 'MARKET-CS', '负责客户服务', 3])
    // 第三层：人事部
    stmt.run(['招聘组', 'HR-REC', '负责人才招聘', 4])
    stmt.run(['培训组', 'HR-TRAIN', '负责员工培训', 4])
    // 第三层：财务部
    stmt.run(['会计组', 'FIN-ACC', '负责财务核算', 5])
    stmt.run(['审计组', 'FIN-AUD', '负责内部审计', 5])
    // 第三层：运营部
    stmt.run(['产品组', 'OPS-PROD', '负责产品策划', 6])
    stmt.run(['数据组', 'OPS-DATA', '负责数据分析', 6])
    // 第三层：行政部
    stmt.run(['后勤组', 'ADMIN-SUP', '负责后勤保障', 7])
    stmt.free()
    console.log('[DB] departments seeded')
  }
}

// ==================== 员工种子数据 ====================

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

// ==================== 字典种子数据 ====================

/**
 * 初始化字典种子数据
 */
function initDictSeedData() {
  const db = getDb()

  // 字典类型和字典项定义
  const dictData = [
    {
      type: { code: 'gender', name: '性别', description: '员工性别选项' },
      items: [['男', '男', 1], ['女', '女', 2]]
    },
    {
      type: { code: 'position', name: '职位', description: '员工职位选项' },
      items: extractPositionsFromEmployees().map((pos, idx) => [pos, pos, idx + 1])
    },
    {
      type: { code: 'contract_type', name: '合同类型', description: '合同类型选项' },
      items: [['劳动合同', 'labor', 1], ['实习合同', 'intern', 2], ['外包合同', 'outsource', 3]]
    },
    {
      type: { code: 'contract_status', name: '合同状态', description: '合同状态选项' },
      items: [['生效中', 'active', 1], ['已过期', 'expired', 2], ['已终止', 'terminated', 3]]
    },
    {
      type: { code: 'attendance_type', name: '考勤类型', description: '考勤类型选项' },
      items: [['签到', 'check_in', 1], ['签退', 'check_out', 2]]
    },
    {
      type: { code: 'position_status', name: '岗位状态', description: '招聘岗位状态选项' },
      items: [['招聘中', 'open', 1], ['已关闭', 'closed', 2], ['已暂停', 'paused', 3]]
    },
    {
      type: { code: 'candidate_status', name: '候选人状态', description: '候选人状态选项' },
      items: [['待筛选', 'pending', 1], ['面试中', 'interviewing', 2], ['已通过', 'passed', 3], ['已拒绝', 'rejected', 4], ['已入职', 'hired', 5]]
    },
    {
      type: { code: 'interview_status', name: '面试状态', description: '面试状态选项' },
      items: [['待面试', 'scheduled', 1], ['进行中', 'ongoing', 2], ['已完成', 'completed', 3], ['已取消', 'cancelled', 4]]
    },
    {
      type: { code: 'interview_type', name: '面试类型', description: '面试类型选项' },
      items: [['现场面试', 'onsite', 1], ['电话面试', 'phone', 2], ['视频面试', 'video', 3]]
    },
    {
      type: { code: 'assessment_level', name: '考核等级', description: '绩效考核等级选项' },
      items: [['优秀', 'excellent', 1], ['良好', 'good', 2], ['合格', 'qualified', 3], ['待改进', 'improve', 4], ['不合格', 'unqualified', 5]]
    },
    {
      type: { code: 'indicator_category', name: '指标类别', description: '考核指标类别选项' },
      items: [['工作业绩', 'performance', 1], ['工作态度', 'attitude', 2], ['工作能力', 'ability', 3], ['团队协作', 'teamwork', 4]]
    },
    {
      type: { code: 'salary_sheet_status', name: '工资条状态', description: '工资条状态选项' },
      items: [['草稿', 'draft', 1], ['已发布', 'published', 2], ['已发放', 'paid', 3]]
    },
    {
      type: { code: 'salary_adjust_type', name: '调薪类型', description: '调薪类型选项' },
      items: [['涨薪', 'raise', 1], ['降薪', 'cut', 2], ['转正调薪', 'regular', 3], ['晋升调薪', 'promotion', 4]]
    }
  ]

  dictData.forEach(dict => {
    // 检查类型是否存在
    const typeCheckStmt = db.prepare('SELECT COUNT(*) as c FROM dict_types WHERE code = ? AND is_deleted = 0')
    typeCheckStmt.bind([dict.type.code])
    typeCheckStmt.step()
    const typeCount = Number(typeCheckStmt.getAsObject().c)
    typeCheckStmt.free()

    if (typeCount === 0) {
      // 插入类型
      const typeStmt = db.prepare('INSERT INTO dict_types (code, name, description, is_deleted) VALUES (?, ?, ?, 0)')
      typeStmt.run([dict.type.code, dict.type.name, dict.type.description])
      typeStmt.free()

      // 插入字典项
      const itemStmt = db.prepare('INSERT INTO dict_items (type_code, label, value, sort, is_deleted) VALUES (?, ?, ?, ?, 0)')
      dict.items.forEach(item => itemStmt.run([dict.type.code, item[0], item[1], item[2]]))
      itemStmt.free()

      console.log(`[DB] ${dict.type.code} dictionary seeded`)
    }
  })
}

// ==================== 权限种子数据 ====================

/**
 * 初始化权限种子数据
 */
function initPermissionSeedData() {
  const db = getDb()

  // 初始化系统角色
  const roles = [
    { code: 'sysadmin', name: '超级管理员', description: '系统超级管理员，拥有所有权限', is_system: 1 }
  ]

  roles.forEach(role => {
    const checkStmt = db.prepare('SELECT id, is_deleted FROM roles WHERE code = ?')
    checkStmt.bind([role.code])
    const hasRow = checkStmt.step()
    const existing = hasRow ? checkStmt.getAsObject() : null
    checkStmt.free()

    if (!existing) {
      const stmt = db.prepare('INSERT INTO roles (code, name, description, is_system, is_deleted) VALUES (?, ?, ?, ?, 0)')
      stmt.run([role.code, role.name, role.description, role.is_system])
      stmt.free()
    } else if (existing.is_deleted === 1) {
      const stmt = db.prepare('UPDATE roles SET is_deleted = 0, name = ?, description = ? WHERE id = ?')
      stmt.run([role.name, role.description, existing.id])
      stmt.free()
    }
  })

  // 初始化系统权限
  const permissions = [
    // 菜单权限
    { code: 'menu:employee', name: '员工管理菜单', type: 'menu', description: '访问员工管理页面' },
    { code: 'menu:department', name: '部门管理菜单', type: 'menu', description: '访问部门管理页面' },
    { code: 'menu:statistics', name: '统计管理菜单', type: 'menu', description: '访问统计管理页面' },
    { code: 'menu:statistics:employee', name: '员工统计菜单', type: 'menu', description: '访问员工统计页面' },
    { code: 'menu:statistics:log', name: '操作统计菜单', type: 'menu', description: '访问操作统计页面' },
    { code: 'menu:statistics:attendance', name: '考勤统计菜单', type: 'menu', description: '访问考勤统计页面' },
    { code: 'menu:statistics:performance', name: '绩效统计菜单', type: 'menu', description: '访问绩效统计页面' },
    { code: 'menu:statistics:recruitment', name: '招聘统计菜单', type: 'menu', description: '访问招聘统计页面' },
    { code: 'menu:statistics:contract', name: '合同统计菜单', type: 'menu', description: '访问合同统计页面' },
    { code: 'menu:system', name: '系统管理菜单', type: 'menu', description: '访问系统管理页面' },
    { code: 'menu:dictionary', name: '字典管理菜单', type: 'menu', description: '访问字典管理页面' },
    { code: 'menu:role', name: '角色管理菜单', type: 'menu', description: '访问角色管理页面' },
    { code: 'menu:permission', name: '权限管理菜单', type: 'menu', description: '访问权限管理页面' },
    { code: 'menu:log', name: '操作日志菜单', type: 'menu', description: '访问操作日志页面' },
    { code: 'menu:database', name: '数据库管理菜单', type: 'menu', description: '访问数据库管理页面' },
    { code: 'menu:announcement', name: '公告管理菜单', type: 'menu', description: '访问公告管理页面' },
    { code: 'menu:import-export', name: '数据导入导出菜单', type: 'menu', description: '访问数据导入导出页面' },
    { code: 'menu:calendar', name: '工作日历菜单', type: 'menu', description: '访问工作日历页面' },
    { code: 'menu:contract', name: '合同管理菜单', type: 'menu', description: '访问合同管理页面' },
    { code: 'menu:attendance', name: '考勤管理菜单', type: 'menu', description: '访问考勤管理页面' },
    { code: 'menu:recruitment', name: '招聘管理菜单', type: 'menu', description: '访问招聘管理页面' },
    { code: 'menu:performance', name: '绩效考核菜单', type: 'menu', description: '访问绩效考核页面' },
    { code: 'menu:salary', name: '薪资管理菜单', type: 'menu', description: '访问薪资管理页面' },
    // 工作日历按钮权限
    { code: 'calendar:edit', name: '编辑日历', type: 'button', description: '编辑工作日历按钮' },
    // 员工管理按钮权限
    { code: 'emp:add', name: '新增员工', type: 'button', description: '新增员工按钮' },
    { code: 'emp:edit', name: '编辑员工', type: 'button', description: '编辑员工按钮' },
    { code: 'emp:delete', name: '删除员工', type: 'button', description: '删除员工按钮' },
    { code: 'emp:batchDelete', name: '批量删除员工', type: 'button', description: '批量删除员工按钮' },
    { code: 'emp:export', name: '导出员工', type: 'button', description: '导出员工数据按钮' },
    { code: 'emp:import', name: '导入员工', type: 'button', description: '导入员工数据按钮' },
    { code: 'emp:view:salary', name: '查看薪资', type: 'button', description: '查看员工薪资信息' },
    { code: 'emp:view:phone', name: '查看手机号', type: 'button', description: '查看员工手机号' },
    { code: 'emp:view:email', name: '查看邮箱', type: 'button', description: '查看员工邮箱' },
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
    // 合同管理按钮权限
    { code: 'contract:add', name: '新增合同', type: 'button', description: '新增合同按钮' },
    { code: 'contract:edit', name: '编辑合同', type: 'button', description: '编辑合同按钮' },
    { code: 'contract:delete', name: '删除合同', type: 'button', description: '删除合同按钮' },
    { code: 'contract:export', name: '导出合同', type: 'button', description: '导出合同数据按钮' },
    // 考勤管理按钮权限
    { code: 'attendance:check', name: '打卡', type: 'button', description: '签到签退按钮' },
    { code: 'attendance:view', name: '查看考勤', type: 'button', description: '查看考勤记录' },
    { code: 'attendance:edit', name: '编辑考勤', type: 'button', description: '编辑考勤记录按钮' },
    { code: 'attendance:delete', name: '删除考勤', type: 'button', description: '删除考勤记录按钮' },
    { code: 'attendance:export', name: '导出考勤', type: 'button', description: '导出考勤数据按钮' },
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
    // 绩效考核按钮权限
    { code: 'indicator:add', name: '新增指标', type: 'button', description: '新增考核指标按钮' },
    { code: 'indicator:edit', name: '编辑指标', type: 'button', description: '编辑考核指标按钮' },
    { code: 'indicator:delete', name: '删除指标', type: 'button', description: '删除考核指标按钮' },
    { code: 'assessment:add', name: '新增考核', type: 'button', description: '新增考核记录按钮' },
    { code: 'assessment:edit', name: '编辑考核', type: 'button', description: '编辑考核记录按钮' },
    { code: 'assessment:delete', name: '删除考核', type: 'button', description: '删除考核记录按钮' },
    { code: 'assessment:score', name: '评分', type: 'button', description: '考核评分按钮' },
    // 薪资管理按钮权限
    { code: 'salary:add', name: '新增工资条', type: 'button', description: '新增工资条按钮' },
    { code: 'salary:edit', name: '编辑工资条', type: 'button', description: '编辑工资条按钮' },
    { code: 'salary:delete', name: '删除工资条', type: 'button', description: '删除工资条按钮' },
    { code: 'salary:generate', name: '批量生成', type: 'button', description: '批量生成工资条按钮' },
    { code: 'salary:export', name: '导出工资条', type: 'button', description: '导出工资条数据按钮' },
    { code: 'adjustment:add', name: '新增调薪', type: 'button', description: '新增调薪记录按钮' },
    { code: 'adjustment:delete', name: '删除调薪', type: 'button', description: '删除调薪记录按钮' }
  ]

  // 创建唯一索引
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)') } catch (e) {}

  const permStmt = db.prepare('INSERT OR IGNORE INTO permissions (code, name, type, description, is_deleted) VALUES (?, ?, ?, ?, 0)')
  permissions.forEach(p => permStmt.run([p.code, p.name, p.type, p.description]))
  permStmt.free()
  console.log('[DB] permissions initialized')

  // 分配权限给角色
  assignPermissionsToRoles()

  // 初始化超级管理员角色关联
  initSuperAdminRole()
}

/**
 * 分配权限给角色
 */
function assignPermissionsToRoles() {
  const db = getDb()

  const getRoleId = (code) => {
    const stmt = db.prepare('SELECT id FROM roles WHERE code = ? AND is_deleted = 0')
    stmt.bind([code])
    let id = null
    if (stmt.step()) id = stmt.getAsObject().id
    stmt.free()
    return id
  }

  const sysadminId = getRoleId('sysadmin')
  if (!sysadminId) return

  // 检查是否已有权限分配
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM role_permissions WHERE is_deleted = 0')
  checkStmt.step()
  const count = Number(checkStmt.getAsObject().c)
  checkStmt.free()

  if (count > 0) {
    syncSuperAdminPermissions(sysadminId)
    return
  }

  // 超级管理员拥有所有权限
  const allPermissions = db.prepare('SELECT code FROM permissions')
  const sysadminStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)')
  while (allPermissions.step()) {
    sysadminStmt.run([sysadminId, allPermissions.getAsObject().code])
  }
  allPermissions.free()
  sysadminStmt.free()
  console.log('[DB] sysadmin permissions assigned')
}

/**
 * 同步超级管理员权限
 */
function syncSuperAdminPermissions(sysadminId) {
  const db = getDb()

  const existingStmt = db.prepare('SELECT permission_code FROM role_permissions WHERE role_id = ? AND is_deleted = 0')
  existingStmt.bind([sysadminId])
  const existingPermissions = new Set()
  while (existingStmt.step()) {
    existingPermissions.add(existingStmt.getAsObject().permission_code)
  }
  existingStmt.free()

  const allStmt = db.prepare('SELECT code FROM permissions WHERE is_deleted = 0')
  const newPermissions = []
  while (allStmt.step()) {
    const code = allStmt.getAsObject().code
    if (!existingPermissions.has(code)) newPermissions.push(code)
  }
  allStmt.free()

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

  const roleStmt = db.prepare("SELECT id FROM roles WHERE code = 'sysadmin' AND is_deleted = 0")
  const roleHasRow = roleStmt.step()
  const sysadminRoleId = roleHasRow ? roleStmt.getAsObject().id : null
  roleStmt.free()

  const userStmt = db.prepare("SELECT id FROM employees WHERE account = 'sysadmin' AND is_deleted = 0")
  const userHasRow = userStmt.step()
  const userId = userHasRow ? userStmt.getAsObject().id : null
  userStmt.free()

  if (userId && sysadminRoleId) {
    const checkStmt = db.prepare('SELECT id, is_deleted FROM user_roles WHERE user_id = ? AND role_id = ?')
    checkStmt.bind([userId, sysadminRoleId])
    const checkHasRow = checkStmt.step()
    const existing = checkHasRow ? checkStmt.getAsObject() : null
    checkStmt.free()

    if (!existing) {
      const assignStmt = db.prepare('INSERT INTO user_roles (user_id, role_id, is_deleted) VALUES (?, ?, 0)')
      assignStmt.run([userId, sysadminRoleId])
      assignStmt.free()
      db.run("UPDATE employees SET role_code = 'sysadmin' WHERE id = ?", [userId])
      console.log('[DB] sysadmin role assigned')
    } else if (existing.is_deleted === 1) {
      db.run('UPDATE user_roles SET is_deleted = 0 WHERE id = ?', [existing.id])
      db.run("UPDATE employees SET role_code = 'sysadmin' WHERE id = ?", [userId])
      console.log('[DB] sysadmin role restored')
    }
  }
}

/**
 * 初始化部门权限分配
 */
function initDeptPermissions() {
  const db = getDb()

  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM permission_assignments WHERE target_type IN (?, ?) AND is_deleted = 0')
  checkStmt.bind(['dept', 'dept_tree'])
  checkStmt.step()
  const count = Number(checkStmt.getAsObject().c)
  checkStmt.free()

  if (count > 0) return

  const permissions = ['menu:employee', 'menu:department', 'attendance:check']
  const insertStmt = db.prepare('INSERT INTO permission_assignments (permission_code, target_type, target_id, is_deleted) VALUES (?, ?, ?, 0)')
  permissions.forEach(code => insertStmt.run([code, 'dept_tree', 1]))
  insertStmt.free()
  save()
  console.log('[DB] root dept permissions initialized')
}

// ==================== 统一初始化入口 ====================

/**
 * 初始化所有种子数据
 */
function initAllSeedData() {
  initDepartmentSeedData()
  initEmployeeSeedData()
  initDictSeedData()
  initPermissionSeedData()
  initDeptPermissions()
}

/**
 * 数据库完整初始化
 */
function initDatabase() {
  // 初始化所有表结构（从 tables.js 导入）
  const { initAllTables } = require('./tables')
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
  initAllSeedData,
  initDepartmentSeedData,
  initEmployeeSeedData,
  initDictSeedData,
  initPermissionSeedData,
  initDeptPermissions
}
