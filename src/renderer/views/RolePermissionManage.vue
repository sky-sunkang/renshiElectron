<template>
  <div class="role-perm-page">
    <!-- 左侧角色列表 -->
    <div class="role-list-panel">
      <div class="panel-header">
        <h3>角色列表</h3>
      </div>
      <el-scrollbar class="role-scroll">
        <el-table
          :data="roles"
          stripe
          border
          size="small"
          highlight-current-row
          @current-change="handleRoleChange"
          style="width: 100%"
        >
          <el-table-column prop="code" label="角色编码" min-width="100" show-overflow-tooltip />
          <el-table-column prop="name" label="角色名称" min-width="100" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
          <el-table-column label="系统角色" width="80" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.is_system" type="info" size="small">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </div>

    <!-- 右侧权限配置 -->
    <div class="permission-panel">
      <div class="panel-header">
        <h3>{{ currentRole ? currentRole.name + ' - 权限配置' : '权限配置' }}</h3>
        <el-button
          v-if="permStore.hasPermission('permission:assign') && currentRole"
          type="primary"
          size="small"
          :disabled="currentRole?.is_system"
          @click="savePermissions"
        >
          保存权限
        </el-button>
      </div>
      <el-scrollbar v-if="currentRole" class="permission-scroll">
        <div class="permission-content">
          <!-- 系统角色提示 -->
          <el-alert
            v-if="currentRole.is_system"
            title="系统角色权限不可修改"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />

          <!-- 按模块分组的权限 -->
          <el-collapse v-model="expandedModules" class="permission-collapse">
            <el-collapse-item v-for="module in permissionModules" :key="module.name" :name="module.name">
              <template #title>
                <span class="collapse-title">{{ module.name }}</span>
                <span class="collapse-count">({{ getModuleCount(module) }})</span>
              </template>
              <!-- 菜单权限 -->
              <div v-if="module.menus.length > 0" class="permission-group">
                <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
                  <el-checkbox v-for="perm in module.menus" :key="perm.code" :label="perm.code">
                    {{ perm.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <!-- 操作权限 -->
              <div v-if="module.actions.length > 0" class="permission-group">
                <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
                  <el-checkbox v-for="perm in module.actions" :key="perm.code" :label="perm.code">
                    {{ perm.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <!-- 子模块 -->
              <div v-if="module.children && module.children.length > 0" class="permission-children">
                <div v-for="child in module.children" :key="child.name" class="child-module">
                  <div class="child-header">
                    <span class="child-title">{{ child.name }}</span>
                    <span class="child-count">({{ getChildCount(child) }})</span>
                  </div>
                  <div class="child-content">
                    <!-- 子模块菜单权限 -->
                    <div v-if="child.menus.length > 0" class="permission-group inline">
                      <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
                        <el-checkbox v-for="perm in child.menus" :key="perm.code" :label="perm.code">
                          {{ perm.name }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </div>
                    <!-- 子模块操作权限 -->
                    <div v-if="child.actions.length > 0" class="permission-group inline">
                      <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
                        <el-checkbox v-for="perm in child.actions" :key="perm.code" :label="perm.code">
                          {{ perm.name }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-scrollbar>
      <el-empty v-else description="请选择角色查看权限" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'

const permStore = usePermissionStore()
const authStore = useAuthStore()

/** 获取当前操作人信息 */
function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

// 角色数据
const roles = ref([])
const currentRole = ref(null)
const permissions = ref([])
const selectedPermissions = ref([])
const expandedModules = ref([]) // 默认展开所有模块

// 权限模块定义
const moduleConfig = [
  { name: '工作台', menuPrefix: 'menu:dashboard', actionPrefix: null },
  { name: '员工管理', menuPrefix: 'menu:employee', actionPrefix: 'emp:' },
  { name: '部门管理', menuPrefix: 'menu:department', actionPrefix: 'dept:' },
  { name: '合同管理', menuPrefix: 'menu:contract', actionPrefix: 'contract:' },
  { name: '考勤管理', menuPrefix: 'menu:attendance', actionPrefix: 'attendance:' },
  { name: '招聘管理', menuPrefix: 'menu:recruitment', actionPrefix: 'position:' },
  { name: '绩效考核', menuPrefix: 'menu:performance', actionPrefix: 'indicator:' },
  { name: '薪资管理', menuPrefix: 'menu:salary', actionPrefix: 'salary:' },
  {
    name: '统计管理',
    menuPrefix: 'menu:statistics',
    actionPrefix: null,
    children: [
      { name: '员工统计', menuPrefix: 'menu:statistics:employee', actionPrefix: null },
      { name: '操作统计', menuPrefix: 'menu:statistics:log', actionPrefix: null },
      { name: '考勤统计', menuPrefix: 'menu:statistics:attendance', actionPrefix: null },
      { name: '绩效统计', menuPrefix: 'menu:statistics:performance', actionPrefix: null },
      { name: '招聘统计', menuPrefix: 'menu:statistics:recruitment', actionPrefix: null },
      { name: '合同统计', menuPrefix: 'menu:statistics:contract', actionPrefix: null }
    ]
  },
  {
    name: '系统管理',
    menuPrefix: 'menu:system',
    actionPrefix: null,
    children: [
      { name: '公告管理', menuPrefix: 'menu:announcement', actionPrefix: 'announcement:' },
      { name: '数据导入导出', menuPrefix: 'menu:import-export', actionPrefix: 'import-export:' },
      { name: '字典管理', menuPrefix: 'menu:dictionary', actionPrefix: 'dict:' },
      { name: '角色管理', menuPrefix: 'menu:role', actionPrefix: 'role:' },
      { name: '权限管理', menuPrefix: 'menu:permission', actionPrefix: 'permission:' },
      { name: '操作日志', menuPrefix: 'menu:log', actionPrefix: null },
      { name: '工作日历', menuPrefix: 'menu:calendar', actionPrefix: 'calendar:' },
      { name: '数据库管理', menuPrefix: 'menu:database', actionPrefix: 'db:' }
    ]
  }
]

/**
 * 获取所有模块名称（用于默认展开）
 */
function getAllModuleNames() {
  const names = []
  moduleConfig.forEach(m => {
    names.push(m.name)
    if (m.children) {
      m.children.forEach(c => names.push(c.name))
    }
  })
  return names
}

/**
 * 计算模块权限数量
 */
function getModuleCount(module) {
  let count = module.menus.length + module.actions.length
  if (module.children) {
    module.children.forEach(child => {
      count += child.menus.length + child.actions.length
    })
  }
  return count
}

/**
 * 计算子模块权限数量
 */
function getChildCount(child) {
  return child.menus.length + child.actions.length
}

/**
 * 获取单个模块的权限数据
 */
function getModuleData(config) {
  // 获取菜单权限（包括子菜单）
  const menus = permissions.value.filter(p =>
    p.type === 'menu' && (
      p.code === config.menuPrefix ||
      p.code.startsWith(config.menuPrefix + ':')
    )
  )

  // 获取操作权限
  let actions = []
  if (config.actionPrefix) {
    actions = permissions.value.filter(p => p.code.startsWith(config.actionPrefix))
  }

  return {
    name: config.name,
    menus,
    actions,
    children: config.children ? config.children.map(child => getModuleData(child)) : []
  }
}

// 按模块分组的权限
const permissionModules = computed(() => {
  return moduleConfig.map(config => getModuleData(config))
    .filter(module => module.menus.length > 0 || module.actions.length > 0 || module.children.length > 0)
})

/**
 * 加载所有角色
 */
async function loadRoles() {
  roles.value = await window.electronAPI.perm.getRoles()
}

/**
 * 加载所有权限
 */
async function loadPermissions() {
  permissions.value = await window.electronAPI.perm.getAllPermissions()
}

/**
 * 选择角色时加载对应权限
 * @param {Object} row - 选中的角色行
 */
async function handleRoleChange(row) {
  currentRole.value = row
  if (row) {
    const rolePerms = await window.electronAPI.perm.getRolePermissions(row.id)
    selectedPermissions.value = rolePerms
    // 默认展开所有模块
    expandedModules.value = getAllModuleNames()
  } else {
    selectedPermissions.value = []
  }
}

/**
 * 保存角色权限
 */
async function savePermissions() {
  if (!currentRole.value) return
  // 将响应式数组转换为普通数组
  const permissionsToSave = JSON.parse(JSON.stringify(selectedPermissions.value))
  await window.electronAPI.perm.setRolePermissions(currentRole.value.id, permissionsToSave, getOperator())
  ElMessage.success('权限保存成功')
}

onMounted(async () => {
  await loadRoles()
  await loadPermissions()
})
</script>

<style scoped>
.role-perm-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.role-list-panel {
  width: 500px;
  min-width: 500px;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.permission-panel {
  flex: 1;
  height: 100%;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  flex-shrink: 0;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}
.role-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px 16px;
}
.role-scroll :deep(.el-scrollbar__view) {
  height: 100%;
}
.role-scroll :deep(.el-table) {
  width: 100% !important;
}
.permission-scroll {
  flex: 1;
  min-height: 0;
}
.permission-content {
  padding: 0 16px 16px 16px;
}
.permission-collapse {
  border: none;
}
.permission-collapse :deep(.el-collapse-item__header) {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  height: auto;
  line-height: 1.5;
  font-size: 14px;
}
.permission-collapse :deep(.el-collapse-item__header:hover) {
  background: #e2e8f0;
}
.permission-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}
.permission-collapse :deep(.el-collapse-item__content) {
  padding: 8px 0 4px 0;
}
.collapse-title {
  font-weight: 600;
  color: #1e293b;
}
.collapse-count {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}
.permission-group {
  margin-bottom: 8px;
}
.permission-group.inline {
  margin-bottom: 4px;
}
.group-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}
.permission-children {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.child-module {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 10px;
}
.child-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}
.child-title {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}
.child-count {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 4px;
}
.child-content {
  padding-top: 4px;
}
.permission-collapse :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.permission-collapse :deep(.el-checkbox) {
  margin-right: 0;
}
.permission-collapse :deep(.el-checkbox__label) {
  font-size: 13px;
}
</style>
