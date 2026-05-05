/**
 * 数据库表和字段注释
 * 用于在数据库管理页面显示表和字段的中文说明
 *
 * 注意：每次新增或修改表结构时，都需要同步更新此文件中的注释
 */

/**
 * 表注释
 * key: 表名
 * value: 表的中文说明
 */
const tableComments = {
  departments: '部门表：存储组织架构部门信息',
  employees: '员工表：存储员工基本信息、登录账号、所属部门等',
  dict_types: '字典类型表：定义字典分类（如性别、职位等）',
  dict_items: '字典项表：存储各字典类型下的具体选项',
  roles: '角色表：定义系统角色（如超级管理员、管理员、人事专员等）',
  permissions: '权限表：定义系统权限（菜单权限、按钮权限）',
  role_permissions: '角色权限关联表：配置角色拥有的权限',
  user_roles: '用户角色关联表：分配用户的角色',
  operation_logs: '操作日志表：记录用户操作历史',
  announcements: '公告表：存储系统公告信息',
  contracts: '合同表：存储员工合同信息',
  attendance: '考勤表：存储员工考勤打卡记录',
  positions: '岗位表：存储招聘岗位信息',
  candidates: '候选人表：存储应聘候选人信息',
  interviews: '面试表：存储面试安排记录',
  performance_indicators: '考核指标表：存储绩效考核指标',
  assessments: '考核记录表：存储员工绩效考核记录',
  assessment_details: '考核评分明细表：存储考核评分详情',
  salary_sheets: '工资条表：存储员工工资条信息',
  salary_adjustments: '调薪记录表：存储员工调薪记录'
}

/**
 * 字段注释
 * key: 表名
 * value: 对象，key为字段名，value为字段的中文说明
 */
const fieldComments = {
  departments: {
    id: '主键，自增',
    code: '部门编码（唯一）',
    name: '部门名称',
    description: '部门描述',
    parent_id: '父部门ID，0表示顶级部门',
    path_ids: '部门路径ID（如：1,2,8）',
    path_names: '部门路径名称（如：xx公司/技术部/前端组）',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  employees: {
    id: '主键，自增',
    name: '员工姓名',
    account: '登录账号',
    password: '登录密码',
    gender: '性别',
    age: '年龄',
    phone: '手机号',
    email: '邮箱',
    department_id: '所属部门ID',
    position: '职位',
    salary: '薪资',
    avatar: '头像（Base64格式）',
    role_code: '主角色代码',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  dict_types: {
    id: '主键，自增',
    code: '字典类型代码（如：gender、position）',
    name: '字典类型名称（如：性别、职位）',
    description: '字典类型描述',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  dict_items: {
    id: '主键，自增',
    type_code: '所属字典类型代码',
    label: '显示标签',
    value: '实际值',
    sort: '排序号',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  roles: {
    id: '主键，自增',
    code: '角色代码（如：sysadmin、admin、hr、user）',
    name: '角色名称',
    description: '角色描述',
    is_system: '是否系统角色，0-否，1-是（系统角色不可删除）',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  permissions: {
    id: '主键，自增',
    code: '权限代码（如：menu:employee、emp:add）',
    name: '权限名称',
    type: '权限类型（menu-菜单权限，button-按钮权限）',
    description: '权限描述',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  role_permissions: {
    id: '主键，自增',
    role_id: '角色ID',
    permission_code: '权限代码',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）'
  },
  user_roles: {
    id: '主键，自增',
    user_id: '用户ID（员工ID）',
    role_id: '角色ID',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）'
  },
  operation_logs: {
    id: '主键，自增',
    user_id: '操作用户ID',
    user_name: '操作用户名称',
    module: '操作模块（如：员工管理、部门管理）',
    action: '操作动作（如：新增、编辑、删除）',
    target_type: '操作对象类型（如：员工、部门）',
    target_id: '操作对象ID',
    target_name: '操作对象名称',
    detail: '操作详情（JSON格式）',
    ip: '操作IP地址',
    created_at: '创建时间（Unix时间戳）'
  },
  announcements: {
    id: '主键，自增',
    title: '公告标题',
    content: '公告内容',
    type: '公告类型（normal-普通，important-重要，emergency-紧急）',
    status: '公告状态（draft-草稿，published-已发布，archived-已归档）',
    publisher_id: '发布人ID',
    publisher_name: '发布人名称',
    publish_time: '发布时间（Unix时间戳）',
    expire_time: '过期时间（Unix时间戳）',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  contracts: {
    id: '主键，自增',
    employee_id: '员工ID',
    contract_no: '合同编号',
    contract_type: '合同类型（labor-劳动合同，intern-实习合同，outsource-外包合同）',
    start_date: '合同开始日期（Unix时间戳）',
    end_date: '合同结束日期（Unix时间戳）',
    sign_date: '签订日期（Unix时间戳）',
    status: '合同状态（active-生效中，expired-已过期，terminated-已终止）',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  attendance: {
    id: '主键，自增',
    employee_id: '员工ID',
    type: '考勤类型（check_in-签到，check_out-签退）',
    check_time: '打卡时间（Unix时间戳）',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  positions: {
    id: '主键，自增',
    title: '岗位名称',
    department_id: '所属部门ID',
    department_name: '所属部门名称',
    salary_range: '薪资范围',
    requirements: '岗位要求',
    description: '岗位描述',
    status: '岗位状态（open-招聘中，closed-已关闭，paused-已暂停）',
    headcount: '招聘人数',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  candidates: {
    id: '主键，自增',
    position_id: '应聘岗位ID',
    name: '候选人姓名',
    phone: '联系电话',
    email: '邮箱',
    resume: '简历内容',
    source: '来源渠道',
    status: '候选人状态（pending-待筛选，interviewing-面试中，passed-已通过，rejected-已拒绝，hired-已入职）',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  interviews: {
    id: '主键，自增',
    candidate_id: '候选人ID',
    interviewer_id: '面试官ID',
    interview_time: '面试时间（Unix时间戳）',
    location: '面试地点',
    round: '面试轮次',
    type: '面试类型（onsite-现场，phone-电话，video-视频）',
    status: '面试状态（scheduled-待面试，ongoing-进行中，completed-已完成，cancelled-已取消）',
    result: '面试结果',
    feedback: '面试反馈',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  performance_indicators: {
    id: '主键，自增',
    name: '指标名称',
    category: '指标类别（performance-工作业绩，attitude-工作态度，ability-工作能力，teamwork-团队协作）',
    description: '指标描述',
    max_score: '最高分值',
    weight: '权重',
    sort: '排序号',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  assessments: {
    id: '主键，自增',
    employee_id: '员工ID',
    period: '考核周期（如：2024-01）',
    total_score: '考核总分',
    level: '考核等级（excellent-优秀，good-良好，qualified-合格，improve-待改进，unqualified-不合格）',
    remark: '备注',
    status: '考核状态（pending-待评分，completed-已完成）',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  assessment_details: {
    id: '主键，自增',
    assessment_id: '考核记录ID',
    indicator_id: '考核指标ID',
    score: '得分',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  salary_sheets: {
    id: '主键，自增',
    employee_id: '员工ID',
    month: '月份（如：2024-01）',
    base_salary: '基本工资',
    overtime_pay: '加班费',
    bonus: '奖金',
    allowance: '补贴',
    deduction: '扣款',
    tax: '个税',
    insurance: '社保公积金',
    actual_salary: '实发工资',
    status: '工资条状态（draft-草稿，published-已发布，paid-已发放）',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  },
  salary_adjustments: {
    id: '主键，自增',
    employee_id: '员工ID',
    type: '调薪类型（raise-涨薪，cut-降薪，regular-转正调薪，promotion-晋升调薪）',
    before_salary: '调薪前薪资',
    adjust_amount: '调整金额',
    after_salary: '调薪后薪资',
    effective_date: '生效日期（Unix时间戳）',
    reason: '调薪原因',
    remark: '备注',
    is_deleted: '是否删除，0-未删除，1-已删除',
    created_by: '创建人ID',
    created_at: '创建时间（Unix时间戳）',
    updated_by: '修改人ID',
    updated_at: '修改时间（Unix时间戳）'
  }
}

module.exports = {
  tableComments,
  fieldComments
}