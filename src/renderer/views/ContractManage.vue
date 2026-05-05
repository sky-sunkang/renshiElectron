<template>
  <div class="contract-manage">
    <div class="header">
      <el-button type="primary" v-if="hasPermission('contract:add')" @click="handleAdd">新增合同</el-button>
      <el-button v-if="hasPermission('contract:export')" @click="handleExport">导出</el-button>
    </div>

    <el-form :inline="true" class="search-form">
      <el-form-item label="员工">
        <el-input v-model="searchEmployee" placeholder="员工姓名/账号" clearable @keyup.enter="loadList" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in contractStatuses" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column prop="contract_no" label="合同编号" width="150" />
      <el-table-column prop="employee_name" label="员工姓名" width="120" />
      <el-table-column prop="department_name" label="所属部门" width="150" />
      <el-table-column prop="contract_type" label="合同类型" width="100">
        <template #default="{ row }">
          {{ getTypeLabel(row.contract_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="start_date" label="开始日期" width="120">
        <template #default="{ row }">
          {{ row.start_date ? formatDate(row.start_date) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="end_date" label="结束日期" width="120">
        <template #default="{ row }">
          {{ row.end_date ? formatDate(row.end_date) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" v-if="hasPermission('contract:edit')" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" v-if="hasPermission('contract:delete')" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑合同' : '新增合同'" width="600" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="员工" prop="employee_id">
          <div class="employee-select">
            <el-input :value="selectedEmployeeName" readonly placeholder="请选择员工" style="flex: 1" />
            <el-button type="primary" @click="showEmpSelector">选择</el-button>
          </div>
        </el-form-item>
        <el-form-item label="合同编号" prop="contract_no">
          <el-input v-model="form.contract_no" placeholder="请输入合同编号" />
        </el-form-item>
        <el-form-item label="合同类型" prop="contract_type">
          <el-select v-model="form.contract_type" placeholder="请选择合同类型">
            <el-option v-for="item in contractTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" placeholder="选择开始日期" format="YYYY-MM-DD" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" placeholder="选择结束日期" format="YYYY-MM-DD" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="签订日期" prop="sign_date">
          <el-date-picker v-model="form.sign_date" type="date" placeholder="选择签订日期" format="YYYY-MM-DD" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="item in contractStatuses" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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

    <!-- 员工选择器 -->
    <EmployeeSelector
      v-model="empSelectorVisible"
      :multiple="false"
      :selected-ids="form.employee_id ? [form.employee_id] : []"
      @confirm="handleEmpConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { useDictStore } from '../stores/dict.js'
import { useEmpStore } from '../stores/emp.js'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'
import EmployeeSelector from '../components/EmployeeSelector.vue'

const permStore = usePermissionStore()
const dictStore = useDictStore()
const empStore = useEmpStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)
const { list: dictList } = storeToRefs(dictStore)
const { list: employees } = storeToRefs(empStore)

// 字典数据
const contractTypes = computed(() => dictList.value.filter(item => item.type_code === 'contract_type'))
const contractStatuses = computed(() => dictList.value.filter(item => item.type_code === 'contract_status'))

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchEmployee = ref('')
const searchStatus = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const empSelectorVisible = ref(false)

const form = ref({
  employee_id: null,
  contract_no: '',
  contract_type: 'labor',
  start_date: null,
  end_date: null,
  sign_date: null,
  status: 'active',
  remark: ''
})

// 已选员工名称显示
const selectedEmployeeName = computed(() => {
  if (!form.value.employee_id) return ''
  const emp = employees.value.find(e => e.id === form.value.employee_id)
  return emp ? `${emp.name} (${emp.account})` : ''
})

const rules = {
  employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  contract_type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

/**
 * 检查是否有指定权限
 */
function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

/**
 * 获取合同类型显示文本
 */
function getTypeLabel(type) {
  const item = contractTypes.value.find(t => t.value === type)
  return item ? item.label : type
}

/**
 * 获取状态标签颜色
 */
function getStatusTag(status) {
  const map = { active: 'success', expired: 'warning', terminated: 'info' }
  return map[status] || 'info'
}

/**
 * 获取状态显示文本
 */
function getStatusLabel(status) {
  const item = contractStatuses.value.find(t => t.value === status)
  return item ? item.label : status
}

/**
 * 格式化日期时间戳
 */
function formatDate(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-CN')
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 加载合同列表
 */
async function loadList() {
  loading.value = true
  try {
    const options = {
      page: page.value,
      pageSize: pageSize.value,
      status: searchStatus.value
    }
    const result = await window.electronAPI.contract.getAll(options)
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
 * 新增合同
 */
function handleAdd() {
  isEdit.value = false
  currentId.value = null
  form.value = {
    employee_id: null,
    contract_no: '',
    contract_type: 'labor',
    start_date: null,
    end_date: null,
    sign_date: null,
    status: 'active',
    remark: ''
  }
  dialogVisible.value = true
}

/**
 * 编辑合同
 */
function handleEdit(row) {
  isEdit.value = true
  currentId.value = row.id
  form.value = {
    employee_id: row.employee_id,
    contract_no: row.contract_no || '',
    contract_type: row.contract_type || 'labor',
    start_date: row.start_date ? row.start_date * 1000 : null,
    end_date: row.end_date ? row.end_date * 1000 : null,
    sign_date: row.sign_date ? row.sign_date * 1000 : null,
    status: row.status || 'active',
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

/**
 * 删除合同
 */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
    await window.electronAPI.contract.delete(row.id, getCurrentUser())
    ElMessage.success('删除成功')
    loadList()
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
      contract_no: form.value.contract_no,
      contract_type: form.value.contract_type,
      start_date: form.value.start_date ? Math.floor(form.value.start_date / 1000) : null,
      end_date: form.value.end_date ? Math.floor(form.value.end_date / 1000) : null,
      sign_date: form.value.sign_date ? Math.floor(form.value.sign_date / 1000) : null,
      status: form.value.status,
      remark: form.value.remark
    }

    if (isEdit.value) {
      await window.electronAPI.contract.update(currentId.value, data, getCurrentUser())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.contract.add(data, getCurrentUser())
      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (e) {
    if (e !== false) {
      ElMessage.error('操作失败：' + e.message)
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 导出合同数据
 */
async function handleExport() {
  try {
    const result = await window.electronAPI.contract.getAll({ page: 1, pageSize: 1000 })
    if (result.list.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const exportData = result.list.map(item => ({
      '合同编号': item.contract_no,
      '员工姓名': item.employee_name,
      '所属部门': item.department_name,
      '合同类型': getTypeLabel(item.contract_type),
      '开始日期': item.start_date ? formatDate(item.start_date) : '-',
      '结束日期': item.end_date ? formatDate(item.end_date) : '-',
      '签订日期': item.sign_date ? formatDate(item.sign_date) : '-',
      '状态': getStatusLabel(item.status),
      '备注': item.remark || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '合同列表')
    const fileName = `合同列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败：' + e.message)
  }
}

/**
 * 显示员工选择器
 */
function showEmpSelector() {
  empSelectorVisible.value = true
}

/**
 * 处理员工选择确认
 */
function handleEmpConfirm(selectedList) {
  if (selectedList.length > 0) {
    form.value.employee_id = selectedList[0].id
  }
}

onMounted(() => {
  empStore.loadAll()
  dictStore.loadAll()
  loadList()
})
</script>

<style scoped>
.contract-manage {
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

.employee-select {
  display: flex;
  gap: 8px;
}
</style>