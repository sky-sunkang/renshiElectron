# Electron + Vue3 + SQLite 桌面应用

## 项目概述

这是一个基于 Electron 的桌面应用，使用 Vue3 构建前端界面，SQLite 作为本地数据库，Element Plus 作为 UI 组件库。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Electron | 27.3.11 | 桌面应用框架 |
| Vue | 3.4.38 | 前端框架 | 
| Vite | 4.5.9 | 构建工具 |
| Element Plus | latest | UI 组件库（按需引入） |
| better-sqlite3 | 8.7.0 | SQLite 数据库（兼容 Node 16） |

## 项目结构

```
.
├── src/
│   ├── main/           # Electron 主进程（Node.js 环境）
│   │   ├── main.js     # 主进程入口，窗口管理 + IPC 注册
│   │   └── db.js       # SQLite 数据库封装
│   ├── preload/        # 预加载脚本（桥接主进程与渲染进程）
│   │   └── index.js    # 通过 contextBridge 暴露安全 API
│   └── renderer/       # 渲染进程（Vue3 前端）
│       ├── main.js     # Vue 应用入口
│       ├── App.vue     # 根组件
│       ├── style.css   # 全局样式
│       └── components/ # Vue 组件
├── vite.main.config.js      # 主进程构建配置（输出 CJS）
├── vite.preload.config.js   # 预加载脚本构建配置（输出 CJS）
├── vite.renderer.config.mjs # 渲染进程构建配置（Vue + 按需引入）
├── electron-builder.json    # Electron 打包配置
└── package.json
```

## 常用命令

```bash
npm run dev               # 启动渲染进程 Vite 开发服务器（仅前端）
npm run electron:dev      # 同时启动 Vite + Electron（完整桌面应用）
npm run build             # 构建所有入口（main / preload / renderer）
npm run electron:build    # 构建并打包 Electron 应用
```

## 架构说明

### 三进程模型

1. **主进程** (`src/main/main.js`) — Node.js 环境，可访问系统 API 和原生模块
2. **预加载脚本** (`src/preload/index.js`) — 在渲染进程加载前执行，负责安全地暴露主进程能力
3. **渲染进程** (`src/renderer/`) — Vue3 前端，运行在 Chromium 中，**无 Node.js 权限**

### IPC 通信

所有主进程 ↔ 渲染进程的通信都通过预加载脚本桥接：

```js
// 渲染进程通过 window.electronAPI 访问
const items = await window.electronAPI.db.getAllItems()
```

暴露的 API：
- `window.electronAPI.platform` — 当前操作系统平台
- `window.electronAPI.db.addItem(name, value)` — 添加数据
- `window.electronAPI.db.getAllItems()` — 获取全部数据
- `window.electronAPI.db.getItemById(id)` — 按 ID 查询
- `window.electronAPI.db.updateItem(id, name, value)` — 更新数据
- `window.electronAPI.db.deleteItem(id)` — 删除数据

### 数据库

- 使用 `better-sqlite3` 在主进程中操作数据库
- 数据库路径：开发模式 `./app.db`，打包后位于 `userData/app.db`
- 启用 WAL 模式提升并发性能
- 表结构见 `src/main/db.js`

## Element Plus 按需引入

配置在 `vite.renderer.config.mjs` 中，通过 `unplugin-vue-components` + `unplugin-auto-import` 实现：

- **组件**（如 `<el-button>`）无需手动 import，自动按需引入组件和样式
- **API**（如 `ElMessage`、`ElMessageBox`）无需手动 import，自动按需引入
- 自动生成的类型声明文件（`components.d.ts`、`auto-imports.d.ts`）已加入 `.gitignore`

## 注意事项

- **Node 版本限制**：当前环境为 Node 16.18.1，安装原生模块（如 better-sqlite3）时需选择兼容版本（如 8.7.0）
- **模块格式**：主进程和预加载脚本使用 CommonJS (`require`)，构建输出为 CJS；渲染进程使用 ES Modules (`import`)
- **contextIsolation**：预加载脚本中启用 `contextIsolation: true`，通过 `contextBridge` 暴露 API，不要直接暴露 Node API
- **数据库文件**：`app.db`、`app.db-shm`、`app.db-wal` 已加入 `.gitignore`，开发时数据库文件不会被提交
- **不要用TypeScript 使用JavaScript**