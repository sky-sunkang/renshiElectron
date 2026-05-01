<template>
  <div class="emp-layout">
    <!-- 左侧部门树 -->
    <div class="emp-tree-panel">
      <div class="tree-header">
        <h3>组织架构</h3>
      </div>
      <el-scrollbar class="tree-scroll">
        <el-tree
          ref="treeRef"
          :data="deptTreeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        />
      </el-scrollbar>
    </div>

    <!-- 右侧内容 -->
    <div class="emp-content">
      <el-scrollbar class="content-scroll">
        <div class="content-inner">
          <div class="search-bar">
            <el-input v-model="search.name" placeholder="姓名" clearable style="width: 180px" />
            <el-button type="primary" :icon="Search" @click="load">查询</el-button>
            <el-button @click="reset">重置</el-button>
            <el-button v-if="permStore.hasPermission('emp:add')" type="primary" style="margin-left: auto" @click="openDialog()">+ 新增员工</el-button>
          </div>

          <div class="action-bar">
            <el-button v-if="permStore.hasPermission('emp:export')" plain @click="exportData">导出</el-button>
            <el-button v-if="permStore.hasPermission('emp:batchDelete')" type="danger" plain :disabled="!selected.length" @click="batchDelete">批量删除</el-button>
            <el-radio-group v-model="search.mode" size="small" style="margin-left: auto">
              <el-radio-button label="direct">当前部门</el-radio-button>
              <el-radio-button label="all">所有子部门</el-radio-button>
            </el-radio-group>
          </div>

          <el-table :data="pagedList" stripe border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="头像" width="70" align="center">
              <template #default="scope">
                <el-avatar
                  :size="40"
                  :src="scope.row.avatar"
                  @error="() => handleAvatarError(scope.row)"
                >
                  {{ scope.row.name ? scope.row.name.charAt(0) : '?' }}
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="account" label="账号" min-width="100" />
            <el-table-column prop="name" label="姓名" min-width="100" />
            <el-table-column prop="gender" label="性别" width="70" align="center" />
            <el-table-column prop="age" label="年龄" width="70" align="center" />
            <el-table-column prop="phone" label="手机号" min-width="120" />
            <el-table-column prop="email" label="邮箱" min-width="160" />
            <el-table-column label="部门" min-width="200">
              <template #default="scope">{{ scope.row.department_path || scope.row.department_name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="position" label="职位" min-width="120" />
            <el-table-column prop="salary" label="薪资" width="100" align="right">
              <template #default="scope">{{ scope.row.salary ? '¥' + scope.row.salary.toFixed(0) : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template #default="scope">
                <el-button v-if="permStore.hasPermission('emp:edit')" link type="primary" size="small" @click="openDialog(scope.row)">编辑</el-button>
                <el-button v-if="permStore.hasPermission('emp:delete')" link type="danger" size="small" @click="remove(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer">
            <span class="footer-count">共 {{ filteredList.length }} 条</span>
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes, jumper"
              :total="filteredList.length"
              background
            />
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑员工' : '新增员工'" width="600px">
      <div class="dialog-content">
        <!-- 头像上传区域 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
            <div v-else class="avatar-placeholder">{{ form.name ? form.name.charAt(0) : '?' }}</div>
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <el-button type="primary" size="small" class="upload-btn">更换头像</el-button>
            </el-upload>
          </div>
        </div>
        <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="账号" prop="account">
              <el-input v-model="form.account" placeholder="请输入账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in genderDict"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="18" :max="80" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="部门" prop="department_id">
              <el-tree-select
                v-model="form.department_id"
                :data="deptTreeData"
                :props="{ label: 'name', children: 'children' }"
                node-key="id"
                placeholder="请选择部门"
                style="width: 100%"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="form.position" placeholder="请选择职位" style="width: 100%" clearable>
                <el-option
                  v-for="item in positionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input-number v-model="form.salary" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" placeholder="默认123456" show-password />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useDeptStore } from '../stores/dept.js'
import { useEmpStore } from '../stores/emp.js'
import { useDictStore } from '../stores/dict.js'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'

const deptStore = useDeptStore()
const empStore = useEmpStore()
const dictStore = useDictStore()
const permStore = usePermissionStore()
const authStore = useAuthStore()
const { list: deptList, treeData: deptTreeData } = storeToRefs(deptStore)
const { list: empList, loading } = storeToRefs(empStore)
const { gender: genderDict } = storeToRefs(dictStore)

/** 职位字典选项 */
const positionOptions = computed(() => dictStore.getOptions('position'))

/** 获取当前操作人信息 */
function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

const search = reactive({ name: '', mode: 'direct' })
const page = ref(1)
const pageSize = ref(10)
const selected = ref([])
const currentDept = ref(null)
const treeRef = ref()

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, name: '', account: '', gender: '', age: null, phone: '', email: '', department_id: '', position: '', salary: null, password: '' })
const avatarPreview = ref('')
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

function getAllChildDeptIds(deptId) {
  const ids = [deptId]
  function collect(pid) {
    const children = deptList.value.filter(d => (d.parent_id || 0) == pid)
    children.forEach(child => {
      ids.push(child.id)
      collect(child.id)
    })
  }
  collect(deptId)
  return ids
}

async function load() {
  await empStore.loadAll()
}

const filteredList = computed(() => {
  let result = empList.value
  if (search.name) result = result.filter(e => e.name && e.name.includes(search.name))
  if (currentDept.value) {
    if (search.mode === 'direct') {
      result = result.filter(e => Number(e.department_id) === Number(currentDept.value.id))
    } else {
      const deptIds = getAllChildDeptIds(currentDept.value.id)
      result = result.filter(e => deptIds.includes(Number(e.department_id)))
    }
  }
  return result
})

const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

function handleNodeClick(data) {
  currentDept.value = data
}

function reset() {
  search.name = ''
  search.mode = 'direct'
  page.value = 1
}

function openDialog(row) {
  if (row) {
    Object.assign(form, row)
    form.department_id = row.department_id
    form.password = row.password || ''
    // 加载头像
    loadAvatar(row.id)
  } else {
    Object.assign(form, { id: null, name: '', account: '', gender: '', age: null, phone: '', email: '', department_id: '', position: '', salary: null, password: '' })
    avatarPreview.value = ''
  }
  dialogVisible.value = true
}

/**
 * 加载员工头像
 * @param {number} id - 员工ID
 */
async function loadAvatar(id) {
  const avatar = await window.electronAPI.emp.getAvatar(id)
  avatarPreview.value = avatar || ''
}

/**
 * 处理头像文件选择
 * @param {Object} uploadFile - 上传的文件对象
 */
async function handleAvatarChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return

  // 转换为base64
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function save() {
  try {
    await formRef.value.validate()
    const data = { ...form }
    delete data.id
    delete data.department_name
    delete data.department_path
    delete data.created_at
    delete data.avatar
    if (!data.password) data.password = '123456'
    const operator = getOperator()
    if (form.id) {
      await window.electronAPI.emp.update(form.id, data, operator)
      // 如果有新头像，上传头像
      if (avatarPreview.value && avatarPreview.value.startsWith('data:')) {
        await window.electronAPI.emp.updateAvatar(form.id, avatarPreview.value, operator)
      }
      ElMessage.success('更新成功')
    } else {
      const newId = await window.electronAPI.emp.add(data, operator)
      // 如果有头像，上传头像
      if (avatarPreview.value && avatarPreview.value.startsWith('data:')) {
        await window.electronAPI.emp.updateAvatar(newId, avatarPreview.value, operator)
      }
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    avatarPreview.value = ''
    await load()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + (error.message || error))
  }
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除该员工吗？', '提示', { type: 'warning' })
  await window.electronAPI.emp.delete(id, getOperator())
  ElMessage.success('删除成功')
  await load()
}

function handleSelectionChange(val) {
  selected.value = val
}

async function batchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selected.value.length} 名员工吗？`, '提示', { type: 'warning' })
  const operator = getOperator()
  for (const emp of selected.value) {
    await window.electronAPI.emp.delete(emp.id, operator)
  }
  ElMessage.success('批量删除成功')
  await load()
}

/**
 * 处理头像加载失败
 * @param {Object} row - 员工数据行
 */
function handleAvatarError(row) {
  // 头像加载失败时不做任何处理，el-avatar会显示默认文字
}

function exportData() {
  const headers = ['姓名', '性别', '年龄', '手机号', '邮箱', '部门', '职位', '薪资']
  const rows = filteredList.value.map(e => [
    e.name, e.gender, e.age, e.phone, e.email, e.department_name || '-', e.position, e.salary
  ])
  let csv = '﻿' + headers.join(',') + '\n'
  rows.forEach(r => { csv += r.join(',') + '\n' })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '员工信息.csv'
  link.click()
  ElMessage.success('导出成功')
}

onMounted(async () => {
  await deptStore.loadAll()
  await dictStore.loadAll()
  if (deptTreeData.value.length > 0) {
    currentDept.value = deptTreeData.value[0]
    nextTick(() => {
      treeRef.value?.setCurrentKey(deptTreeData.value[0].id)
    })
  }
  await load()
})
</script>

<style scoped>
.emp-layout {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
.emp-tree-panel {
  width: 200px;
  min-width: 200px;
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
.emp-content {
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
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.table-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.footer-count {
  color: #64748b;
  font-size: 13px;
}
.table-footer .el-pagination {
  margin-left: auto;
}

/* 头像上传样式 */
.dialog-content {
  display: flex;
  gap: 20px;
}
.avatar-section {
  flex-shrink: 0;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e4e7ed;
}
.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  font-weight: 500;
}
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-btn {
  margin-top: 8px;
}
</style>
