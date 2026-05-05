<template>
  <div class="performance-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 考核指标 -->
      <el-tab-pane label="考核指标" name="indicator">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('indicator:add')" @click="handleAddIndicator">新增指标</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="类别">
            <el-select v-model="indicatorCategory" placeholder="全部" clearable>
              <el-option v-for="item in indicatorCategories" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadIndicators">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="indicators" v-loading="indicatorLoading" stripe border>
          <el-table-column prop="name" label="指标名称" width="200" />
          <el-table-column prop="category" label="类别" width="120">
            <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
          </el-table-column>
          <el-table-column prop="max_score" label="最高分" width="100" />
          <el-table-column prop="weight" label="权重" width="100" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('indicator:edit')" @click="handleEditIndicator(row)">编辑</el-button>
              <el-button link type="danger" v-if="hasPermission('indicator:delete')" @click="handleDeleteIndicator(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="indicatorPage" v-model:page-size="indicatorPageSize" :total="indicatorTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadIndicators" @current-change="loadIndicators" class="pagination" />
      </el-tab-pane>

      <!-- 考核记录 -->
      <el-tab-pane label="考核记录" name="assessment">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('assessment:add')" @click="handleAddAssessment">新增考核</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="员工">
            <el-input v-model="assessmentSearch" placeholder="姓名/账号" clearable @keyup.enter="loadAssessments" />
          </el-form-item>
          <el-form-item label="考核周期">
            <el-input v-model="assessmentPeriod" placeholder="如：2024-01" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadAssessments">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="assessments" v-loading="assessmentLoading" stripe border>
          <el-table-column prop="employee_name" label="员工姓名" width="120" />
          <el-table-column prop="department_name" label="所属部门" width="150" />
          <el-table-column prop="period" label="考核周期" width="120" />
          <el-table-column prop="total_score" label="总分" width="100" />
          <el-table-column prop="level" label="等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.level" :type="getLevelType(row.level)">{{ getLevelLabel(row.level) }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'info'">{{ row.status === 'completed' ? '已完成' : '待评分' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('assessment:score')" @click="handleScoreAssessment(row)">评分</el-button>
              <el-button link type="primary" v-if="hasPermission('assessment:edit')" @click="handleEditAssessment(row)">编辑</el-button>
              <el-button link type="danger" v-if="hasPermission('assessment:delete')" @click="handleDeleteAssessment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="assessmentPage" v-model:page-size="assessmentPageSize" :total="assessmentTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadAssessments" @current-change="loadAssessments" class="pagination" />
      </el-tab-pane>
    </el-tabs>

    <!-- 指标对话框 -->
    <el-dialog v-model="indicatorDialogVisible" :title="indicatorIsEdit ? '编辑指标' : '新增指标'" width="500" destroy-on-close>
      <el-form :model="indicatorForm" :rules="indicatorRules" ref="indicatorFormRef" label-width="100px">
        <el-form-item label="指标名称" prop="name">
          <el-input v-model="indicatorForm.name" placeholder="请输入指标名称" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="indicatorForm.category" placeholder="请选择类别">
            <el-option v-for="item in indicatorCategories" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最高分" prop="max_score">
          <el-input-number v-model="indicatorForm.max_score" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number v-model="indicatorForm.weight" :min="0.1" :max="10" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="indicatorForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="indicatorForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="indicatorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitIndicator" :loading="indicatorSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 考核对话框 -->
    <el-dialog v-model="assessmentDialogVisible" :title="assessmentIsEdit ? '编辑考核' : '新增考核'" width="500" destroy-on-close>
      <el-form :model="assessmentForm" :rules="assessmentRules" ref="assessmentFormRef" label-width="100px">
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
        <el-form-item label="考核周期" prop="period">
          <el-input v-model="assessmentForm.period" placeholder="如：2024-01" />
        </el-form-item>
        <el-form-item label="考核等级" prop="level">
          <el-select v-model="assessmentForm.level" placeholder="请选择等级">
            <el-option v-for="item in assessmentLevels" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="assessmentForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assessmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAssessment" :loading="assessmentSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 评分对话框 -->
    <el-dialog v-model="scoreDialogVisible" title="考核评分" width="700" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="员工">{{ currentAssessment?.employee_name }}</el-descriptions-item>
        <el-descriptions-item label="考核周期">{{ currentAssessment?.period }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="scoreDetails" class="score-table">
        <el-table-column prop="indicator_name" label="指标名称" width="200" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="max_score" label="最高分" width="100" />
        <el-table-column label="得分" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.score" :min="0" :max="row.max_score" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="备注">
          <template #default="{ row }">
            <el-input v-model="row.remark" size="small" placeholder="备注" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="scoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitScore" :loading="scoreSubmitting">保存评分</el-button>
      </template>
    </el-dialog>

    <!-- 员工选择器 -->
    <EmployeeSelector
      v-model="employeeSelectorVisible"
      :selected-ids="employeeSelectedIds"
      @confirm="handleEmployeeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
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
const indicatorCategories = computed(() => dictList.value.filter(item => item.type_code === 'indicator_category'))
const assessmentLevels = computed(() => dictList.value.filter(item => item.type_code === 'assessment_level'))

const activeTab = ref('indicator')

// 指标相关
const indicatorLoading = ref(false)
const indicators = ref([])
const indicatorTotal = ref(0)
const indicatorPage = ref(1)
const indicatorPageSize = ref(20)
const indicatorCategory = ref('')
const indicatorDialogVisible = ref(false)
const indicatorIsEdit = ref(false)
const indicatorSubmitting = ref(false)
const indicatorFormRef = ref(null)
const indicatorCurrentId = ref(null)
const indicatorForm = ref({ name: '', category: '', max_score: 100, weight: 1, sort: 0, description: '' })
const indicatorRules = { name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }] }

// 考核相关
const assessmentLoading = ref(false)
const assessments = ref([])
const assessmentTotal = ref(0)
const assessmentPage = ref(1)
const assessmentPageSize = ref(20)
const assessmentSearch = ref('')
const assessmentPeriod = ref('')
const assessmentDialogVisible = ref(false)
const assessmentIsEdit = ref(false)
const assessmentSubmitting = ref(false)
const assessmentFormRef = ref(null)
const assessmentCurrentId = ref(null)
const assessmentForm = ref({ employee_id: null, period: '', level: '', remark: '' })
const assessmentRules = { employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }], period: [{ required: true, message: '请输入考核周期', trigger: 'blur' }] }

// 评分相关
const scoreDialogVisible = ref(false)
const scoreSubmitting = ref(false)
const currentAssessment = ref(null)
const scoreDetails = ref([])

// 员工选择器
const employeeSelectorVisible = ref(false)
const employeeSelectedIds = computed(() => assessmentForm.value.employee_id ? [assessmentForm.value.employee_id] : [])
const employeeName = computed(() => {
  if (!assessmentForm.value.employee_id) return ''
  const emp = employees.value.find(e => e.id === assessmentForm.value.employee_id)
  return emp ? `${emp.name} (${emp.account})` : ''
})

function showEmployeeSelector() {
  employeeSelectorVisible.value = true
}

function handleEmployeeConfirm(selectedList) {
  if (selectedList.length > 0) {
    assessmentForm.value.employee_id = selectedList[0].id
  } else {
    assessmentForm.value.employee_id = null
  }
}

function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

/** 获取当前操作人信息 */
function getOperator() {
  const user = authStore.currentUser
  return user ? { id: user.id, name: user.name } : null
}

function getCategoryLabel(category) {
  const item = indicatorCategories.value.find(t => t.value === category)
  return item ? item.label : category
}

function getLevelLabel(level) {
  const item = assessmentLevels.value.find(t => t.value === level)
  return item ? item.label : level
}

function getLevelType(level) {
  const map = { excellent: 'success', good: 'primary', qualified: 'info', improve: 'warning', unqualified: 'danger' }
  return map[level] || 'info'
}

// 加载指标
async function loadIndicators() {
  indicatorLoading.value = true
  try {
    const result = await window.electronAPI.indicator.getAll({
      page: indicatorPage.value,
      pageSize: indicatorPageSize.value,
      category: indicatorCategory.value
    })
    indicators.value = result.list
    indicatorTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    indicatorLoading.value = false
  }
}

// 加载考核
async function loadAssessments() {
  assessmentLoading.value = true
  try {
    const result = await window.electronAPI.assessment.getAll({
      page: assessmentPage.value,
      pageSize: assessmentPageSize.value,
      keyword: assessmentSearch.value,
      period: assessmentPeriod.value
    })
    assessments.value = result.list
    assessmentTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    assessmentLoading.value = false
  }
}

// 指标操作
function handleAddIndicator() {
  indicatorIsEdit.value = false
  indicatorCurrentId.value = null
  indicatorForm.value = { name: '', category: '', max_score: 100, weight: 1, sort: 0, description: '' }
  indicatorDialogVisible.value = true
}

function handleEditIndicator(row) {
  indicatorIsEdit.value = true
  indicatorCurrentId.value = row.id
  indicatorForm.value = {
    name: row.name,
    category: row.category || '',
    max_score: row.max_score || 100,
    weight: row.weight || 1,
    sort: row.sort || 0,
    description: row.description || ''
  }
  indicatorDialogVisible.value = true
}

async function handleDeleteIndicator(row) {
  try {
    await ElMessageBox.confirm('确定要删除该指标吗？', '提示', { type: 'warning' })
    await window.electronAPI.indicator.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadIndicators()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitIndicator() {
  try {
    await indicatorFormRef.value.validate()
    indicatorSubmitting.value = true
    // 转换为普通对象，避免 IPC 序列化问题
    const data = JSON.parse(JSON.stringify({
      name: indicatorForm.value.name,
      category: indicatorForm.value.category,
      max_score: indicatorForm.value.max_score,
      weight: indicatorForm.value.weight,
      sort: indicatorForm.value.sort,
      description: indicatorForm.value.description
    }))
    if (indicatorIsEdit.value) {
      await window.electronAPI.indicator.update(indicatorCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.indicator.add(data, getOperator())
      ElMessage.success('新增成功')
    }
    indicatorDialogVisible.value = false
    loadIndicators()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    indicatorSubmitting.value = false
  }
}

// 考核操作
function handleAddAssessment() {
  assessmentIsEdit.value = false
  assessmentCurrentId.value = null
  const now = new Date()
  assessmentForm.value = { employee_id: null, period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, level: '', remark: '' }
  assessmentDialogVisible.value = true
}

function handleEditAssessment(row) {
  assessmentIsEdit.value = true
  assessmentCurrentId.value = row.id
  assessmentForm.value = {
    employee_id: row.employee_id,
    period: row.period || '',
    level: row.level || '',
    remark: row.remark || ''
  }
  assessmentDialogVisible.value = true
}

async function handleDeleteAssessment(row) {
  try {
    await ElMessageBox.confirm('确定要删除该考核记录吗？', '提示', { type: 'warning' })
    await window.electronAPI.assessment.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadAssessments()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitAssessment() {
  try {
    await assessmentFormRef.value.validate()
    assessmentSubmitting.value = true
    // 转换为普通对象，避免 IPC 序列化问题
    const data = JSON.parse(JSON.stringify({
      employee_id: assessmentForm.value.employee_id,
      period: assessmentForm.value.period,
      level: assessmentForm.value.level,
      remark: assessmentForm.value.remark
    }))
    if (assessmentIsEdit.value) {
      await window.electronAPI.assessment.update(assessmentCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.assessment.add(data, getOperator())
      ElMessage.success('新增成功')
    }
    assessmentDialogVisible.value = false
    loadAssessments()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    assessmentSubmitting.value = false
  }
}

// 评分操作
async function handleScoreAssessment(row) {
  currentAssessment.value = row
  try {
    // 获取所有指标
    const indicatorResult = await window.electronAPI.indicator.getAll({ page: 1, pageSize: 100 })
    // 获取已有评分
    const existingDetails = await window.electronAPI.assessment.getDetails(row.id)
    // 合并数据
    scoreDetails.value = indicatorResult.list.map(ind => {
      const existing = existingDetails.find(d => d.indicator_id === ind.id)
      return {
        indicator_id: ind.id,
        indicator_name: ind.name,
        category: ind.category,
        max_score: ind.max_score,
        score: existing?.score || 0,
        remark: existing?.remark || ''
      }
    })
    scoreDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载评分数据失败：' + e.message)
  }
}

async function handleSubmitScore() {
  try {
    scoreSubmitting.value = true
    const details = scoreDetails.value.map(d => ({
      indicator_id: d.indicator_id,
      score: d.score,
      remark: d.remark
    }))
    await window.electronAPI.assessment.saveDetails(currentAssessment.value.id, details, getOperator())
    // 更新状态为已完成
    await window.electronAPI.assessment.update(currentAssessment.value.id, { status: 'completed' }, getOperator())
    ElMessage.success('评分保存成功')
    scoreDialogVisible.value = false
    loadAssessments()
  } catch (e) {
    ElMessage.error('保存失败：' + e.message)
  } finally {
    scoreSubmitting.value = false
  }
}

onMounted(() => {
  empStore.loadAll()
  dictStore.loadAll()
  loadIndicators()
  loadAssessments()
})
</script>

<style scoped>
.performance-manage {
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
.score-table {
  margin-top: 16px;
}
</style>
