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
│   │   │   └── StatisticsPage.vue   # 数据统计（卡片 + 折线图 + 饼状图）
│   │   └── components/          # 公共组件
│   │       ├── Auth.vue             # 权限控制组件
│   │       └── EmployeeSelector.vue # 员工选择器组件（支持多选、搜索、部门筛选）
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

**模块结构：**
- `core.js` — 数据库连接管理、持久化
- `init.js` — 初始化脚本（表结构创建、种子数据、角色权限初始化）
- `department.js` — 部门 CRUD、路径计算、操作日志记录
- `employee.js` — 员工 CRUD、登录认证、操作日志记录
- `dict.js` — 字典类型和字典项管理、操作日志记录
- `permission.js` — RBAC 权限管理（角色、权限、用户角色关联）、操作日志记录
- `log.js` — 操作日志记录、查询、清理
- `statistics.js` — 统计数据查询
- `comments.js` — 表和字段注释（数据库管理页面显示）

**表结构：**
- `departments`：id, name, description, parent_id, path_ids, path_names, is_deleted, created_by, created_at, updated_by, updated_at
- `employees`：id, name, account, password, gender, age, phone, email, department_id, position, salary, avatar, role_code, is_deleted, created_by, created_at, updated_by, updated_at
- `dict_types`：id, code, name, description, is_deleted, created_by, created_at, updated_by, updated_at
- `dict_items`：id, type_code, label, value, sort, is_deleted, created_by, created_at, updated_by, updated_at
- `roles`：id, code, name, description, is_system, is_deleted, created_by, created_at, updated_by, updated_at
- `permissions`：id, code, name, type, description, is_deleted, created_by, created_at, updated_by, updated_at
- `role_permissions`：id, role_id, permission_code, is_deleted, created_by, created_at
- `user_roles`：id, user_id, role_id, is_deleted, created_by, created_at
- `operation_logs`：id, user_id, user_name, module, action, target_type, target_id, target_name, detail, created_at

**初始化数据：**
- 21 个部门，3 层级结构
- 48 名员工，每人有拼音账号（如 `zhangsan`），默认密码 `123456`
- 职位字典从员工种子数据中自动提取
- 性别字典：男、女

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

## 界面布局

- **自定义标题栏**：`frame: false`，无边框窗口，顶部可拖拽区域 + 最小化/最大化/关闭按钮
- **左侧侧边栏**：220px，深色背景，el-menu 导航
- **右侧主内容区**：白色顶部栏（页面标题 + 用户信息 + 修改密码/退出）+  底部内容区（如果是左右结构的布局，各自占满内容区域高度，高度超出各自滚动）
- **字典管理**：左侧字典类型列表，右侧字典项列表，其他模块有需要
- **中文界面**：Element Plus 使用 `zhCn` locale，分页等组件显示中文

## 注意事项

- **Node 版本限制**：当前环境为 Node 16.18.1，原生模块需兼容此版本
- **模块格式**：主进程和预加载脚本使用 CommonJS (`require`)，渲染进程使用 ES Modules (`import`)
- **contextIsolation**：预加载脚本启用 `contextIsolation: true`，通过 `contextBridge` 暴露 API
- **下拉选项**：下拉选项优先使用字典管理模块来配置实现
- **数据库文件**：`app.db` 已加入 `.gitignore`
- **不用 TypeScript**：项目全部使用 JavaScript，每个模块的js代码尽量放到对应模块的pinia文件中
- **代码规范**：JS 方法需写注释说明用途，方法内部关键步骤也需注释
- **数据查询**：`emp.getAll()` 返回的员工数据包含 `department_name`（关联部门名称）；`dept.getAll()` 返回的部门数据包含 `path_ids` 和 `path_names`（自动计算的路径）
- **滚动条**：统一使用 Element Plus 的 `el-scrollbar` 组件，保持界面风格一致
- **公共代码组件化**：重复使用的代码尽量抽取为公共组件或工具函数，如部门树、字典下拉、表格操作栏等
- **权限控制**：每次或调整模块需要相应的调整权限配置，登录后用户权限存储在 `currentUser.permissions` 中，通过 `v-if="hasPermission('xxx')"` 控制按钮显示
- **表设计**：所有的表都要删除状态创建人和时间，修改人和时间，所有的删除都需要使用逻辑删除。
- **操作日志记录**：所有操作需要增加操作日志，日志格式：`用户名 时间 操作类型 操作对象 详情`
- **初始化脚本**：所有表结构创建和种子数据初始化集中在 `init.js` 文件中，初始化时检查数据是否已存在（包括已删除的记录），避免重复插入
- **表和字段注释**：所有表和字段的中文注释维护在 `src/main/db/comments.js` 文件中，每次新增或修改表结构时，必须同步更新 `comments.js` 中的 `tableComments` 和 `fieldComments` 对象，以便在数据库管理页面正确显示注释信息