<template>
  <div class="dept-layout">
    <!-- 左侧部门树 -->
    <div class="dept-tree-panel">
      <div class="tree-header">
        <h3>组织架构</h3>
        <el-button type="primary" size="small" @click="openDialog()">+ 新增</el-button>
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
                <el-radio-group v-model="childMode" size="small">
                  <el-radio-button label="direct">直接子部门</el-radio-button>
                  <el-radio-button label="all">所有子部门</el-radio-button>
                </el-radio-group>
              </div>
            <el-table :data="childDepartments" stripe border size="small" v-loading="loading">
              <el-table-column type="index" label="序号" width="60" align="center" />
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
                    <el-button link type="primary" size="small" @click="openDialog(scope.row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="remove(scope.row)">删除</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="currentDept && childDepartments.length === 0" description="暂无子部门" />
        </div>
      </el-scrollbar>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑部门' : '新增部门'" width="480px">
      <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
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

const deptStore = useDeptStore()
const { list: deptList, treeData } = storeToRefs(deptStore)

const loading = ref(false)
const employees = ref([])
const treeFilter = ref('')
const treeRef = ref()
const currentDept = ref(null)

const childMode = ref('direct')

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, name: '', description: '', parent_id: 0 })
const rules = { name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] }

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

function handleNodeClick(data) {
  currentDept.value = data
}

watch(treeFilter, (val) => {
  treeRef.value?.filter(val)
})

function filterNode(value, data) {
  if (!value) return true
  return data.name && data.name.includes(value)
}

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

function openDialog(row) {
  if (row) {
    form.id = row.id
    form.name = row.name
    form.description = row.description || ''
    form.parent_id = row.parent_id || 0
  } else {
    form.id = null
    form.name = ''
    form.description = ''
    form.parent_id = currentDept.value ? currentDept.value.id : 0
  }
  dialogVisible.value = true
}

async function save() {
  await formRef.value.validate()
  const pid = form.parent_id === '' ? 0 : (form.parent_id || 0)
  if (form.id) {
    await window.electronAPI.dept.update(form.id, form.name, form.description, pid)
    ElMessage.success('更新成功')
  } else {
    await window.electronAPI.dept.add(form.name, form.description, pid)
    ElMessage.success('添加成功')
  }
  dialogVisible.value = false
  await load()
}

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
  await window.electronAPI.dept.delete(row.id)
  ElMessage.success('删除成功')
  currentDept.value = null
  await load()
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
</style>
