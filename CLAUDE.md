# 员工信息管理系统（Electron + Vue3）

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
│   │       ├── department.js    # 部门模块：部门增删改查、路径计算
│   │       ├── employee.js      # 员工模块：员工增删改查、登录认证
│   │       ├── dict.js          # 字典模块：字典类型和字典项管理
│   │       └── statistics.js    # 统计模块：各类统计数据查询
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
│   │   │   └── dict.js          # 字典数据（types / list / gender / loadAll）
│   │   ├── views/               # 页面组件
│   │   │   ├── Login.vue            # 账号密码登录页
│   │   │   ├── EmployeeManage.vue   # 员工管理（左侧部门树 + 右侧列表 + Pinia）
│   │   │   ├── DepartmentManage.vue # 部门管理（左侧部门树 + 右侧子部门列表 + Pinia）
│   │   │   ├── DictionaryManage.vue # 字典管理（左侧类型列表 + 右侧字典项列表）
│   │   │   └── StatisticsPage.vue   # 数据统计（卡片 + 折线图 + 饼状图）
│   │   └── components/          # 公共组件
│   │       └── HelloWorld.vue
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

### 路由

使用 `createWebHashHistory`，适合 Electron 文件协议：

| 路径 | 页面 |
|------|------|
| `/` | 重定向到 `/employee` |
| `/employee` | 员工管理 |
| `/department` | 部门管理 |
| `/dictionary` | 字典管理 |
| `/statistics` | 数据统计 |

### Pinia 状态管理

渲染进程使用 Pinia 管理共享状态：

- **auth.js** — `isLoggedIn`, `currentUser`，通过 `localStorage` 持久化，提供 `login` / `logout` / `checkLogin`
- **dept.js** — `list`（原始部门列表）, `treeData`（计算属性，自动构建树）, `loadAll()`
- **emp.js** — `list`（员工列表）, `loading`, `loadAll()`
- **dict.js** — `types`（字典类型）, `list`（所有字典项）, `gender`（性别字典）, `loadAll()`

页面组件通过 `storeToRefs` 读取状态，直接调用 store action 触发数据加载。

### IPC 通信

渲染进程通过 `window.electronAPI` 调用主进程：

**窗口控制**
- `window.electronAPI.window.minimize()`
- `window.electronAPI.window.maximize()`
- `window.electronAPI.window.close()`

**认证**
- `auth.login(account, password)` — 返回 `{id, name, account, position}` 或 `null`

**部门**
- `dept.add(name, description, parent_id)`
- `dept.getAll()`
- `dept.update(id, name, description, parent_id)`
- `dept.delete(id)`
- `dept.getChildren(id)`

**员工**
- `emp.add(data)`
- `emp.getAll()`
- `emp.getById(id)`
- `emp.update(id, data)`
- `emp.delete(id)`
- `emp.updatePassword(id, password)`

**字典**
- `dict.getTypes()` — 获取所有字典类型
- `dict.addType(code, name, description)`
- `dict.updateType(id, code, name, description)`
- `dict.deleteType(id)`
- `dict.getItems(typeCode)` — 获取指定类型的字典项
- `dict.addItem(typeCode, label, value, sort)`
- `dict.updateItem(id, typeCode, label, value, sort)`
- `dict.deleteItem(id)`

**统计**
- `stats.get()` — 返回 `{total, deptStats, genderStats, avgSalary, deptSalaryStats}`

### 数据库

使用 `sql.js`（纯 JS，无需原生编译），按模块拆分：

- **开发模式**：`./app.db`
- **打包后**：`userData/app.db`
- 每次写操作后自动 `save()` 持久化到文件

**模块结构：**
- `core.js` — 数据库连接管理、持久化
- `department.js` — 部门 CRUD、路径计算
- `employee.js` — 员工 CRUD、登录认证
- `dict.js` — 字典类型和字典项管理
- `statistics.js` — 统计数据查询

**表结构：**
- `departments`：id, name, description, parent_id, path_ids, path_names, created_at
- `employees`：id, name, account, password, gender, age, phone, email, department_id, position, salary, created_at
- `dict_types`：id, code, name, description, created_at
- `dict_items`：id, type_code, label, value, sort, created_at

**部门路径**：`path_ids` 存储从根到当前部门的 ID 路径（逗号分隔），`path_names` 存储名称路径。新增/编辑部门后自动调用 `recalcAllDeptPaths()` 重新计算全表路径。

**初始化数据**：
- 21 个部门，3 层级结构
- 50+ 名员工，每人有拼音账号（如 `zhangsan`），默认密码 `123456`
- 内置超级管理员 `sysadmin` / `123456`
- 性别字典：男、女

## 界面布局

- **自定义标题栏**：`frame: false`，无边框窗口，顶部可拖拽区域 + 最小化/最大化/关闭按钮
- **左侧侧边栏**：220px，深色背景，el-menu 导航
- **右侧主内容区**：白色顶部栏（页面标题 + 用户信息 + 修改密码/退出）+  底部内容区（如果是左右结构的布局，各自占满内容区域高度，高度超出各自滚动）
- **部门/员工管理**：左侧窄面板（200px）放部门树，右侧放列表；内容超出显示滚动条
- **字典管理**：左侧字典类型列表，右侧字典项列表，其他模块有需要下拉选项优先使用该模块来配置实现
- **统计页面**：顶部统计卡片（员工总数、部门数量、平均薪资、性别比例）+ 部门人数折线图/饼状图 + 部门薪资统计折线图
- **中文界面**：Element Plus 使用 `zhCn` locale，分页等组件显示中文

## 注意事项

- **Node 版本限制**：当前环境为 Node 16.18.1，原生模块需兼容此版本
- **模块格式**：主进程和预加载脚本使用 CommonJS (`require`)，渲染进程使用 ES Modules (`import`)
- **contextIsolation**：预加载脚本启用 `contextIsolation: true`，通过 `contextBridge` 暴露 API
- **数据库文件**：`app.db` 已加入 `.gitignore`
- **不用 TypeScript**：项目全部使用 JavaScript
- **代码规范**：JS 方法需写注释说明用途，方法内部关键步骤也需注释
- **数据查询**：`emp.getAll()` 返回的员工数据包含 `department_name`（关联部门名称）；`dept.getAll()` 返回的部门数据包含 `path_ids` 和 `path_names`（自动计算的路径）
- **滚动条**：统一使用 Element Plus 的 `el-scrollbar` 组件，保持界面风格一致
- **公共代码组件化**：重复使用的代码尽量抽取为公共组件或工具函数，如部门树、字典下拉、表格操作栏等