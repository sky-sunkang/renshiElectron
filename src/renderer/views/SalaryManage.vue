<template>
  <div class="salary-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 工资条管理 -->
      <el-tab-pane label="工资条管理" name="sheet">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('salary:generate')" @click="handleBatchGenerate">批量生成</el-button>
          <el-button type="success" v-if="hasPermission('salary:edit')" @click="handleBatchPublish" :disabled="selectedSheets.length === 0">批量发布</el-button>
          <el-button type="warning" v-if="hasPermission('salary:edit')" @click="handleBatchPay" :disabled="selectedSheets.length === 0">批量发放</el-button>
          <el-button type="primary" v-if="hasPermission('salary:add')" @click="handleAddSheet">新增工资条</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="月份">
            <el-date-picker v-model="sheetMonth" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" clearable />
          </el-form-item>
          <el-form-item label="员工">
            <el-input v-model="sheetSearch" placeholder="姓名/账号" clearable @keyup.enter="loadSheets" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="sheetStatus" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="item in sheetStatuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadSheets">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="sheets" v-loading="sheetLoading" stripe border @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="employee_name" label="员工姓名" width="120" />
          <el-table-column prop="department_name" label="所属部门" width="150" />
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column prop="base_salary" label="基本工资" width="100">
            <template #default="{ row }">{{ formatMoney(row.base_salary) }}</template>
          </el-table-column>
          <el-table-column prop="overtime_pay" label="加班费" width="100">
            <template #default="{ row }">{{ formatMoney(row.overtime_pay) }}</template>
          </el-table-column>
          <el-table-column prop="bonus" label="奖金" width="100">
            <template #default="{ row }">{{ formatMoney(row.bonus) }}</template>
          </el-table-column>
          <el-table-column prop="allowance" label="补贴" width="100">
            <template #default="{ row }">{{ formatMoney(row.allowance) }}</template>
          </el-table-column>
          <el-table-column prop="deduction" label="扣款" width="100">
            <template #default="{ row }">{{ formatMoney(row.deduction) }}</template>
          </el-table-column>
          <el-table-column prop="tax" label="个税" width="100">
            <template #default="{ row }">{{ formatMoney(row.tax) }}</template>
          </el-table-column>
          <el-table-column prop="insurance" label="社保公积金" width="100">
            <template #default="{ row }">{{ formatMoney(row.insurance) }}</template>
          </el-table-column>
          <el-table-column prop="actual_salary" label="实发工资" width="120">
            <template #default="{ row }">
              <span class="actual-salary">{{ formatMoney(row.actual_salary) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getSheetStatusType(row.status)">{{ getSheetStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('salary:edit')" @click="handleEditSheet(row)">编辑</el-button>
              <el-button link type="danger" v-if="hasPermission('salary:delete')" @click="handleDeleteSheet(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="sheetPage" v-model:page-size="sheetPageSize" :total="sheetTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadSheets" @current-change="loadSheets" class="pagination" />
      </el-tab-pane>

      <!-- 调薪记录 -->
      <el-tab-pane label="调薪记录" name="adjustment">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('adjustment:add')" @click="handleAddAdjustment">新增调薪</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="员工">
            <el-input v-model="adjustmentSearch" placeholder="姓名/账号" clearable @keyup.enter="loadAdjustments" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="adjustmentType" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="item in adjustTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadAdjustments">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="adjustments" v-loading="adjustmentLoading" stripe border>
          <el-table-column prop="employee_name" label="员工姓名" width="120" />
          <el-table-column prop="department_name" label="所属部门" width="150" />
          <el-table-column prop="type" label="调薪类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getAdjustType(row.type)">{{ getAdjustLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="before_salary" label="调薪前" width="120">
            <template #default="{ row }">{{ formatMoney(row.before_salary) }}</template>
          </el-table-column>
          <el-table-column prop="adjust_amount" label="调整金额" width="120">
            <template #default="{ row }">
              <span :class="row.adjust_amount >= 0 ? 'raise' : 'cut'">{{ row.adjust_amount >= 0 ? '+' : '' }}{{ formatMoney(row.adjust_amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="after_salary" label="调薪后" width="120">
            <template #default="{ row }">{{ formatMoney(row.after_salary) }}</template>
          </el-table-column>
          <el-table-column prop="effective_date" label="生效日期" width="120">
            <template #default="{ row }">{{ formatDate(row.effective_date) }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="调薪原因" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" v-if="hasPermission('adjustment:delete')" @click="handleDeleteAdjustment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="adjustmentPage" v-model:page-size="adjustmentPageSize" :total="adjustmentTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadAdjustments" @current-change="loadAdjustments" class="pagination" />
      </el-tab-pane>

      <!-- 薪资统计 -->
      <el-tab-pane label="薪资统计" name="statistics">
        <el-form :inline="true" class="search-form">
          <el-form-item label="月份">
            <el-date-picker v-model="statsMonth" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadStatistics">查询</el-button>
          </el-form-item>
        </el-form>
        <el-row :gutter="16" class="stats-cards">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <span>总薪资支出</span>
              </template>
              <div class="stats-value">{{ formatMoney(statistics.totalSalary) }}</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="charts-row">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <span>部门薪资分布</span>
              </template>
              <div ref="deptChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <span>薪资区间分布</span>
              </template>
              <div ref="rangeChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="charts-row">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <span>月度薪资趋势</span>
              </template>
              <div ref="trendChartRef" class="chart-container" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 工资条对话框 -->
    <el-dialog v-model="sheetDialogVisible" :title="sheetIsEdit ? '编辑工资条' : '新增工资条'" width="700" destroy-on-close>
      <el-form :model="sheetForm" :rules="sheetRules" ref="sheetFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工" prop="employee_id">
              <el-input
                :value="employeeName"
                readonly
                placeholder="请选择员工"
                @click="showEmployeeSelector"
              >
                <template #suffix>
                  <el-icon style="cursor: pointer"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月份" prop="month">
              <el-date-picker v-model="sheetForm.month" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基本工资">
              <el-input-number v-model="sheetForm.base_salary" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="加班费">
              <el-input-number v-model="sheetForm.overtime_pay" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="奖金">
              <el-input-number v-model="sheetForm.bonus" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="补贴">
              <el-input-number v-model="sheetForm.allowance" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="扣款">
              <el-input-number v-model="sheetForm.deduction" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="个税">
              <el-input-number v-model="sheetForm.tax" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="社保公积金">
              <el-input-number v-model="sheetForm.insurance" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="sheetForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="item in sheetStatuses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="实发工资">
          <span class="actual-salary-large">{{ formatMoney(calculatedActualSalary) }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="sheetForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sheetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitSheet" :loading="sheetSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量生成工资条" width="500" destroy-on-close>
      <el-form :model="batchForm" :rules="batchRules" ref="batchFormRef" label-width="100px">
        <el-form-item label="月份" prop="month">
          <el-date-picker v-model="batchForm.month" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" style="width: 100%" />
        </el-form-item>
        <el-form-item label="生成范围">
          <el-radio-group v-model="batchForm.scope">
            <el-radio value="all">全部员工</el-radio>
            <el-radio value="selected">指定员工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择员工" v-if="batchForm.scope === 'selected'">
          <el-input
            :value="selectedEmployeesText"
            readonly
            placeholder="点击选择员工"
            @click="showBatchEmployeeSelector"
          >
            <template #suffix>
              <el-icon style="cursor: pointer"><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatch" :loading="batchSubmitting">生成</el-button>
      </template>
    </el-dialog>

    <!-- 调薪对话框 -->
    <el-dialog v-model="adjustmentDialogVisible" title="新增调薪" width="600" destroy-on-close>
      <el-form :model="adjustmentForm" :rules="adjustmentRules" ref="adjustmentFormRef" label-width="100px">
        <el-form-item label="员工" prop="employee_id">
          <el-input
            :value="adjustmentEmployeeName"
            readonly
            placeholder="请选择员工"
            @click="showAdjustmentEmployeeSelector"
          >
            <template #suffix>
              <el-icon style="cursor: pointer"><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="当前薪资" v-if="adjustmentForm.employee_id">
          <span>{{ formatMoney(currentEmployeeSalary) }}</span>
        </el-form-item>
        <el-form-item label="调薪类型" prop="type">
          <el-select v-model="adjustmentForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option v-for="item in adjustTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整金额" prop="adjust_amount">
          <el-input-number v-model="adjustmentForm.adjust_amount" :precision="2" style="width: 100%" />
          <div class="form-tip">正数为涨薪，负数为降薪</div>
        </el-form-item>
        <el-form-item label="调薪后薪资">
          <span class="actual-salary-large">{{ formatMoney(currentEmployeeSalary + adjustmentForm.adjust_amount) }}</span>
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker v-model="adjustmentForm.effective_date" type="date" placeholder="选择生效日期" format="YYYY-MM-DD" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调薪原因" prop="reason">
          <el-input v-model="adjustmentForm.reason" type="textarea" :rows="2" placeholder="请输入调薪原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjustmentForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAdjustment" :loading="adjustmentSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 员工选择器 -->
    <EmployeeSelector
      v-model="employeeSelectorVisible"
      :selected-ids="employeeSelectedIds"
      :multiple="employeeSelectorMultiple"
      @confirm="handleEmployeeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { usePermissionStore } from '../stores/permission.js'
import { useEmpStore } from '../stores/emp.js'
import { useDictStore } from '../stores/dict.js'
import { useAuthStore } from '../stores/auth.js'
import { storeToRefs } from 'pinia'
import EmployeeSelector from '../components/EmployeeSelector.vue'

const permStore = usePermissionStore()
const empStore = useEmpStore()
const dictStore = useDictStore()
const authStore = useAuthStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)
const { list: employees } = storeToRefs(empStore)
const { list: dictList } = storeToRefs(dictStore)

// 字典数据
const sheetStatuses = computed(() => dictList.value.filter(item => item.type_code === 'salary_sheet_status'))
const adjustTypes = computed(() => dictList.value.filter(item => item.type_code === 'salary_adjust_type'))

const activeTab = ref('sheet')

// 工资条相关
const sheetLoading = ref(false)
const sheets = ref([])
const sheetTotal = ref(0)
const sheetPage = ref(1)
const sheetPageSize = ref(10)
const sheetMonth = ref('')
const sheetSearch = ref('')
const sheetStatus = ref('')
const selectedSheets = ref([])
const sheetDialogVisible = ref(false)
const sheetIsEdit = ref(false)
const sheetSubmitting = ref(false)
const sheetFormRef = ref(null)
const sheetCurrentId = ref(null)
const sheetForm = ref({
  employee_id: null, month: '', base_salary: 0, overtime_pay: 0, bonus: 0,
  allowance: 0, deduction: 0, tax: 0, insurance: 0, status: 'draft', remark: ''
})
const sheetRules = {
  employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }]
}

// 批量生成相关
const batchDialogVisible = ref(false)
const batchSubmitting = ref(false)
const batchFormRef = ref(null)
const batchForm = ref({ month: '', scope: 'all', employee_ids: [] })
const batchRules = { month: [{ required: true, message: '请选择月份', trigger: 'change' }] }

// 调薪相关
const adjustmentLoading = ref(false)
const adjustments = ref([])
const adjustmentTotal = ref(0)
const adjustmentPage = ref(1)
const adjustmentPageSize = ref(10)
const adjustmentSearch = ref('')
const adjustmentType = ref('')
const adjustmentDialogVisible = ref(false)
const adjustmentSubmitting = ref(false)
const adjustmentFormRef = ref(null)
const adjustmentForm = ref({
  employee_id: null, type: 'raise', adjust_amount: 0, effective_date: null, reason: '', remark: ''
})
const adjustmentRules = {
  employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  type: [{ required: true, message: '请选择调薪类型', trigger: 'change' }],
  adjust_amount: [{ required: true, message: '请输入调整金额', trigger: 'blur' }],
  effective_date: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入调薪原因', trigger: 'blur' }]
}

// 统计相关
const statsMonth = ref('')
const statistics = ref({ totalSalary: 0, deptDistribution: [], monthlyTrend: [], salaryRange: [] })
const deptChartRef = ref(null)
const rangeChartRef = ref(null)
const trendChartRef = ref(null)
let deptChart = null
let rangeChart = null
let trendChart = null

// 员工选择器
const employeeSelectorVisible = ref(false)
const employeeSelectedIds = ref([])
const employeeSelectorMultiple = ref(false)
const employeeSelectorType = ref('') // 'sheet', 'batch', 'adjustment'

const employeeName = computed(() => {
  if (!sheetForm.value.employee_id) return ''
  const emp = employees.value.find(e => e.id === sheetForm.value.employee_id)
  return emp ? `${emp.name} (${emp.account})` : ''
})

const selectedEmployeesText = computed(() => {
  if (batchForm.value.employee_ids.length === 0) return ''
  return `已选择 ${batchForm.value.employee_ids.length} 名员工`
})

const adjustmentEmployeeName = computed(() => {
  if (!adjustmentForm.value.employee_id) return ''
  const emp = employees.value.find(e => e.id === adjustmentForm.value.employee_id)
  return emp ? `${emp.name} (${emp.account})` : ''
})

const currentEmployeeSalary = computed(() => {
  if (!adjustmentForm.value.employee_id) return 0
  const emp = employees.value.find(e => e.id === adjustmentForm.value.employee_id)
  return emp?.salary || 0
})

const calculatedActualSalary = computed(() => {
  const { base_salary, overtime_pay, bonus, allowance, deduction, tax, insurance } = sheetForm.value
  return base_salary + overtime_pay + bonus + allowance - deduction - tax - insurance
})

function showEmployeeSelector() {
  employeeSelectorType.value = 'sheet'
  employeeSelectorMultiple.value = false
  employeeSelectedIds.value = sheetForm.value.employee_id ? [sheetForm.value.employee_id] : []
  employeeSelectorVisible.value = true
}

function showBatchEmployeeSelector() {
  employeeSelectorType.value = 'batch'
  employeeSelectorMultiple.value = true
  employeeSelectedIds.value = batchForm.value.employee_ids || []
  employeeSelectorVisible.value = true
}

function showAdjustmentEmployeeSelector() {
  employeeSelectorType.value = 'adjustment'
  employeeSelectorMultiple.value = false
  employeeSelectedIds.value = adjustmentForm.value.employee_id ? [adjustmentForm.value.employee_id] : []
  employeeSelectorVisible.value = true
}

function handleEmployeeConfirm(selectedList) {
  if (employeeSelectorType.value === 'sheet') {
    sheetForm.value.employee_id = selectedList.length > 0 ? selectedList[0].id : null
  } else if (employeeSelectorType.value === 'batch') {
    batchForm.value.employee_ids = selectedList.map(e => e.id)
  } else if (employeeSelectorType.value === 'adjustment') {
    adjustmentForm.value.employee_id = selectedList.length > 0 ? selectedList[0].id : null
  }
}

function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

function formatMoney(value) {
  if (value == null) return '¥0.00'
  return '¥' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

function getSheetStatusLabel(status) {
  const item = sheetStatuses.value.find(t => t.value === status)
  return item ? item.label : status
}

function getSheetStatusType(status) {
  const map = { draft: 'info', published: 'warning', paid: 'success' }
  return map[status] || 'info'
}

function getAdjustLabel(type) {
  const item = adjustTypes.value.find(t => t.value === type)
  return item ? item.label : type
}

function getAdjustType(type) {
  const map = { raise: 'success', cut: 'danger', regular: 'primary', promotion: 'warning' }
  return map[type] || 'info'
}

/**
 * 处理表格选择变化
 * @param {Array} selection - 选中的行数据
 */
function handleSelectionChange(selection) {
  selectedSheets.value = selection
}

/**
 * 批量发布工资条
 */
async function handleBatchPublish() {
  if (selectedSheets.value.length === 0) {
    ElMessage.warning('请先选择要发布的工资条')
    return
  }
  // 检查是否有非草稿状态的
  const invalidSheets = selectedSheets.value.filter(s => s.status !== 'draft')
  if (invalidSheets.length > 0) {
    ElMessage.warning('只能发布草稿状态的工资条')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要发布选中的 ${selectedSheets.value.length} 条工资条吗？`, '批量发布', { type: 'warning' })
    const ids = selectedSheets.value.map(s => s.id)
    for (const id of ids) {
      await window.electronAPI.salarySheet.update(id, { status: 'published' }, getOperator())
    }
    ElMessage.success('批量发布成功')
    loadSheets()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('发布失败：' + e.message)
  }
}

/**
 * 批量发放工资条
 */
async function handleBatchPay() {
  if (selectedSheets.value.length === 0) {
    ElMessage.warning('请先选择要发放的工资条')
    return
  }
  // 检查是否有非已发布状态的
  const invalidSheets = selectedSheets.value.filter(s => s.status !== 'published')
  if (invalidSheets.length > 0) {
    ElMessage.warning('只能发放已发布状态的工资条')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要发放选中的 ${selectedSheets.value.length} 条工资条吗？`, '批量发放', { type: 'warning' })
    const ids = selectedSheets.value.map(s => s.id)
    for (const id of ids) {
      await window.electronAPI.salarySheet.update(id, { status: 'paid' }, getOperator())
    }
    ElMessage.success('批量发放成功')
    loadSheets()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('发放失败：' + e.message)
  }
}

// 加载工资条
async function loadSheets() {
  sheetLoading.value = true
  try {
    const result = await window.electronAPI.salarySheet.getAll({
      page: sheetPage.value,
      pageSize: sheetPageSize.value,
      month: sheetMonth.value,
      keyword: sheetSearch.value,
      status: sheetStatus.value
    })
    sheets.value = result.list
    sheetTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    sheetLoading.value = false
  }
}

// 加载调薪记录
async function loadAdjustments() {
  adjustmentLoading.value = true
  try {
    const result = await window.electronAPI.salaryAdjustment.getAll({
      page: adjustmentPage.value,
      pageSize: adjustmentPageSize.value,
      keyword: adjustmentSearch.value,
      type: adjustmentType.value
    })
    adjustments.value = result.list
    adjustmentTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    adjustmentLoading.value = false
  }
}

// 加载统计数据
async function loadStatistics() {
  try {
    const result = await window.electronAPI.salaryStatistics.get({ month: statsMonth.value })
    statistics.value = result
    nextTick(() => {
      renderCharts()
    })
  } catch (e) {
    ElMessage.error('加载统计数据失败：' + e.message)
  }
}

// 渲染图表
function renderCharts() {
  renderDeptChart()
  renderRangeChart()
  renderTrendChart()
}

function renderDeptChart() {
  if (!deptChartRef.value) return
  if (deptChart) deptChart.dispose()
  deptChart = echarts.init(deptChartRef.value)
  const data = statistics.value.deptDistribution.map(item => ({
    name: item.department_name || '未知部门',
    value: item.total_salary
  }))
  deptChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: data,
      label: { show: true, formatter: '{b}\n{d}%' }
    }]
  })
}

function renderRangeChart() {
  if (!rangeChartRef.value) return
  if (rangeChart) rangeChart.dispose()
  rangeChart = echarts.init(rangeChartRef.value)
  const data = statistics.value.salaryRange
  rangeChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(item => item.salary_range) },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'bar',
      data: data.map(item => item.count),
      itemStyle: { color: '#409eff' }
    }]
  })
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)
  const data = statistics.value.monthlyTrend
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(item => item.month) },
    yAxis: { type: 'value', name: '薪资总额' },
    series: [{
      type: 'line',
      data: data.map(item => item.total_salary),
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#67c23a' }
    }]
  })
}

// 工资条操作
function handleAddSheet() {
  sheetIsEdit.value = false
  sheetCurrentId.value = null
  const now = new Date()
  sheetForm.value = {
    employee_id: null, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    base_salary: 0, overtime_pay: 0, bonus: 0, allowance: 0,
    deduction: 0, tax: 0, insurance: 0, status: 'draft', remark: ''
  }
  sheetDialogVisible.value = true
}

function handleEditSheet(row) {
  sheetIsEdit.value = true
  sheetCurrentId.value = row.id
  sheetForm.value = {
    employee_id: row.employee_id,
    month: row.month,
    base_salary: row.base_salary || 0,
    overtime_pay: row.overtime_pay || 0,
    bonus: row.bonus || 0,
    allowance: row.allowance || 0,
    deduction: row.deduction || 0,
    tax: row.tax || 0,
    insurance: row.insurance || 0,
    status: row.status || 'draft',
    remark: row.remark || ''
  }
  sheetDialogVisible.value = true
}

async function handleDeleteSheet(row) {
  try {
    await ElMessageBox.confirm('确定要删除该工资条吗？', '提示', { type: 'warning' })
    await window.electronAPI.salarySheet.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadSheets()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitSheet() {
  try {
    await sheetFormRef.value.validate()
    sheetSubmitting.value = true
    const data = JSON.parse(JSON.stringify({
      ...sheetForm.value,
      actual_salary: calculatedActualSalary.value
    }))
    if (sheetIsEdit.value) {
      await window.electronAPI.salarySheet.update(sheetCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.salarySheet.add(data, getOperator())
      ElMessage.success('新增成功')
    }
    sheetDialogVisible.value = false
    loadSheets()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    sheetSubmitting.value = false
  }
}

// 批量生成
function handleBatchGenerate() {
  const now = new Date()
  batchForm.value = { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, scope: 'all', employee_ids: [] }
  batchDialogVisible.value = true
}

async function handleSubmitBatch() {
  try {
    await batchFormRef.value.validate()
    batchSubmitting.value = true
    const employeeIds = batchForm.value.scope === 'all' ? [] : batchForm.value.employee_ids
    const result = await window.electronAPI.salarySheet.batchGenerate(batchForm.value.month, employeeIds, getOperator())
    ElMessage.success(`生成完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
    batchDialogVisible.value = false
    loadSheets()
  } catch (e) {
    if (e !== false) ElMessage.error('生成失败：' + e.message)
  } finally {
    batchSubmitting.value = false
  }
}

// 调薪操作
function handleAddAdjustment() {
  adjustmentForm.value = {
    employee_id: null, type: 'raise', adjust_amount: 0, effective_date: null, reason: '', remark: ''
  }
  adjustmentDialogVisible.value = true
}

async function handleDeleteAdjustment(row) {
  try {
    await ElMessageBox.confirm('确定要删除该调薪记录吗？', '提示', { type: 'warning' })
    await window.electronAPI.salaryAdjustment.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadAdjustments()
    empStore.loadAll() // 刷新员工数据
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitAdjustment() {
  try {
    await adjustmentFormRef.value.validate()
    adjustmentSubmitting.value = true
    const data = JSON.parse(JSON.stringify({
      ...adjustmentForm.value,
      effective_date: adjustmentForm.value.effective_date ? Math.floor(adjustmentForm.value.effective_date / 1000) : null
    }))
    await window.electronAPI.salaryAdjustment.add(data, getOperator())
    ElMessage.success('调薪成功')
    adjustmentDialogVisible.value = false
    loadAdjustments()
    empStore.loadAll() // 刷新员工数据
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    adjustmentSubmitting.value = false
  }
}

// 监听统计Tab切换
watch(activeTab, (val) => {
  if (val === 'statistics') {
    nextTick(() => {
      loadStatistics()
    })
  }
})

// 窗口大小变化时重绘图表
window.addEventListener('resize', () => {
  deptChart?.resize()
  rangeChart?.resize()
  trendChart?.resize()
})

onMounted(() => {
  empStore.loadAll()
  dictStore.loadAll()
  loadSheets()
  loadAdjustments()
})
</script>

<style scoped>
.salary-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tab-header {
  margin-bottom: 16px;
}
.search-form {
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.actual-salary {
  color: #f56c6c;
  font-weight: 600;
}
.actual-salary-large {
  color: #f56c6c;
  font-size: 24px;
  font-weight: 600;
}
.raise {
  color: #67c23a;
  font-weight: 600;
}
.cut {
  color: #f56c6c;
  font-weight: 600;
}
.stats-cards {
  margin-bottom: 16px;
}
.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}
.charts-row {
  margin-top: 16px;
}
.chart-container {
  height: 250px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
