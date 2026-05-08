<template>
  <div class="role-perm-page">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="perm-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="角色权限" name="role" />
      <el-tab-pane label="个人权限" name="user" />
      <el-tab-pane label="部门权限" name="dept" />
    </el-tabs>

    <!-- 角色权限 -->
    <div v-show="activeTab === 'role'" class="perm-content">
      <!-- 左侧角色列表 -->
      <div class="list-panel">
        <div class="panel-header">
          <h3>角色列表</h3>
          <div class="header-actions">
            <el-input v-model="roleSearch" placeholder="搜索角色或人员" size="small" clearable style="width: 140px" />
            <el-button
              v-if="permStore.hasPermission('role:add')"
              type="primary"
              size="small"
              @click="showAddRoleDialog"
            >
              新增
            </el-button>
          </div>
        </div>
        <el-scrollbar class="scroll-area">
          <el-table
            :data="filteredRoles"
            stripe
            border
            size="small"
            highlight-current-row
            @current-change="handleRoleChange"
            style="width: 100%"
          >
            <el-table-column prop="code" label="角色编码" min-width="80" show-overflow-tooltip />
            <el-table-column prop="name" label="角色名称" min-width="80" show-overflow-tooltip />
            <el-table-column prop="permission_count" label="权限数" width="70" align="center" />
            <el-table-column label="系统角色" width="70" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.is_system" type="info" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button
                    v-if="!scope.row.is_system && permStore.hasPermission('role:edit')"
                    type="primary"
                    link
                    size="small"
                    @click.stop="showEditRoleDialog(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="!scope.row.is_system && permStore.hasPermission('role:delete')"
                    type="danger"
                    link
                    size="small"
                    @click.stop="handleDeleteRole(scope.row)"
                  >
                    删除
                  </el-button>
                </div>
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
            @click="saveRolePermissions"
          >
            保存权限
          </el-button>
        </div>
        <el-scrollbar v-if="currentRole" class="scroll-area">
          <div class="permission-content">
            <el-alert
              v-if="currentRole.is_system"
              title="系统角色权限不可修改"
              type="info"
              :closable="false"
              style="margin-bottom: 16px"
            />
            <PermissionTree
              :permissions="allPermissions"
              :selected="selectedPermissions"
              :disabled="currentRole.is_system"
              @update:selected="selectedPermissions = $event"
            />
          </div>
        </el-scrollbar>
        <el-empty v-else description="请选择角色查看权限" />
      </div>
    </div>

    <!-- 个人权限 -->
    <div v-show="activeTab === 'user'" class="perm-content">
      <!-- 左侧已分配权限的用户列表 -->
      <div class="list-panel">
        <div class="panel-header">
          <h3>已分配权限的用户</h3>
          <div class="header-actions">
            <el-input v-model="userSearch" placeholder="搜索用户" size="small" clearable style="width: 120px" />
            <el-button
              v-if="permStore.hasPermission('permission:assign')"
              type="primary"
              size="small"
              @click="showAddUserDialog"
            >
              新增
            </el-button>
          </div>
        </div>
        <el-scrollbar class="scroll-area">
          <el-table
            :data="filteredAssignedUsers"
            stripe
            border
            size="small"
            highlight-current-row
            @current-change="handleUserChange"
            style="width: 100%"
          >
            <el-table-column prop="user_name" label="姓名" min-width="80" show-overflow-tooltip />
            <el-table-column prop="account" label="账号" min-width="100" show-overflow-tooltip />
            <el-table-column prop="permission_count" label="权限数" width="70" align="center" />
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope">
                <el-button type="danger" link size="small" @click.stop="removeUserPermissions(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
      </div>

      <!-- 右侧权限配置 -->
      <div class="permission-panel">
        <div class="panel-header">
          <h3>{{ currentUser ? currentUser.user_name + ' - 个人权限' : '个人权限' }}</h3>
          <el-button
            v-if="permStore.hasPermission('permission:assign') && currentUser"
            type="primary"
            size="small"
            @click="saveUserPermissions"
          >
            保存权限
          </el-button>
        </div>
        <el-scrollbar v-if="currentUser" class="scroll-area">
          <div class="permission-content">
            <el-alert
              title="个人权限会叠加到角色权限之上"
              type="info"
              :closable="false"
              style="margin-bottom: 16px"
            />
            <PermissionTree
              :permissions="allPermissions"
              :selected="selectedUserPermissions"
              @update:selected="selectedUserPermissions = $event"
            />
          </div>
        </el-scrollbar>
        <el-empty v-else description="请选择用户查看权限" />
      </div>
    </div>

    <!-- 部门权限 -->
    <div v-show="activeTab === 'dept'" class="perm-content">
      <!-- 左侧已分配权限的部门列表 -->
      <div class="list-panel">
        <div class="panel-header">
          <h3>已分配权限的部门</h3>
          <div class="header-actions">
            <el-input v-model="deptSearch" placeholder="搜索部门或人员" size="small" clearable style="width: 140px" />
            <el-button
              v-if="permStore.hasPermission('permission:assign')"
              type="primary"
              size="small"
              @click="showAddDeptDialog"
            >
              新增
            </el-button>
          </div>
        </div>
        <el-scrollbar class="scroll-area">
          <el-table
            :data="filteredAssignedDepts"
            stripe
            border
            size="small"
            highlight-current-row
            @current-change="handleDeptChange"
            style="width: 100%"
          >
            <el-table-column prop="dept_code" label="部门编码" min-width="80" show-overflow-tooltip />
            <el-table-column prop="dept_name" label="部门名称" min-width="100" show-overflow-tooltip />
            <el-table-column label="范围" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.target_type === 'dept' ? 'success' : 'warning'" size="small">
                  {{ scope.row.target_type === 'dept' ? '本部门' : '含下级' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="permission_count" label="权限数" width="60" align="center" />
            <el-table-column label="操作" width="50" align="center" fixed="right">
              <template #default="scope">
                <el-button type="danger" link size="small" @click.stop="removeDeptPermissions(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
      </div>

      <!-- 右侧权限配置 -->
      <div class="permission-panel">
        <div class="panel-header">
          <h3 v-if="currentDept">
            {{ currentDept.dept_name }} - 部门权限
            <el-radio-group v-model="currentDept.target_type" size="small" style="margin-left: 16px" disabled>
              <el-radio-button label="dept">仅本部门</el-radio-button>
              <el-radio-button label="dept_tree">本部门及下级</el-radio-button>
            </el-radio-group>
          </h3>
          <h3 v-else>部门权限</h3>
          <el-button
            v-if="permStore.hasPermission('permission:assign') && currentDept"
            type="primary"
            size="small"
            @click="saveDeptPermissions"
          >
            保存权限
          </el-button>
        </div>
        <el-scrollbar v-if="currentDept" class="scroll-area">
          <div class="permission-content">
            <el-alert
              :title="currentDept.target_type === 'dept' ? '仅本部门员工可获得这些权限' : '本部门及所有下级部门的员工可获得这些权限'"
              type="info"
              :closable="false"
              style="margin-bottom: 16px"
            />
            <PermissionTree
              :permissions="allPermissions"
              :selected="selectedDeptPermissions"
              @update:selected="selectedDeptPermissions = $event"
            />
          </div>
        </el-scrollbar>
        <el-empty v-else description="请选择部门查看权限" />
      </div>
    </div>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleForm.id ? '编辑角色' : '新增角色'" width="450" destroy-on-close>
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="80px">
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码" :disabled="!!roleForm.id" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户权限对话框 -->
    <EmployeeSelector
      v-model="addUserDialogVisible"
      :multiple="false"
      :exclude-ids="assignedUserIds"
      @confirm="handleUserSelectorConfirm"
    />

    <!-- 新增部门权限对话框 -->
    <el-dialog v-model="addDeptDialogVisible" title="选择部门" width="500">
      <div class="dialog-content">
        <el-input v-model="deptDialogSearch" placeholder="搜索部门名称" clearable style="margin-bottom: 12px" />
        <el-tree
          ref="addDeptTreeRef"
          :data="deptTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          default-expand-all
          :filter-node-method="filterDeptNode"
          @current-change="handleSelectDept"
          style="max-height: 400px; overflow: auto"
        />
        <div style="margin-top: 12px">
          <el-radio-group v-model="newDeptType">
            <el-radio label="dept">仅本部门</el-radio>
            <el-radio label="dept_tree">本部门及下级</el-radio>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="addDeptDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedNewDept" @click="confirmAddDept">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'
import PermissionTree from '../components/PermissionTree.vue'
import EmployeeSelector from '../components/EmployeeSelector.vue'

const permStore = usePermissionStore()
const authStore = useAuthStore()

function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

// Tab 状态
const activeTab = ref('role')

// ==================== 角色权限 ====================
const roles = ref([])
const roleSearch = ref('')
const currentRole = ref(null)
const selectedPermissions = ref([])
const roleUsers = ref({}) // 角色ID -> 用户列表

// 角色对话框
const roleDialogVisible = ref(false)
const roleFormRef = ref(null)
const roleForm = ref({
  id: null,
  code: '',
  name: '',
  description: ''
})
const roleRules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// 过滤角色列表（支持按角色名和人员名搜索）
const filteredRoles = computed(() => {
  if (!roleSearch.value) return roles.value
  const keyword = roleSearch.value.toLowerCase()
  return roles.value.filter(r => {
    // 匹配角色名
    if (r.name?.toLowerCase().includes(keyword) || r.code?.toLowerCase().includes(keyword)) {
      return true
    }
    // 匹配人员名
    const users = roleUsers.value[r.id] || []
    return users.some(u => u.name?.toLowerCase().includes(keyword) || u.account?.toLowerCase().includes(keyword))
  })
})

// 获取角色的用户名称列表
function getRoleUserNames(roleId) {
  const users = roleUsers.value[roleId] || []
  if (users.length === 0) return '-'
  if (users.length <= 3) {
    return users.map(u => u.name).join('、')
  }
  return `${users.slice(0, 3).map(u => u.name).join('、')} 等${users.length}人`
}

// ==================== 个人权限 ====================
const allUsers = ref([])
const assignedUsers = ref([])
const userSearch = ref('')
const currentUser = ref(null)
const selectedUserPermissions = ref([])

// 新增用户对话框
const addUserDialogVisible = ref(false)

// 已分配用户ID列表（用于排除）
const assignedUserIds = computed(() => assignedUsers.value.map(u => u.target_id))

// 过滤已分配用户列表
const filteredAssignedUsers = computed(() => {
  if (!userSearch.value) return assignedUsers.value
  const keyword = userSearch.value.toLowerCase()
  return assignedUsers.value.filter(u =>
    u.user_name?.toLowerCase().includes(keyword) ||
    u.account?.toLowerCase().includes(keyword)
  )
})

// ==================== 部门权限 ====================
const deptTree = ref([])
const assignedDepts = ref([])
const deptSearch = ref('')
const currentDept = ref(null)
const selectedDeptPermissions = ref([])

// 新增部门对话框
const addDeptDialogVisible = ref(false)
const deptDialogSearch = ref('')
const selectedNewDept = ref(null)
const newDeptType = ref('dept')
const addDeptTreeRef = ref(null)

// 过滤已分配部门列表（支持按部门名、人员名、账号搜索）
const filteredAssignedDepts = computed(() => {
  if (!deptSearch.value) return assignedDepts.value
  const keyword = deptSearch.value.toLowerCase()
  return assignedDepts.value.filter(d => {
    // 匹配部门名
    if (d.dept_name?.toLowerCase().includes(keyword)) {
      return true
    }
    // 匹配人员名
    if (d.user_names?.toLowerCase().includes(keyword)) {
      return true
    }
    // 匹配人员账号
    if (d.user_accounts?.toLowerCase().includes(keyword)) {
      return true
    }
    return false
  })
})

// 部门树过滤方法
function filterDeptNode(value, data) {
  if (!value) return true
  return data.name?.toLowerCase().includes(value.toLowerCase())
}

// 监听对话框搜索，过滤部门树
watch(deptDialogSearch, (val) => {
  if (addDeptTreeRef.value) {
    addDeptTreeRef.value.filter(val)
  }
})

// ==================== 所有权限 ====================
const allPermissions = ref([])

// ==================== 数据加载 ====================

async function loadRoles() {
  roles.value = await window.electronAPI.perm.getRoles()
  // 加载每个角色的用户和权限数量
  for (const role of roles.value) {
    const users = await window.electronAPI.perm.getRoleUsers(role.id)
    roleUsers.value[role.id] = users
    // 获取角色权限数量
    const perms = await window.electronAPI.perm.getRolePermissions(role.id)
    role.permission_count = perms.length
  }
}

async function loadAllUsers() {
  allUsers.value = await window.electronAPI.emp.getAll()
}

async function loadAssignedUsers() {
  const assignments = await window.electronAPI.perm.getPermissionAssignments('user')
  const userMap = {}
  assignments.forEach(a => {
    if (!userMap[a.target_id]) {
      const userInfo = allUsers.value.find(u => u.id === a.target_id)
      userMap[a.target_id] = {
        target_id: a.target_id,
        target_type: 'user',
        user_name: a.user_name || userInfo?.name || '未知',
        account: userInfo?.account || '',
        permission_count: 0,
        permissions: []
      }
    }
    userMap[a.target_id].permission_count++
    userMap[a.target_id].permissions.push(a.permission_code)
  })
  assignedUsers.value = Object.values(userMap)
}

async function loadDeptTree() {
  const list = await window.electronAPI.dept.getAll()
  const map = {}
  list.forEach(d => {
    map[d.id] = { ...d, children: [] }
  })
  const tree = []
  list.forEach(d => {
    const node = map[d.id]
    if (d.parent_id && map[d.parent_id]) {
      map[d.parent_id].children.push(node)
    } else {
      tree.push(node)
    }
  })
  deptTree.value = tree
}

async function loadAssignedDepts() {
  const assignments = await window.electronAPI.perm.getPermissionAssignments('dept')
  const treeAssignments = await window.electronAPI.perm.getPermissionAssignments('dept_tree')

  const allAssignments = [
    ...assignments.map(a => ({ ...a, target_type: 'dept' })),
    ...treeAssignments.map(a => ({ ...a, target_type: 'dept_tree' }))
  ]

  const deptMap = {}
  allAssignments.forEach(a => {
    const key = `${a.target_id}_${a.target_type}`
    if (!deptMap[key]) {
      deptMap[key] = {
        target_id: a.target_id,
        target_type: a.target_type,
        dept_code: a.dept_code || '',
        dept_name: a.dept_name || '未知部门',
        permission_count: 0,
        permissions: [],
        user_names: '',
        user_accounts: '' // 用于搜索
      }
    }
    deptMap[key].permission_count++
    deptMap[key].permissions.push(a.permission_code)
  })

  // 获取每个部门的员工名称和账号
  const depts = await window.electronAPI.dept.getAll()
  const deptPathMap = {}
  const deptCodeMap = {}
  depts.forEach(d => {
    deptPathMap[d.id] = d.path_ids || ''
    deptCodeMap[d.id] = d.code || ''
  })

  for (const key of Object.keys(deptMap)) {
    const dept = deptMap[key]
    const deptId = dept.target_id
    // 补充部门编码
    if (!dept.dept_code) {
      dept.dept_code = deptCodeMap[deptId] || ''
    }
    const includeChildren = dept.target_type === 'dept_tree'

    // 筛选员工
    const matchedUsers = allUsers.value.filter(u => {
      if (!u.department_id) return false
      if (includeChildren) {
        // 包含下级：员工部门路径以目标部门路径开头
        const userDeptPath = deptPathMap[u.department_id] || ''
        const targetDeptPath = deptPathMap[deptId] || ''
        return userDeptPath.startsWith(targetDeptPath) || userDeptPath.includes('/' + targetDeptPath)
      } else {
        // 仅本部门
        return u.department_id === deptId
      }
    })

    if (matchedUsers.length > 0) {
      const names = matchedUsers.slice(0, 5).map(u => u.name)
      const accounts = matchedUsers.map(u => u.account).join(',')
      if (matchedUsers.length > 5) {
        dept.user_names = `${names.join('、')} 等${matchedUsers.length}人`
      } else {
        dept.user_names = names.join('、')
      }
      dept.user_accounts = accounts // 保存所有账号用于搜索
    }
  }

  assignedDepts.value = Object.values(deptMap)
}

async function loadPermissions() {
  allPermissions.value = await window.electronAPI.perm.getAllPermissions()
}

// ==================== 角色操作 ====================

/**
 * 显示新增角色对话框
 */
function showAddRoleDialog() {
  roleForm.value = { id: null, code: '', name: '', description: '' }
  roleDialogVisible.value = true
}

/**
 * 显示编辑角色对话框
 */
function showEditRoleDialog(row) {
  roleForm.value = { id: row.id, code: row.code, name: row.name, description: row.description || '' }
  roleDialogVisible.value = true
}

/**
 * 保存角色
 */
async function handleSaveRole() {
  try {
    await roleFormRef.value.validate()
  } catch {
    return
  }

  const form = roleForm.value
  const operator = getOperator()

  if (form.id) {
    // 编辑
    await window.electronAPI.perm.updateRole(form.id, { name: form.name, description: form.description }, operator)
    // 更新本地数据
    const role = roles.value.find(r => r.id === form.id)
    if (role) {
      role.name = form.name
      role.description = form.description
    }
    ElMessage.success('角色更新成功')
  } else {
    // 新增
    const newId = await window.electronAPI.perm.addRole({ code: form.code, name: form.name, description: form.description }, operator)
    roles.value.push({ id: newId, code: form.code, name: form.name, description: form.description, is_system: false })
    roleUsers.value[newId] = []
    ElMessage.success('角色新增成功')
  }

  roleDialogVisible.value = false
}

/**
 * 删除角色
 */
async function handleDeleteRole(row) {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await window.electronAPI.perm.deleteRole(row.id, getOperator())
    // 从列表中移除
    const index = roles.value.findIndex(r => r.id === row.id)
    if (index > -1) {
      roles.value.splice(index, 1)
    }
    delete roleUsers.value[row.id]
    // 如果当前选中的是被删除的角色，清空选择
    if (currentRole.value?.id === row.id) {
      currentRole.value = null
      selectedPermissions.value = []
    }
    ElMessage.success('角色删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + e.message)
    }
  }
}

// ==================== 事件处理 ====================

async function handleRoleChange(row) {
  currentRole.value = row
  if (row) {
    const rolePerms = await window.electronAPI.perm.getRolePermissions(row.id)
    selectedPermissions.value = rolePerms
  } else {
    selectedPermissions.value = []
  }
}

function handleUserChange(row) {
  currentUser.value = row
  if (row) {
    selectedUserPermissions.value = row.permissions || []
  } else {
    selectedUserPermissions.value = []
  }
}

function handleDeptChange(row) {
  currentDept.value = row
  if (row) {
    selectedDeptPermissions.value = row.permissions || []
  } else {
    selectedDeptPermissions.value = []
  }
}

async function saveRolePermissions() {
  if (!currentRole.value) return
  const permissionsToSave = JSON.parse(JSON.stringify(selectedPermissions.value))
  await window.electronAPI.perm.setRolePermissions(currentRole.value.id, permissionsToSave, getOperator())
  // 更新权限数量
  currentRole.value.permission_count = permissionsToSave.length
  ElMessage.success('权限保存成功')
}

async function saveUserPermissions() {
  if (!currentUser.value) return
  const permissionsToSave = JSON.parse(JSON.stringify(selectedUserPermissions.value))
  await window.electronAPI.perm.setUserDirectPermissions(currentUser.value.target_id, permissionsToSave, getOperator())
  currentUser.value.permissions = permissionsToSave
  currentUser.value.permission_count = permissionsToSave.length
  ElMessage.success('权限保存成功')
}

async function saveDeptPermissions() {
  if (!currentDept.value) return
  const permissionsToSave = JSON.parse(JSON.stringify(selectedDeptPermissions.value))
  const includeChildren = currentDept.value.target_type === 'dept_tree'
  await window.electronAPI.perm.setDeptPermissions(currentDept.value.target_id, permissionsToSave, includeChildren, getOperator())
  currentDept.value.permissions = permissionsToSave
  currentDept.value.permission_count = permissionsToSave.length
  ElMessage.success('权限保存成功')
}

function showAddUserDialog() {
  addUserDialogVisible.value = true
}

/**
 * 用户选择器确认
 */
function handleUserSelectorConfirm(selectedUsers) {
  if (selectedUsers.length === 0) return

  const user = selectedUsers[0]
  const newUser = {
    target_id: user.id,
    target_type: 'user',
    user_name: user.name,
    account: user.account,
    permission_count: 0,
    permissions: []
  }
  assignedUsers.value.push(newUser)

  currentUser.value = newUser
  selectedUserPermissions.value = []

  ElMessage.success('已添加用户，请配置权限')
}

async function removeUserPermissions(row) {
  try {
    await ElMessageBox.confirm(`确定要删除 ${row.user_name} 的个人权限吗？`, '提示', { type: 'warning' })
    await window.electronAPI.perm.setUserDirectPermissions(row.target_id, [], getOperator())
    const index = assignedUsers.value.findIndex(u => u.target_id === row.target_id)
    if (index > -1) {
      assignedUsers.value.splice(index, 1)
    }
    if (currentUser.value?.target_id === row.target_id) {
      currentUser.value = null
      selectedUserPermissions.value = []
    }
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + e.message)
    }
  }
}

function showAddDeptDialog() {
  deptDialogSearch.value = ''
  selectedNewDept.value = null
  newDeptType.value = 'dept'
  addDeptDialogVisible.value = true
}

function handleSelectDept(data) {
  selectedNewDept.value = data
}

async function confirmAddDept() {
  if (!selectedNewDept.value) return

  const exists = assignedDepts.value.find(
    d => d.target_id === selectedNewDept.value.id && d.target_type === newDeptType.value
  )
  if (exists) {
    ElMessage.warning('该部门已存在相同类型的权限配置')
    return
  }

  const newDept = {
    target_id: selectedNewDept.value.id,
    target_type: newDeptType.value,
    dept_code: selectedNewDept.value.code || '',
    dept_name: selectedNewDept.value.name,
    permission_count: 0,
    permissions: [],
    user_names: ''
  }
  assignedDepts.value.push(newDept)

  currentDept.value = newDept
  selectedDeptPermissions.value = []

  addDeptDialogVisible.value = false
  ElMessage.success('已添加部门，请配置权限')
}

async function removeDeptPermissions(row) {
  try {
    await ElMessageBox.confirm(`确定要删除 ${row.dept_name} 的权限配置吗？`, '提示', { type: 'warning' })
    const includeChildren = row.target_type === 'dept_tree'
    await window.electronAPI.perm.setDeptPermissions(row.target_id, [], includeChildren, getOperator())
    const index = assignedDepts.value.findIndex(
      d => d.target_id === row.target_id && d.target_type === row.target_type
    )
    if (index > -1) {
      assignedDepts.value.splice(index, 1)
    }
    if (currentDept.value?.target_id === row.target_id && currentDept.value?.target_type === row.target_type) {
      currentDept.value = null
      selectedDeptPermissions.value = []
    }
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + e.message)
    }
  }
}

function handleTabChange(tab) {
  if (tab === 'role') {
    currentRole.value = null
    selectedPermissions.value = []
  } else if (tab === 'user') {
    currentUser.value = null
    selectedUserPermissions.value = []
  } else if (tab === 'dept') {
    currentDept.value = null
    selectedDeptPermissions.value = []
  }
}

onMounted(async () => {
  await Promise.all([
    loadRoles(),
    loadAllUsers(),
    loadDeptTree(),
    loadPermissions()
  ])
  await Promise.all([
    loadAssignedUsers(),
    loadAssignedDepts()
  ])
})
</script>

<style scoped>
.role-perm-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.perm-tabs {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.perm-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.perm-content {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.list-panel {
  width: 420px;
  min-width: 420px;
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
  padding: 12px 16px;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 15px;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px 16px;
}

.scroll-area :deep(.el-scrollbar__view) {
  height: 100%;
}

.scroll-area :deep(.el-table) {
  width: 100% !important;
}

.permission-content {
  padding: 0;
}

.dialog-content {
  min-height: 200px;
}

.user-names {
  font-size: 12px;
  color: #64748b;
}
</style>
