# 人事管理系统（Electron + Vue3）

## 项目概述

基于 Electron 的桌面应用，使用 Vue3 构建前端界面，SQLite（sql.js）作为本地数据库，Element Plus 作为 UI 组件库，vue-router 管理页面路由，Pinia 管理状态，ECharts 用于数据可视化图表。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Electron | 27.3.11 | 桌面应用框架 |
| Vue | 3.4.38 | 前端框架 |
| Vue Router | 4.x | 单页路由 |
| Pinia | 2.1.7 | 状态管理 |
| Vite | 4.5.9 | 构建工具 |
| Element Plus | 2.13.7 | UI 组件库（按需引入） |
| sql.js | 1.14.1 | 纯 JS SQLite 数据库 |
| ECharts | 5.x | 数据可视化图表库 |
| @element-plus/icons-vue | 2.3.2 | Element Plus 图标库 |

## 项目结构

```
.
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.js              # 主进程入口：窗口管理 + IPC 注册
│   │   └── db/                  # 数据库模块（按功能拆分）
│   │       ├── index.js         # 模块入口：整合所有子模块统一导出
│   │       ├── core.js          # 核心模块：数据库连接、持久化
│   │       ├── init.js          # 初始化脚本：表结构创建、种子数据初始化
│   │       ├── department.js    # 部门模块：部门增删改查、路径计算
│   │       ├── employee.js      # 员工模块：员工增删改查、登录认证
│   │       ├── dict.js          # 字典模块：字典类型和字典项管理
│   │       ├── permission.js    # 权限模块：RBAC 权限管理
│   │       ├── log.js           # 操作日志模块：日志记录、查询、清理
│   │       ├── statistics.js    # 统计模块：各类统计数据查询
│   │       ├── announcement.js  # 公告模块：公告增删改查
│   │       ├── contract.js      # 合同模块：合同增删改查、到期提醒
│   │       ├── attendance.js    # 考勤模块：考勤记录管理、打卡
│   │       ├── recruitment.js   # 招聘模块：岗位、候选人、面试管理
│   │       ├── performance.js   # 绩效模块：考核指标、考核记录、评分
│   │       ├── salary.js        # 薪资模块：工资条、调薪记录、薪资统计
│   │       └── comments.js      # 表和字段注释：用于数据库管理页面显示
│   ├── preload/                 # 预加载脚本
│   │   └── index.js             # contextBridge 暴露安全 API
│   ├── renderer/                # 渲染进程（Vue3 前端）
│   │   ├── main.js              # Vue 应用入口（Pinia 注册 + Element Plus 中文）
│   │   ├── App.vue              # 根组件：布局框架（标题栏 + 侧边栏 + 路由视图 + 修改密码）
│   │   ├── style.css            # 全局样式
│   │   ├── router/              # 路由配置
│   │   │   └── index.js         # vue-router 路由表
│   │   ├── stores/              # Pinia 状态管理
│   │   │   ├── auth.js          # 登录状态（isLoggedIn / currentUser / localStorage 持久化）
│   │   │   ├── dept.js          # 部门列表（list / treeData / loadAll）
│   │   │   ├── emp.js           # 员工列表（list / loading / loadAll）
│   │   │   ├── dict.js          # 字典数据（types / list / gender / loadAll）
│   │   │   └── permission.js    # 权限状态（权限检查、角色管理）
│   │   ├── views/               # 页面组件
│   │   │   ├── Login.vue            # 账号密码登录页
│   │   │   ├── EmployeeManage.vue   # 员工管理（左侧部门树 + 右侧列表 + Pinia）
│   │   │   ├── DepartmentManage.vue # 部门管理（左侧部门树 + 右侧子部门列表 + Pinia）
│   │   │   ├── DictionaryManage.vue # 字典管理（左侧类型列表 + 右侧字典项列表）
│   │   │   ├── RoleUserManage.vue   # 角色人员管理（左侧角色列表 + 右侧已分配人员）
│   │   │   ├── RolePermissionManage.vue # 角色权限配置（左侧角色列表 + 右侧权限勾选）
│   │   │   ├── OperationLog.vue     # 操作日志查看
│   │   │   ├── DatabaseManage.vue   # 数据库管理（表结构查看、数据浏览）
│   │   │   ├── StatisticsPage.vue   # 员工统计（卡片 + 折线图 + 饼状图）
│   │   │   ├── LogStatistics.vue    # 操作统计（卡片 + 趋势图 + 分布图）
│   │   │   ├── AnnouncementManage.vue # 公告管理（富文本编辑器）
│   │   │   ├── DataImportExport.vue  # 数据导入导出（Excel 导入导出）
│   │   │   ├── ContractManage.vue    # 合同管理（合同信息管理、到期提醒）
│   │   │   ├── AttendanceManage.vue  # 考勤管理（签到签退、考勤记录）
│   │   │   ├── RecruitmentManage.vue # 招聘管理（岗位发布、候选人管理、面试安排）
│   │   │   ├── PerformanceManage.vue # 绩效考核（考核指标、考核记录、评分）
│   │   │   └── SalaryManage.vue      # 薪资管理（工资条、调薪记录、薪资统计）
│   │   └── components/          # 公共组件
│   │       ├── Auth.vue             # 权限控制组件
│   │       ├── EmployeeSelector.vue # 员工选择器组件（支持多选、搜索、部门筛选）
│   │       └── DeptSelector.vue     # 部门选择器组件（支持搜索、树形展示）
├── vite.main.config.js          # 主进程构建配置（CJS）
├── vite.preload.config.js       # 预加载脚本构建配置（CJS）
├── vite.renderer.config.mjs     # 渲染进程构建配置（Vue + 按需引入）
├── electron-builder.json        # Electron 打包配置
└── package.json
```

## 常用命令

```bash
npm run dev               # 启动渲染进程 Vite 开发服务器
npm run electron:dev      # 同时启动 Vite + Electron（完整桌面应用）
npm run build             # 构建所有入口（main / preload / renderer）
npm run electron:build    # 构建并打包 Electron 应用
```

## 架构说明

### 三进程模型

1. **主进程** (`src/main/main.js`) — Node.js 环境，数据库操作、窗口管理
2. **预加载脚本** (`src/preload/index.js`) — 安全桥接，暴露 `window.electronAPI`
3. **渲染进程** (`src/renderer/`) — Vue3 SPA，通过 vue-router 路由切换页面

### IPC 通信

渲染进程通过 `window.electronAPI` 调用主进程：

### 数据库

使用 `sql.js`（纯 JS，无需原生编译），按模块拆分：

- **开发模式**：`./app.db`
- **打包后**：`userData/app.db`
- 每次写操作后自动 `save()` 持久化到文件
- 不要用唯一主键或者外键之类的，在逻辑上处理

**模块结构：**
- `core.js` — 数据库连接管理、持久化
- `init.js` — 初始化脚本（表结构创建、种子数据、角色权限初始化）
- `department.js` — 部门 CRUD、路径计算、操作日志记录
- `employee.js` — 员工 CRUD、登录认证、操作日志记录
- `dict.js` — 字典类型和字典项管理、操作日志记录
- `permission.js` — RBAC 权限管理（角色、权限、用户角色关联）、操作日志记录
- `log.js` — 操作日志记录、查询、清理
- `statistics.js` — 统计数据查询
- `announcement.js` — 公告 CRUD、操作日志记录
- `contract.js` — 合同 CRUD、到期提醒、操作日志记录
- `attendance.js` — 考勤 CRUD、打卡、操作日志记录
- `recruitment.js` — 招聘 CRUD（岗位、候选人、面试）、操作日志记录
- `performance.js` — 绩效 CRUD（考核指标、考核记录、评分）、操作日志记录
- `salary.js` — 薪资 CRUD（工资条、调薪记录）、薪资统计、操作日志记录
- `comments.js` — 表和字段注释（数据库管理页面显示）

**表结构：**
- `departments`：id, name, code, description, parent_id, path_ids, path_names, is_deleted, created_by, created_at, updated_by, updated_at
- `employees`：id, name, account, password, gender, age, phone, email, department_id, position, salary, avatar, role_code, is_deleted, created_by, created_at, updated_by, updated_at
- `dict_types`：id, code, name, description, is_deleted, created_by, created_at, updated_by, updated_at
- `dict_items`：id, type_code, label, value, sort, is_deleted, created_by, created_at, updated_by, updated_at
- `roles`：id, code, name, description, is_system, is_deleted, created_by, created_at, updated_by, updated_at
- `permissions`：id, code, name, type, description, is_deleted, created_by, created_at, updated_by, updated_at
- `role_permissions`：id, role_id, permission_code, is_deleted, created_by, created_at
- `user_roles`：id, user_id, role_id, is_deleted, created_by, created_at
- `operation_logs`：id, user_id, user_name, module, action, target_type, target_id, target_name, detail, created_at
- `announcements`：id, title, content, type, status, publisher_id, publisher_name, publish_time, expire_time, is_deleted, created_by, created_at, updated_by, updated_at
- `contracts`：id, employee_id, contract_no, contract_type, start_date, end_date, sign_date, status, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `attendance`：id, employee_id, type, check_time, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `positions`：id, title, department_id, department_name, salary_range, requirements, description, status, headcount, is_deleted, created_by, created_at, updated_by, updated_at
- `candidates`：id, position_id, name, phone, email, resume, source, status, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `interviews`：id, candidate_id, interviewer_id, interview_time, location, round, type, status, result, feedback, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `performance_indicators`：id, name, category, description, max_score, weight, sort, is_deleted, created_by, created_at, updated_by, updated_at
- `assessments`：id, employee_id, period, total_score, level, remark, status, is_deleted, created_by, created_at, updated_by, updated_at
- `assessment_details`：id, assessment_id, indicator_id, score, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `salary_sheets`：id, employee_id, month, base_salary, overtime_pay, bonus, allowance, deduction, tax, insurance, actual_salary, status, remark, is_deleted, created_by, created_at, updated_by, updated_at
- `salary_adjustments`：id, employee_id, type, before_salary, adjust_amount, after_salary, effective_date, reason, remark, is_deleted, created_by, created_at, updated_by, updated_at

**初始化数据：**
- 21 个部门，3 层级结构，每个部门有编码（如 HQ、TECH、TECH-FE 等）
- 48 名员工，每人有拼音账号（如 `zhangsan`），默认密码 `123456`
- 职位字典从员工种子数据中自动提取
- 性别字典：男、女
- 合同类型字典：劳动合同、实习合同、外包合同
- 合同状态字典：生效中、已过期、已终止
- 考勤类型字典：签到、签退
- 岗位状态字典：招聘中、已关闭、已暂停
- 候选人状态字典：待筛选、面试中、已通过、已拒绝、已入职
- 面试状态字典：待面试、进行中、已完成、已取消
- 面试类型字典：现场面试、电话面试、视频面试
- 考核等级字典：优秀、良好、合格、待改进、不合格
- 指标类别字典：工作业绩、工作态度、工作能力、团队协作
- 工资条状态字典：草稿、已发布、已发放
- 调薪类型字典：涨薪、降薪、转正调薪、晋升调薪

**系统角色：**
| 角色代码 | 角色名称 | 默认用户 |
|----------|----------|----------|
| sysadmin | 超级管理员 | sysadmin（系统管理员） |
| admin | 管理员 | zhaoliu（赵六，技术总监） |
| hr | 人事专员 | zhangershiqi（张二十七，人事总监） |
| user | 普通用户 | zhouba（周八，前端工程师） |

**权限类型：**
- 菜单权限（menu:xxx）：控制页面访问
- 按钮权限（xxx:add/edit/delete）：控制操作按钮

**菜单结构：**
- 员工管理（menu:employee）
- 部门管理（menu:department）
- 合同管理（menu:contract）
- 考勤管理（menu:attendance）
- 招聘管理（menu:recruitment）
- 绩效考核（menu:performance）
- 薪资管理（menu:salary）
- 统计管理（menu:statistics）
  - 员工统计（menu:statistics:employee）
  - 操作统计（menu:statistics:log）
- 系统管理（menu:system）
  - 公告管理（menu:announcement）
  - 数据导入导出（menu:import-export）
  - 字典管理（menu:dictionary）
  - 角色管理（menu:role）
  - 权限管理（menu:permission）
  - 操作日志（menu:log）
  - 数据库管理（menu:database）

**角色权限分配：**
| 角色 | 菜单权限 |
|------|----------|
| 超级管理员 | 所有权限 |
| 管理员 | 员工管理、部门管理、合同管理、考勤管理、招聘管理、绩效考核、薪资管理、统计管理、系统管理（公告管理、数据导入导出、字典管理） |
| 人事专员 | 员工管理、部门管理、合同管理、考勤管理、招聘管理、绩效考核、薪资管理、统计管理、系统管理（公告管理、数据导入导出、操作日志） |
| 普通用户 | 员工管理、部门管理、统计管理、考勤管理、系统管理（公告管理，仅查看和打卡） |

## 界面布局

- **自定义标题栏**：`frame: false`，无边框窗口，顶部可拖拽区域 + 最小化/最大化/关闭按钮
- **左侧侧边栏**：220px，深色背景，el-menu 导航，支持多级子菜单，默认展开所有分类
- **右侧主内容区**：白色顶部栏（页面标题 + 用户信息 + 刷新/修改密码/退出）+  底部内容区（如果是左右结构的布局，各自占满内容区域高度，高度超出各自滚动）
- **字典管理**：左侧字典类型列表，右侧字典项列表，其他模块有需要
- **中文界面**：Element Plus 使用 `zhCn` locale，分页等组件显示中文
- **登录页面**：账号密码登录 + 验证码，未登录自动跳转到登录页

## 注意事项

- **Node 版本限制**：当前环境为 Node 16.18.1，原生模块需兼容此版本
- **模块格式**：主进程和预加载脚本使用 CommonJS (`require`)，渲染进程使用 ES Modules (`import`)
- **contextIsolation**：预加载脚本启用 `contextIsolation: true`，通过 `contextBridge` 暴露 API
- **下拉选项**：下拉选项优先使用字典管理模块来配置实现
- **不用 TypeScript**：项目全部使用 JavaScript，每个模块的js代码尽量放到对应模块的pinia文件中
- **代码规范**：JS 方法需写注释说明用途，方法内部关键步骤也需注释
- **数据查询**：`emp.getAll()` 返回的员工数据包含 `department_name`（关联部门名称）；`dept.getAll()` 返回的部门数据包含 `path_ids` 和 `path_names`（自动计算的路径）
- **滚动条**：统一使用 Element Plus 的 `el-scrollbar` 组件，保持界面风格一致
- **公共代码组件化**：重复使用的代码尽量抽取为公共组件或工具函数，如部门树、字典下拉、表格操作栏等
- **权限控制**：每次或调整模块需要相应的调整权限配置，登录后用户权限存储在 `currentUser.permissions` 中，通过 `v-if="hasPermission('xxx')"` 控制按钮显示
- **新增菜单权限**：每次新增菜单页面时，必须完成以下三步：
  1. 在 `init.js` 的 `permissions` 数组中添加对应的菜单权限（如 `menu:xxx`）
  2. 在 `init.js` 的 `assignPermissionsToRoles` 函数中配置各角色的权限分配
  3. 在 `RolePermissionManage.vue` 的 `moduleConfig` 数组中添加模块配置，否则权限管理页面无法勾选该模块权限
- **子菜单权限**：父菜单和子菜单需要分别配置权限，如统计管理（menu:statistics）和员工统计（menu:statistics:employee）
- **表设计**：所有的表都要删除状态创建人和时间，修改人和时间，所有的删除都需要使用逻辑删除。
- **操作日志记录**：所有系统操作需要增加操作日志，日志格式：`用户名 时间 操作类型 操作对象 详情`
- **初始化脚本**：所有表结构创建和种子数据初始化集中在 `init.js` 文件中，初始化时检查数据是否已存在（包括已删除的记录），避免重复插入
- **表和字段注释**：所有表和字段的中文注释维护在 `src/main/db/comments.js` 文件中，每次新增或修改表结构时，必须同步更新 `comments.js` 中的 `tableComments` 和 `fieldComments` 对象，以便在数据库管理页面正确显示注释信息
- **分页默认条数**：所有列表分页默认显示 10 条数据
- **选择器组件**：选择员工或部门时，使用 `EmployeeSelector` 或 `DeptSelector` 组件，支持搜索和多选
