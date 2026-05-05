<template>
  <div class="dept-layout">
    <!-- 左侧部门树 -->
    <div class="dept-tree-panel">
      <div class="tree-header">
        <h3>组织架构</h3>
        <el-button v-if="permStore.hasPermission('dept:add')" type="primary" size="small" @click="openDialog()">+ 新增</el-button>
      </div>
      <el-input
        v-model="treeFilter"
        placeholder="搜索部门"
        clearable
        size="small"
        style="margin: 0 16px 8px 16px; width: calc(100% - 32px)"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-scrollbar class="tree-scroll">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        />
      </el-scrollbar>
    </div>

    <!-- 右侧内容 -->
    <div class="dept-content">
      <el-scrollbar class="content-scroll">
        <div class="content-inner">

              <div class="child-list-header">
                <span>{{ currentDept ? currentDept.name + ' - 部门列表' : '部门列表' }}</span>
                <div class="header-actions">
                  <el-button v-if="permStore.hasPermission('dept:export')" plain size="small" @click="exportData">导出</el-button>
                  <el-radio-group v-model="childMode" size="small">
                    <el-radio-button label="direct">直接子部门</el-radio-button>
                    <el-radio-button label="all">所有子部门</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            <el-table :data="pagedDepartments" stripe border size="small" v-loading="loading">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="code" label="部门编码" width="120">
                <template #default="scope">{{ scope.row.code || '-' }}</template>
              </el-table-column>
              <el-table-column prop="name" label="部门名称" min-width="160">
                <template #default="scope">
                  <el-icon style="margin-right: 4px"><Document /></el-icon>
                  {{ scope.row.name }}
                </template>
              </el-table-column>
              <el-table-column label="路径" min-width="260">
                <template #default="scope">{{ scope.row.path_names || '-' }}</template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="160" />
              <el-table-column label="操作" width="140" align="center">
                <template #default="scope">
                  <template v-if="(scope.row.parent_id || 0) !== 0">
                    <el-button v-if="permStore.hasPermission('dept:edit')" link type="primary" size="small" @click="openDialog(scope.row)">编辑</el-button>
                    <el-button v-if="permStore.hasPermission('dept:delete')" link type="danger" size="small" @click="remove(scope.row)">删除</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-footer">
              <span class="footer-count">共 {{ childDepartments.length }} 条</span>
              <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                layout="prev, pager, next, sizes"
                :total="childDepartments.length"
                background
                small
              />
            </div>
            <el-empty v-if="currentDept && childDepartments.length === 0" description="暂无子部门" />
        </div>
      </el-scrollbar>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑部门' : '新增部门'" width="480px">
      <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入部门编码（唯一）" />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.parent_id"
            :data="parentOptionsTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            placeholder="请选择上级部门（空则为根部门）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入部门描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { useDeptStore } from '../stores/dept.js'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'
import * as XLSX from 'xlsx'

const deptStore = useDeptStore()
const permStore = usePermissionStore()
const authStore = useAuthStore()
const { list: deptList, treeData } = storeToRefs(deptStore)

/**
 * 获取当前操作人信息
 * @returns {Object|null} 操作人信息 { id, name } 或 null
 */
function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

const loading = ref(false)
const employees = ref([])
const treeFilter = ref('')
const treeRef = ref()
const currentDept = ref(null)

const childMode = ref('direct')
const page = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, code: '', name: '', description: '', parent_id: 0 })
const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
}

/**
 * 加载部门列表和员工数据
 */
async function load() {
  loading.value = true
  await deptStore.loadAll()
  employees.value = await window.electronAPI.emp.getAll()
  loading.value = false
  nextTick(() => {
    if (treeData.value.length > 0 && !currentDept.value) {
      currentDept.value = treeData.value[0]
      treeRef.value?.setCurrentKey(treeData.value[0].id)
    }
  })
}

const childDepartments = computed(() => {
  if (!currentDept.value) return []
  if (childMode.value === 'direct') {
    return deptList.value.filter(d => (d.parent_id || 0) == currentDept.value.id)
  }
  // all: 递归收集所有子部门
  const result = []
  function collect(pid) {
    const children = deptList.value.filter(d => (d.parent_id || 0) == pid)
    children.forEach(child => {
      result.push(child)
      collect(child.id)
    })
  }
  collect(currentDept.value.id)
  return result
})

/**
 * 分页后的部门列表
 */
const pagedDepartments = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return childDepartments.value.slice(start, start + pageSize.value)
})

/**
 * 处理部门树节点点击事件
 * @param {Object} data - 点击的部门数据
 */
function handleNodeClick(data) {
  currentDept.value = data
  page.value = 1 // 切换部门时重置页码
}

watch(treeFilter, (val) => {
  treeRef.value?.filter(val)
})

// 切换模式时重置页码
watch(childMode, () => {
  page.value = 1
})

/**
 * 过滤部门树节点
 * @param {string} value - 搜索关键词
 * @param {Object} data - 部门节点数据
 * @returns {boolean} 是否匹配
 */
function filterNode(value, data) {
  if (!value) return true
  return data.name && data.name.includes(value)
}

/**
 * 构建部门树结构
 * @param {Array} items - 部门列表
 * @returns {Array} 树形结构的部门数组
 */
function buildTree(items) {
  const map = {}
  items.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })
  const tree = []
  items.forEach(item => {
    const pid = item.parent_id || 0
    if (pid !== 0 && map[pid]) {
      map[pid].children.push(map[item.id])
    } else {
      tree.push(map[item.id])
    }
  })
  return tree
}

const parentOptionsTree = computed(() => {
  if (!form.id) return treeData.value
  const excludeIds = new Set()
  function collect(id) {
    excludeIds.add(id)
    deptList.value.filter(d => (d.parent_id || 0) == id).forEach(d => collect(d.id))
  }
  collect(form.id)
  return buildTree(deptList.value.filter(d => !excludeIds.has(d.id)))
})

/**
 * 打开部门编辑/新增弹窗
 * @param {Object} [row] - 部门数据，不传则为新增模式
 */
function openDialog(row) {
  if (row) {
    form.id = row.id
    form.code = row.code || ''
    form.name = row.name
    form.description = row.description || ''
    form.parent_id = row.parent_id || 0
  } else {
    form.id = null
    form.code = ''
    form.name = ''
    form.description = ''
    form.parent_id = currentDept.value ? currentDept.value.id : 0
  }
  dialogVisible.value = true
}

/**
 * 保存部门信息（新增或更新）
 */
async function save() {
  try {
    await formRef.value.validate()
    const pid = form.parent_id === '' ? 0 : (form.parent_id || 0)
    const operator = getOperator()
    if (form.id) {
      await window.electronAPI.dept.update(form.id, form.name, form.code, form.description, pid, operator)
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.dept.add(form.name, form.code, form.description, pid, operator)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    console.error('保存失败:', error)
    // 提取实际的错误消息，去掉 IPC 包装信息
    let msg = error.message || '保存失败'
    const match = msg.match(/Error:\s*(.+)$/)
    if (match) {
      msg = match[1].trim()
    }
    ElMessage.error(msg)
  }
}

/**
 * 删除部门
 * @param {Object} row - 部门数据
 */
async function remove(row) {
  const children = await window.electronAPI.dept.getChildren(row.id)
  if (children && children.length > 0) {
    ElMessage.warning('该部门下存在子部门，请先删除子部门')
    return
  }
  const empInDept = employees.value.filter(e => Number(e.department_id) === Number(row.id))
  if (empInDept.length > 0) {
    ElMessage.warning(`该部门下存在 ${empInDept.length} 名员工，请先转移或删除员工`)
    return
  }
  await ElMessageBox.confirm(`确定删除部门「${row.name}」吗？`, '提示', { type: 'warning' })
  await window.electronAPI.dept.delete(row.id, getOperator())
  ElMessage.success('删除成功')
  currentDept.value = null
  await load()
}

/**
 * 导出部门数据为Excel
 */
function exportData() {
  // 准备Excel数据
  const data = childDepartments.value.map(d => ({
    '部门名称': d.name || '',
    '部门路径': d.path_names || '',
    '描述': d.description || '',
    '员工数量': getDeptEmployeeCount(d.id)
  }))

  // 创建工作簿和工作表
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  ws['!cols'] = [
    { wch: 20 },  // 部门名称
    { wch: 30 },  // 部门路径
    { wch: 25 },  // 描述
    { wch: 10 }   // 员工数量
  ]

  XLSX.utils.book_append_sheet(wb, ws, '部门信息')

  // 导出文件
  const fileName = currentDept.value ? `${currentDept.value.name}_部门信息.xlsx` : '部门信息.xlsx'
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

/**
 * 获取部门员工数量
 * @param {number} deptId - 部门ID
 * @returns {number} 员工数量
 */
function getDeptEmployeeCount(deptId) {
  return employees.value.filter(e => Number(e.department_id) === Number(deptId)).length
}

onMounted(load)
</script>

<style scoped>
.dept-layout {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
.dept-tree-panel {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  padding-bottom: 12px;
  flex-shrink: 0;
}
.tree-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}
.tree-scroll {
  flex: 1;
  min-height: 0;
}
.tree-scroll :deep(.el-scrollbar__view) {
  padding: 0 16px 16px 16px;
}
.dept-content {
  flex: 1;
  height: 100%;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.content-scroll {
  flex: 1;
  min-height: 0;
}
.content-inner {
  padding: 16px;
  min-height: 100%;
}
.child-list-card {
  border: none;
  box-shadow: none;
}
.child-list-card :deep(.el-card__header) {
  padding: 0;
  border-bottom: none;
}
.child-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
.footer-count {
  color: #64748b;
  font-size: 13px;
}
</style>
