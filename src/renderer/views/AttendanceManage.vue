<template>
  <div class="attendance-manage">
    <div class="header">
      <el-button type="primary" v-if="hasPermission('attendance:check')" @click="handleCheckIn">签到</el-button>
      <el-button type="success" v-if="hasPermission('attendance:check')" @click="handleCheckOut">签退</el-button>
      <el-button v-if="hasPermission('attendance:export')" @click="handleExport">导出</el-button>
    </div>

    <el-form :inline="true" class="search-form">
      <el-form-item label="员工">
        <el-input v-model="searchEmployee" placeholder="员工姓名/账号" clearable @keyup.enter="loadList" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="searchType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in attendanceTypes" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="x"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column prop="employee_name" label="员工姓名" width="120" />
      <el-table-column prop="department_name" label="所属部门" width="150" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'check_in' ? 'success' : 'warning'">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="check_time" label="打卡时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.check_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" v-if="hasPermission('attendance:edit')" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" v-if="hasPermission('attendance:delete')" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadList"
      @current-change="loadList"
      class="pagination"
    />

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑考勤记录" width="500" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="员工" prop="employee_id">
          <el-select v-model="form.employee_id" filterable placeholder="请选择员工" style="width: 100%">
            <el-option v-for="emp in employees" :key="emp.id" :label="`${emp.name} (${emp.account})`" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option v-for="item in attendanceTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="打卡时间" prop="check_time">
          <el-date-picker v-model="form.check_time" type="datetime" placeholder="选择打卡时间" format="YYYY-MM-DD HH:mm:ss" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 今日考勤状态卡片 -->
    <el-card class="today-status" v-if="currentUser">
      <template #header>
        <span>今日考勤状态</span>
      </template>
      <div class="status-content">
        <div class="status-item">
          <span class="label">签到时间：</span>
          <span class="value">{{ todayStatus.check_in ? formatTime(todayStatus.check_in) : '未签到' }}</span>
        </div>
        <div class="status-item">
          <span class="label">签退时间：</span>
          <span class="value">{{ todayStatus.check_out ? formatTime(todayStatus.check_out) : '未签退' }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'
import { useEmpStore } from '../stores/emp.js'
import { useDictStore } from '../stores/dict.js'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'

const permStore = usePermissionStore()
const authStore = useAuthStore()
const empStore = useEmpStore()
const dictStore = useDictStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)
const { currentUser } = storeToRefs(authStore)
const { list: employees } = storeToRefs(empStore)
const { list: dictList } = storeToRefs(dictStore)

// 字典数据
const attendanceTypes = computed(() => dictList.value.filter(item => item.type_code === 'attendance_type'))

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchEmployee = ref('')
const searchType = ref('')
const dateRange = ref(null)
const todayStatus = ref({ check_in: null, check_out: null })

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const currentId = ref(null)

const form = ref({
  employee_id: null,
  type: 'check_in',
  check_time: null,
  remark: ''
})

const rules = {
  employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  check_time: [{ required: true, message: '请选择打卡时间', trigger: 'change' }]
}

/**
 * 检查是否有指定权限
 */
function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

/**
 * 获取考勤类型显示文本
 */
function getTypeLabel(type) {
  const item = attendanceTypes.value.find(t => t.value === type)
  return item ? item.label : type
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 加载考勤列表
 */
async function loadList() {
  loading.value = true
  try {
    const options = {
      page: page.value,
      pageSize: pageSize.value,
      type: searchType.value
    }

    if (dateRange.value && dateRange.value.length === 2) {
      options.start_time = Math.floor(dateRange.value[0] / 1000)
      options.end_time = Math.floor(dateRange.value[1] / 1000) + 86400
    }

    const result = await window.electronAPI.attendance.getAll(options)

    // 如果有员工搜索条件，前端过滤
    if (searchEmployee.value) {
      const keyword = searchEmployee.value.toLowerCase()
      result.list = result.list.filter(item =>
        (item.employee_name && item.employee_name.toLowerCase().includes(keyword)) ||
        (item.employee_account && item.employee_account.toLowerCase().includes(keyword))
      )
      result.total = result.list.length
    }

    list.value = result.list
    total.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
}

/**
 * 加载今日考勤状态
 */
async function loadTodayStatus() {
  if (currentUser.value?.id) {
    try {
      const result = await window.electronAPI.attendance.getToday(currentUser.value.id)
      todayStatus.value = result
    } catch (e) {
      console.error('获取今日考勤状态失败', e)
    }
  }
}

/**
 * 签到
 */
async function handleCheckIn() {
  try {
    const user = getCurrentUser()
    await window.electronAPI.attendance.add({
      employee_id: user.id,
      type: 'check_in',
      check_time: Math.floor(Date.now() / 1000)
    }, user)
    ElMessage.success('签到成功')
    loadList()
    loadTodayStatus()
  } catch (e) {
    ElMessage.error('签到失败：' + e.message)
  }
}

/**
 * 签退
 */
async function handleCheckOut() {
  try {
    const user = getCurrentUser()
    await window.electronAPI.attendance.add({
      employee_id: user.id,
      type: 'check_out',
      check_time: Math.floor(Date.now() / 1000)
    }, user)
    ElMessage.success('签退成功')
    loadList()
    loadTodayStatus()
  } catch (e) {
    ElMessage.error('签退失败：' + e.message)
  }
}

/**
 * 编辑考勤记录
 */
function handleEdit(row) {
  currentId.value = row.id
  form.value = {
    employee_id: row.employee_id,
    type: row.type || 'check_in',
    check_time: row.check_time ? row.check_time * 1000 : null,
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

/**
 * 删除考勤记录
 */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该考勤记录吗？', '提示', { type: 'warning' })
    await window.electronAPI.attendance.delete(row.id, getCurrentUser())
    ElMessage.success('删除成功')
    loadList()
    loadTodayStatus()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + e.message)
    }
  }
}

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      employee_id: form.value.employee_id,
      type: form.value.type,
      check_time: form.value.check_time ? Math.floor(form.value.check_time / 1000) : Math.floor(Date.now() / 1000),
      remark: form.value.remark
    }

    await window.electronAPI.attendance.update(currentId.value, data, getCurrentUser())
    ElMessage.success('更新成功')
    dialogVisible.value = false
    loadList()
    loadTodayStatus()
  } catch (e) {
    if (e !== false) {
      ElMessage.error('操作失败：' + e.message)
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 导出考勤数据
 */
async function handleExport() {
  try {
    const options = { page: 1, pageSize: 1000 }
    if (dateRange.value && dateRange.value.length === 2) {
      options.start_time = Math.floor(dateRange.value[0] / 1000)
      options.end_time = Math.floor(dateRange.value[1] / 1000) + 86400
    }

    const result = await window.electronAPI.attendance.getAll(options)
    if (result.list.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const exportData = result.list.map(item => ({
      '员工姓名': item.employee_name,
      '所属部门': item.department_name,
      '类型': getTypeLabel(item.type),
      '打卡时间': formatTime(item.check_time),
      '备注': item.remark || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '考勤记录')
    const fileName = `考勤记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败：' + e.message)
  }
}

onMounted(() => {
  empStore.loadAll()
  dictStore.loadAll()
  loadList()
  loadTodayStatus()
})
</script>

<style scoped>
.attendance-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.today-status {
  margin-top: 16px;
}

.status-content {
  display: flex;
  gap: 24px;
}

.status-item .label {
  color: #666;
}

.status-item .value {
  font-weight: bold;
  color: #333;
}
</style>