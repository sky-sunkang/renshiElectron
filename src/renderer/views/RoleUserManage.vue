<template>
  <div class="role-user-page">
    <!-- 左侧角色列表 -->
    <div class="role-list-panel">
      <div class="panel-header">
        <h3>角色列表</h3>
        <el-button v-if="permStore.hasPermission('role:add')" type="primary" size="small" @click="openRoleDialog()">+ 新增</el-button>
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
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="scope">
              <el-button v-if="permStore.hasPermission('role:edit') && !scope.row.is_system" link type="primary" size="small" @click="openRoleDialog(scope.row)">编辑</el-button>
              <el-button v-if="permStore.hasPermission('role:delete') && !scope.row.is_system" link type="danger" size="small" @click="removeRole(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </div>

    <!-- 右侧人员配置 -->
    <div class="user-panel">
      <div class="panel-header">
        <h3>{{ currentRole ? currentRole.name + ' - 已分配人员' : '人员配置' }}</h3>
        <el-button
          v-if="permStore.hasPermission('role:assignUser') && currentRole"
          type="primary"
          size="small"
          @click="openEmployeeSelector"
        >
          + 新增人员
        </el-button>
      </div>
      <el-scrollbar v-if="currentRole" class="user-scroll">
        <div class="user-content">
          <el-table :data="assignedUsers" stripe border size="small" style="width: 100%">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="account" label="账号" width="120" />
            <el-table-column prop="department_name" label="所属部门" min-width="150" show-overflow-tooltip />
            <el-table-column prop="position" label="职位" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  v-if="permStore.hasPermission('role:assignUser')"
                  link
                  type="danger"
                  size="small"
                  @click="removeAssignedUser(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-scrollbar>
      <el-empty v-else description="请选择角色查看人员" />
    </div>

    <!-- 角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" :title="roleForm.id ? '编辑角色' : '新增角色'" width="400px">
      <el-form :model="roleForm" label-width="90px" :rules="roleRules" ref="roleFormRef">
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="如 admin" :disabled="roleForm.id" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="如 管理员" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" placeholder="角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 人员选择组件 -->
    <EmployeeSelector
      v-model="selectorVisible"
      :exclude-ids="assignedUserIds"
      @confirm="handleEmployeeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import EmployeeSelector from '../components/EmployeeSelector.vue'

const permStore = usePermissionStore()

// 角色数据
const roles = ref([])
const currentRole = ref(null)

// 用户数据
const users = ref([])
const assignedUserIds = ref([])

// 角色弹窗
const roleDialogVisible = ref(false)
const roleFormRef = ref()
const roleForm = reactive({ id: null, code: '', name: '', description: '' })
const roleRules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// 人员选择器
const selectorVisible = ref(false)

/**
 * 已分配的用户列表
 */
const assignedUsers = computed(() => {
  if (!currentRole.value) return []
  return users.value.filter(user => assignedUserIds.value.includes(user.id))
})

/**
 * 加载所有角色
 */
async function loadRoles() {
  roles.value = await window.electronAPI.perm.getRoles()
}

/**
 * 加载所有员工
 */
async function loadUsers() {
  users.value = await window.electronAPI.emp.getAll()
}

/**
 * 选择角色时加载对应用户
 * @param {Object} row - 选中的角色行
 */
async function handleRoleChange(row) {
  currentRole.value = row
  if (row) {
    // 获取当前角色已分配的用户ID列表
    const roleUsers = await window.electronAPI.perm.getRoleUsers(row.id)
    assignedUserIds.value = roleUsers.map(user => user.id)
  } else {
    assignedUserIds.value = []
  }
}

/**
 * 打开人员选择器
 */
function openEmployeeSelector() {
  selectorVisible.value = true
}

/**
 * 处理人员选择确认
 * @param {Array} selectedEmployees - 选中的员工列表
 */
async function handleEmployeeConfirm(selectedEmployees) {
  if (!currentRole.value || selectedEmployees.length === 0) return

  const roleId = currentRole.value.id
  // 为选中的用户分配角色
  for (const emp of selectedEmployees) {
    await window.electronAPI.perm.setUserRoles(emp.id, [roleId])
  }

  ElMessage.success(`成功分配 ${selectedEmployees.length} 位人员`)
  // 刷新已分配用户列表
  const roleUsers = await window.electronAPI.perm.getRoleUsers(roleId)
  assignedUserIds.value = roleUsers.map(user => user.id)
  // 刷新用户数据
  await loadUsers()
}

/**
 * 删除已分配的用户
 * @param {Object} user - 要删除的用户
 */
async function removeAssignedUser(user) {
  try {
    await ElMessageBox.confirm(`确定将「${user.name}」从该角色移除吗？`, '提示', { type: 'warning' })
    // 清空该用户的角色
    await window.electronAPI.perm.setUserRoles(user.id, [])
    ElMessage.success('移除成功')
    // 刷新已分配用户列表
    const roleUsers = await window.electronAPI.perm.getRoleUsers(currentRole.value.id)
    assignedUserIds.value = roleUsers.map(u => u.id)
    // 刷新用户数据
    await loadUsers()
  } catch (e) {
    if (e.message) {
      ElMessage.error(e.message)
    }
  }
}

/**
 * 打开角色弹窗
 * @param {Object} row - 编辑时传入的行数据
 */
function openRoleDialog(row) {
  if (row) {
    roleForm.id = row.id
    roleForm.code = row.code
    roleForm.name = row.name
    roleForm.description = row.description || ''
  } else {
    Object.assign(roleForm, { id: null, code: '', name: '', description: '' })
  }
  roleDialogVisible.value = true
}

/**
 * 保存角色
 */
async function saveRole() {
  await roleFormRef.value.validate()
  if (roleForm.id) {
    await window.electronAPI.perm.updateRole(roleForm.id, {
      name: roleForm.name,
      description: roleForm.description
    })
    ElMessage.success('更新成功')
  } else {
    await window.electronAPI.perm.addRole({
      code: roleForm.code,
      name: roleForm.name,
      description: roleForm.description
    })
    ElMessage.success('添加成功')
  }
  roleDialogVisible.value = false
  await loadRoles()
}

/**
 * 删除角色
 * @param {Object} row - 要删除的行数据
 */
async function removeRole(row) {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '提示', { type: 'warning' })
    await window.electronAPI.perm.deleteRole(row.id)
    ElMessage.success('删除成功')
    currentRole.value = null
    assignedUserIds.value = []
    await loadRoles()
  } catch (e) {
    if (e.message) {
      ElMessage.error(e.message)
    }
  }
}

onMounted(async () => {
  await loadRoles()
  await loadUsers()
})
</script>

<style scoped>
.role-user-page {
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
.user-panel {
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
.user-scroll {
  flex: 1;
  min-height: 0;
}
.user-content {
  padding: 16px;
}
</style>
