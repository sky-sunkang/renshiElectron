<template>
  <div class="dict-page">
    <!-- 左侧字典类型列表 -->
    <div class="dict-type-panel">
      <div class="panel-header">
        <h3>字典类型</h3>
        <el-button v-if="permStore.hasPermission('dict:add')" type="primary" size="small" @click="openTypeDialog()">+ 新增</el-button>
      </div>
      <el-scrollbar class="type-scroll">
        <el-table :data="types" stripe border size="small" highlight-current-row @current-change="handleTypeChange" style="width: 100%">
          <el-table-column prop="code" label="类型编码" min-width="80" show-overflow-tooltip />
          <el-table-column prop="name" label="类型名称" min-width="80" show-overflow-tooltip />
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button v-if="permStore.hasPermission('dict:edit')" link type="primary" size="small" @click="openTypeDialog(scope.row)">编辑</el-button>
              <el-button v-if="permStore.hasPermission('dict:delete')" link type="danger" size="small" @click="removeType(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </div>

    <!-- 右侧字典项列表 -->
    <div class="dict-item-panel">
      <div class="panel-header">
        <h3>{{ currentType ? currentType.name + ' - 字典项' : '字典项' }}</h3>
        <el-button v-if="permStore.hasPermission('dict:item:add')" type="primary" size="small" :disabled="!currentType" @click="openItemDialog()">+ 新增</el-button>
      </div>
      <el-scrollbar class="item-scroll">
        <el-table :data="items" stripe border size="small" v-loading="loading">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="label" label="显示名称" min-width="120" />
          <el-table-column prop="value" label="选项值" min-width="120" />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="140" align="center">
            <template #default="scope">
              <el-button v-if="permStore.hasPermission('dict:item:edit')" link type="primary" size="small" @click="openItemDialog(scope.row)">编辑</el-button>
              <el-button v-if="permStore.hasPermission('dict:item:delete')" link type="danger" size="small" @click="removeItem(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="currentType && items.length === 0" description="暂无字典项" />
      </el-scrollbar>
    </div>

    <!-- 字典类型弹窗 -->
    <el-dialog v-model="typeDialogVisible" :title="typeForm.id ? '编辑字典类型' : '新增字典类型'" width="400px">
      <el-form :model="typeForm" label-width="90px" :rules="typeRules" ref="typeFormRef">
        <el-form-item label="类型编码" prop="code">
          <el-input v-model="typeForm.code" placeholder="如 gender" />
        </el-form-item>
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="如 性别" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="typeForm.description" type="textarea" :rows="2" placeholder="类型描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典项弹窗 -->
    <el-dialog v-model="itemDialogVisible" :title="itemForm.id ? '编辑字典项' : '新增字典项'" width="400px">
      <el-form :model="itemForm" label-width="90px" :rules="itemRules" ref="itemFormRef">
        <el-form-item label="显示名称" prop="label">
          <el-input v-model="itemForm.label" placeholder="如 男" />
        </el-form-item>
        <el-form-item label="选项值" prop="value">
          <el-input v-model="itemForm.value" placeholder="如 男" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'

const permStore = usePermissionStore()
const authStore = useAuthStore()

/** 获取当前操作人信息 */
function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

// 字典类型数据
const types = ref([])
const currentType = ref(null)
const loading = ref(false)

// 字典项数据
const items = ref([])

// 字典类型弹窗
const typeDialogVisible = ref(false)
const typeFormRef = ref()
const typeForm = reactive({ id: null, code: '', name: '', description: '' })
const typeRules = {
  code: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }]
}

// 字典项弹窗
const itemDialogVisible = ref(false)
const itemFormRef = ref()
const itemForm = reactive({ id: null, type_code: '', label: '', value: '', sort: 0 })
const itemRules = {
  label: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入选项值', trigger: 'blur' }]
}

/**
 * 加载所有字典类型
 */
async function loadTypes() {
  types.value = await window.electronAPI.dict.getTypes()
}

/**
 * 加载当前类型的字典项
 */
async function loadItems() {
  if (!currentType.value) {
    items.value = []
    return
  }
  loading.value = true
  items.value = await window.electronAPI.dict.getItems(currentType.value.code)
  loading.value = false
}

/**
 * 选择字典类型时加载对应字典项
 * @param {Object} row - 选中的字典类型行
 */
function handleTypeChange(row) {
  currentType.value = row
  loadItems()
}

/**
 * 打开字典类型弹窗
 * @param {Object} row - 编辑时传入的行数据
 */
function openTypeDialog(row) {
  if (row) {
    typeForm.id = row.id
    typeForm.code = row.code
    typeForm.name = row.name
    typeForm.description = row.description || ''
  } else {
    Object.assign(typeForm, { id: null, code: '', name: '', description: '' })
  }
  typeDialogVisible.value = true
}

/**
 * 保存字典类型
 */
async function saveType() {
  await typeFormRef.value.validate()
  const operator = getOperator()
  if (typeForm.id) {
    await window.electronAPI.dict.updateType(typeForm.id, typeForm.code, typeForm.name, typeForm.description, operator)
    ElMessage.success('更新成功')
  } else {
    await window.electronAPI.dict.addType(typeForm.code, typeForm.name, typeForm.description, operator)
    ElMessage.success('添加成功')
  }
  typeDialogVisible.value = false
  await loadTypes()
}

/**
 * 删除字典类型
 * @param {Object} row - 要删除的行数据
 */
async function removeType(row) {
  // 检查是否有字典项
  const typeItems = await window.electronAPI.dict.getItems(row.code)
  if (typeItems && typeItems.length > 0) {
    ElMessage.warning(`该类型下有 ${typeItems.length} 个字典项，请先删除字典项`)
    return
  }
  await ElMessageBox.confirm(`确定删除字典类型「${row.name}」吗？`, '提示', { type: 'warning' })
  await window.electronAPI.dict.deleteType(row.id, getOperator())
  ElMessage.success('删除成功')
  currentType.value = null
  items.value = []
  await loadTypes()
}

/**
 * 打开字典项弹窗
 * @param {Object} row - 编辑时传入的行数据
 */
function openItemDialog(row) {
  if (row) {
    itemForm.id = row.id
    itemForm.type_code = currentType.value.code
    itemForm.label = row.label
    itemForm.value = row.value
    itemForm.sort = row.sort || 0
  } else {
    Object.assign(itemForm, { id: null, type_code: currentType.value.code, label: '', value: '', sort: 0 })
  }
  itemDialogVisible.value = true
}

/**
 * 保存字典项
 */
async function saveItem() {
  await itemFormRef.value.validate()
  const operator = getOperator()
  if (itemForm.id) {
    await window.electronAPI.dict.updateItem(itemForm.id, itemForm.type_code, itemForm.label, itemForm.value, itemForm.sort, operator)
    ElMessage.success('更新成功')
  } else {
    await window.electronAPI.dict.addItem(itemForm.type_code, itemForm.label, itemForm.value, itemForm.sort, operator)
    ElMessage.success('添加成功')
  }
  itemDialogVisible.value = false
  await loadItems()
}

/**
 * 删除字典项
 * @param {Object} row - 要删除的行数据
 */
async function removeItem(row) {
  await ElMessageBox.confirm(`确定删除字典项「${row.label}」吗？`, '提示', { type: 'warning' })
  await window.electronAPI.dict.deleteItem(row.id, getOperator())
  ElMessage.success('删除成功')
  await loadItems()
}

onMounted(loadTypes)
</script>

<style scoped>
.dict-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.dict-type-panel {
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.dict-item-panel {
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
.type-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px 16px;
}
.type-scroll :deep(.el-scrollbar__view) {
  height: 100%;
}
.type-scroll :deep(.el-table) {
  width: 100% !important;
}
.item-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px 16px;
}
.item-scroll :deep(.el-scrollbar__view) {
  height: 100%;
}
.item-scroll :deep(.el-table) {
  width: 100% !important;
}
</style>