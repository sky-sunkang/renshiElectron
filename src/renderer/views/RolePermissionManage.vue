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
          v-if="permStore.hasPermission('role:assign') && currentRole"
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

          <!-- 菜单权限 -->
          <div class="permission-section">
            <h4 class="section-title">菜单权限</h4>
            <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
              <el-checkbox v-for="perm in menuPermissions" :key="perm.code" :label="perm.code">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 员工管理权限 -->
          <div class="permission-section">
            <h4 class="section-title">员工管理权限</h4>
            <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
              <el-checkbox v-for="perm in empPermissions" :key="perm.code" :label="perm.code">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 部门管理权限 -->
          <div class="permission-section">
            <h4 class="section-title">部门管理权限</h4>
            <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
              <el-checkbox v-for="perm in deptPermissions" :key="perm.code" :label="perm.code">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 字典管理权限 -->
          <div class="permission-section">
            <h4 class="section-title">字典管理权限</h4>
            <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
              <el-checkbox v-for="perm in dictPermissions" :key="perm.code" :label="perm.code">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 角色管理权限 -->
          <div class="permission-section">
            <h4 class="section-title">角色管理权限</h4>
            <el-checkbox-group v-model="selectedPermissions" :disabled="currentRole.is_system">
              <el-checkbox v-for="perm in rolePermissions" :key="perm.code" :label="perm.code">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
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

const permStore = usePermissionStore()

// 角色数据
const roles = ref([])
const currentRole = ref(null)
const permissions = ref([])
const selectedPermissions = ref([])

// 按类型分组的权限
const menuPermissions = computed(() => permissions.value.filter((p) => p.type === 'menu'))
const empPermissions = computed(() => permissions.value.filter((p) => p.code.startsWith('emp:')))
const deptPermissions = computed(() => permissions.value.filter((p) => p.code.startsWith('dept:')))
const dictPermissions = computed(() => permissions.value.filter((p) => p.code.startsWith('dict:')))
const rolePermissions = computed(() => permissions.value.filter((p) => p.code.startsWith('role:')))

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
  await window.electronAPI.perm.setRolePermissions(currentRole.value.id, permissionsToSave)
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
.permission-section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}
.permission-section :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.permission-section :deep(.el-checkbox) {
  margin-right: 0;
}
</style>
