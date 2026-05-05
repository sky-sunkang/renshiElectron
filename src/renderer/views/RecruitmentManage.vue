<template>
  <div class="recruitment-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 岗位管理 -->
      <el-tab-pane label="岗位管理" name="position">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('position:add')" @click="handleAddPosition">新增岗位</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="关键词">
            <el-input v-model="positionSearch" placeholder="岗位名称/部门" clearable @keyup.enter="loadPositions" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="positionStatus" placeholder="全部" clearable>
              <el-option v-for="item in positionStatuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadPositions">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="positions" v-loading="positionLoading" stripe border>
          <el-table-column prop="title" label="岗位名称" width="150" />
          <el-table-column prop="department_name" label="所属部门" width="150" />
          <el-table-column prop="salary_range" label="薪资范围" width="150" />
          <el-table-column prop="headcount" label="招聘人数" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getPositionStatusType(row.status)">{{ getPositionStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发布时间" width="150">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('position:edit')" @click="handleEditPosition(row)">编辑</el-button>
              <el-button link type="danger" v-if="hasPermission('position:delete')" @click="handleDeletePosition(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="positionPage" v-model:page-size="positionPageSize" :total="positionTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadPositions" @current-change="loadPositions" class="pagination" />
      </el-tab-pane>

      <!-- 候选人管理 -->
      <el-tab-pane label="候选人管理" name="candidate">
        <div class="tab-header">
          <el-button type="primary" v-if="hasPermission('candidate:add')" @click="handleAddCandidate">新增候选人</el-button>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="关键词">
            <el-input v-model="candidateSearch" placeholder="姓名/电话/邮箱" clearable @keyup.enter="loadCandidates" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="candidateStatus" placeholder="全部" clearable>
              <el-option v-for="item in candidateStatuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadCandidates">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="candidates" v-loading="candidateLoading" stripe border>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="position_title" label="应聘岗位" width="150" />
          <el-table-column prop="department_name" label="部门" width="120" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="email" label="邮箱" width="180" />
          <el-table-column prop="source" label="来源" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getCandidateStatusType(row.status)">{{ getCandidateStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('candidate:edit')" @click="handleEditCandidate(row)">编辑</el-button>
              <el-button link type="success" v-if="hasPermission('interview:add')" @click="handleArrangeInterview(row)">安排面试</el-button>
              <el-button link type="danger" v-if="hasPermission('candidate:delete')" @click="handleDeleteCandidate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="candidatePage" v-model:page-size="candidatePageSize" :total="candidateTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadCandidates" @current-change="loadCandidates" class="pagination" />
      </el-tab-pane>

      <!-- 面试安排 -->
      <el-tab-pane label="面试安排" name="interview">
        <el-form :inline="true" class="search-form">
          <el-form-item label="状态">
            <el-select v-model="interviewStatus" placeholder="全部" clearable>
              <el-option v-for="item in interviewStatuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadInterviews">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="interviews" v-loading="interviewLoading" stripe border>
          <el-table-column prop="candidate_name" label="候选人" width="100" />
          <el-table-column prop="position_title" label="应聘岗位" width="150" />
          <el-table-column prop="interviewer_name" label="面试官" width="100" />
          <el-table-column prop="interview_time" label="面试时间" width="150">
            <template #default="{ row }">{{ formatTime(row.interview_time) }}</template>
          </el-table-column>
          <el-table-column prop="location" label="地点" width="120" />
          <el-table-column prop="round" label="轮次" width="80" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">{{ getInterviewTypeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getInterviewStatusType(row.status)">{{ getInterviewStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" v-if="hasPermission('interview:edit')" @click="handleEditInterview(row)">编辑</el-button>
              <el-button link type="danger" v-if="hasPermission('interview:delete')" @click="handleDeleteInterview(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="interviewPage" v-model:page-size="interviewPageSize" :total="interviewTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadInterviews" @current-change="loadInterviews" class="pagination" />
      </el-tab-pane>
    </el-tabs>

    <!-- 岗位对话框 -->
    <el-dialog v-model="positionDialogVisible" :title="positionIsEdit ? '编辑岗位' : '新增岗位'" width="600" destroy-on-close>
      <el-form :model="positionForm" :rules="positionRules" ref="positionFormRef" label-width="100px">
        <el-form-item label="岗位名称" prop="title">
          <el-input v-model="positionForm.title" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-input
            :value="departmentName"
            readonly
            placeholder="请选择部门"
            @click="showDeptSelector"
          >
            <template #suffix>
              <el-icon style="cursor: pointer"><OfficeBuilding /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="薪资范围" prop="salary_range">
          <el-input v-model="positionForm.salary_range" placeholder="如：15k-25k" />
        </el-form-item>
        <el-form-item label="招聘人数" prop="headcount">
          <el-input-number v-model="positionForm.headcount" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="岗位状态" prop="status">
          <el-select v-model="positionForm.status" placeholder="请选择状态">
            <el-option v-for="item in positionStatuses" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位要求" prop="requirements">
          <el-input v-model="positionForm.requirements" type="textarea" :rows="3" placeholder="请输入岗位要求" />
        </el-form-item>
        <el-form-item label="岗位描述" prop="description">
          <el-input v-model="positionForm.description" type="textarea" :rows="3" placeholder="请输入岗位描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPosition" :loading="positionSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 部门选择器 -->
    <DeptSelector
      v-model="deptSelectorVisible"
      :selected-id="positionForm.department_id"
      @confirm="handleDeptConfirm"
    />

    <!-- 候选人对话框 -->
    <el-dialog v-model="candidateDialogVisible" :title="candidateIsEdit ? '编辑候选人' : '新增候选人'" width="600" destroy-on-close>
      <el-form :model="candidateForm" :rules="candidateRules" ref="candidateFormRef" label-width="100px">
        <el-form-item label="应聘岗位" prop="position_id">
          <el-select v-model="candidateForm.position_id" filterable placeholder="请选择岗位" style="width: 100%">
            <el-option v-for="pos in positions" :key="pos.id" :label="`${pos.title} (${pos.department_name || ''})`" :value="pos.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="candidateForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="candidateForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="candidateForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="来源渠道" prop="source">
          <el-input v-model="candidateForm.source" placeholder="如：猎聘、BOSS直聘" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="candidateForm.status" placeholder="请选择状态">
            <el-option v-for="item in candidateStatuses" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="简历" prop="resume">
          <el-input v-model="candidateForm.resume" type="textarea" :rows="3" placeholder="简历内容或链接" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="candidateForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="candidateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCandidate" :loading="candidateSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 面试对话框 -->
    <el-dialog v-model="interviewDialogVisible" :title="interviewIsEdit ? '编辑面试' : '安排面试'" width="600" destroy-on-close>
      <el-form :model="interviewForm" :rules="interviewRules" ref="interviewFormRef" label-width="100px">
        <el-form-item label="候选人" v-if="!interviewIsEdit">
          <el-input :value="currentCandidate?.name" disabled />
        </el-form-item>
        <el-form-item label="面试官" prop="interviewer_id">
          <el-input
            :value="interviewerName"
            readonly
            placeholder="请选择面试官"
            @click="showInterviewerSelector"
          >
            <template #suffix>
              <el-icon style="cursor: pointer"><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="面试时间" prop="interview_time">
          <el-date-picker v-model="interviewForm.interview_time" type="datetime" placeholder="选择面试时间" format="YYYY-MM-DD HH:mm" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="面试地点" prop="location">
          <el-input v-model="interviewForm.location" placeholder="请输入面试地点" />
        </el-form-item>
        <el-form-item label="面试轮次" prop="round">
          <el-input-number v-model="interviewForm.round" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="面试类型" prop="type">
          <el-select v-model="interviewForm.type" placeholder="请选择类型">
            <el-option v-for="item in interviewTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试状态" prop="status">
          <el-select v-model="interviewForm.status" placeholder="请选择状态">
            <el-option v-for="item in interviewStatuses" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="interviewForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitInterview" :loading="interviewSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 面试官选择器 -->
    <EmployeeSelector
      v-model="interviewerSelectorVisible"
      :selected-ids="interviewerSelectedIds"
      @confirm="handleInterviewerConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, OfficeBuilding } from '@element-plus/icons-vue'
import { usePermissionStore } from '../stores/permission.js'
import { useEmpStore } from '../stores/emp.js'
import { useDeptStore } from '../stores/dept.js'
import { useDictStore } from '../stores/dict.js'
import { useAuthStore } from '../stores/auth.js'
import { storeToRefs } from 'pinia'
import EmployeeSelector from '../components/EmployeeSelector.vue'
import DeptSelector from '../components/DeptSelector.vue'

const permStore = usePermissionStore()
const empStore = useEmpStore()
const deptStore = useDeptStore()
const dictStore = useDictStore()
const authStore = useAuthStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)
const { list: employees } = storeToRefs(empStore)
const { treeData: deptTree, list: deptList } = storeToRefs(deptStore)
const { list: dictList } = storeToRefs(dictStore)

// 字典数据
const positionStatuses = computed(() => dictList.value.filter(item => item.type_code === 'position_status'))
const candidateStatuses = computed(() => dictList.value.filter(item => item.type_code === 'candidate_status'))
const interviewStatuses = computed(() => dictList.value.filter(item => item.type_code === 'interview_status'))
const interviewTypes = computed(() => dictList.value.filter(item => item.type_code === 'interview_type'))

const activeTab = ref('position')

// 岗位相关
const positionLoading = ref(false)
const positions = ref([])
const positionTotal = ref(0)
const positionPage = ref(1)
const positionPageSize = ref(20)
const positionSearch = ref('')
const positionStatus = ref('')
const positionDialogVisible = ref(false)
const positionIsEdit = ref(false)
const positionSubmitting = ref(false)
const positionFormRef = ref(null)
const positionCurrentId = ref(null)
const positionForm = ref({ title: '', department_id: null, salary_range: '', headcount: 1, status: 'open', requirements: '', description: '' })
const positionRules = { title: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }] }

// 部门选择器
const deptSelectorVisible = ref(false)
const departmentName = computed(() => {
  if (!positionForm.value.department_id) return ''
  const dept = deptList.value.find(d => d.id === positionForm.value.department_id)
  return dept?.path_names || dept?.name || ''
})

function showDeptSelector() {
  deptSelectorVisible.value = true
}

function handleDeptConfirm(dept) {
  positionForm.value.department_id = dept.id
}

// 候选人相关
const candidateLoading = ref(false)
const candidates = ref([])
const candidateTotal = ref(0)
const candidatePage = ref(1)
const candidatePageSize = ref(20)
const candidateSearch = ref('')
const candidateStatus = ref('')
const candidateDialogVisible = ref(false)
const candidateIsEdit = ref(false)
const candidateSubmitting = ref(false)
const candidateFormRef = ref(null)
const candidateCurrentId = ref(null)
const currentCandidate = ref(null)
const candidateForm = ref({ position_id: null, name: '', phone: '', email: '', source: '', status: 'pending', resume: '', remark: '' })
const candidateRules = { name: [{ required: true, message: '请输入姓名', trigger: 'blur' }] }

// 面试相关
const interviewLoading = ref(false)
const interviews = ref([])
const interviewTotal = ref(0)
const interviewPage = ref(1)
const interviewPageSize = ref(20)
const interviewStatus = ref('')
const interviewDialogVisible = ref(false)
const interviewIsEdit = ref(false)
const interviewSubmitting = ref(false)
const interviewFormRef = ref(null)
const interviewCurrentId = ref(null)
const interviewForm = ref({ interviewer_id: null, interview_time: null, location: '', round: 1, type: 'onsite', status: 'scheduled', remark: '' })
const interviewRules = { interview_time: [{ required: true, message: '请选择面试时间', trigger: 'change' }] }

// 面试官选择器
const interviewerSelectorVisible = ref(false)
const interviewerSelectedIds = computed(() => interviewForm.value.interviewer_id ? [interviewForm.value.interviewer_id] : [])
const interviewerName = computed(() => {
  if (!interviewForm.value.interviewer_id) return ''
  const emp = employees.value.find(e => e.id === interviewForm.value.interviewer_id)
  return emp ? `${emp.name} (${emp.account})` : ''
})

function showInterviewerSelector() {
  interviewerSelectorVisible.value = true
}

function handleInterviewerConfirm(selectedList) {
  if (selectedList.length > 0) {
    interviewForm.value.interviewer_id = selectedList[0].id
  } else {
    interviewForm.value.interviewer_id = null
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

function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

// 岗位状态
function getPositionStatusLabel(status) {
  const item = positionStatuses.value.find(t => t.value === status)
  return item ? item.label : status
}
function getPositionStatusType(status) {
  const map = { open: 'success', closed: 'info', paused: 'warning' }
  return map[status] || 'info'
}

// 候选人状态
function getCandidateStatusLabel(status) {
  const item = candidateStatuses.value.find(t => t.value === status)
  return item ? item.label : status
}
function getCandidateStatusType(status) {
  const map = { pending: 'info', interviewing: 'warning', passed: 'success', rejected: 'danger', hired: 'success' }
  return map[status] || 'info'
}

// 面试状态和类型
function getInterviewStatusLabel(status) {
  const item = interviewStatuses.value.find(t => t.value === status)
  return item ? item.label : status
}
function getInterviewStatusType(status) {
  const map = { scheduled: 'info', ongoing: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}
function getInterviewTypeLabel(type) {
  const item = interviewTypes.value.find(t => t.value === type)
  return item ? item.label : type
}

// 加载岗位
async function loadPositions() {
  positionLoading.value = true
  try {
    const result = await window.electronAPI.position.getAll({
      page: positionPage.value,
      pageSize: positionPageSize.value,
      keyword: positionSearch.value,
      status: positionStatus.value
    })
    positions.value = result.list
    positionTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    positionLoading.value = false
  }
}

// 加载候选人
async function loadCandidates() {
  candidateLoading.value = true
  try {
    const result = await window.electronAPI.candidate.getAll({
      page: candidatePage.value,
      pageSize: candidatePageSize.value,
      keyword: candidateSearch.value,
      status: candidateStatus.value
    })
    candidates.value = result.list
    candidateTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    candidateLoading.value = false
  }
}

// 加载面试
async function loadInterviews() {
  interviewLoading.value = true
  try {
    const result = await window.electronAPI.interview.getAll({
      page: interviewPage.value,
      pageSize: interviewPageSize.value,
      status: interviewStatus.value
    })
    interviews.value = result.list
    interviewTotal.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    interviewLoading.value = false
  }
}

// 岗位操作
function handleAddPosition() {
  positionIsEdit.value = false
  positionCurrentId.value = null
  positionForm.value = { title: '', department_id: null, salary_range: '', headcount: 1, status: 'open', requirements: '', description: '' }
  positionDialogVisible.value = true
}

function handleEditPosition(row) {
  positionIsEdit.value = true
  positionCurrentId.value = row.id
  positionForm.value = {
    title: row.title,
    department_id: row.department_id,
    salary_range: row.salary_range || '',
    headcount: row.headcount || 1,
    status: row.status || 'open',
    requirements: row.requirements || '',
    description: row.description || ''
  }
  positionDialogVisible.value = true
}

async function handleDeletePosition(row) {
  try {
    await ElMessageBox.confirm('确定要删除该岗位吗？', '提示', { type: 'warning' })
    await window.electronAPI.position.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadPositions()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitPosition() {
  try {
    await positionFormRef.value.validate()
    positionSubmitting.value = true
    const dept = deptStore.list.find(d => d.id === positionForm.value.department_id)
    // 转换为普通对象，避免 IPC 序列化问题
    const data = JSON.parse(JSON.stringify({
      title: positionForm.value.title,
      department_id: positionForm.value.department_id,
      salary_range: positionForm.value.salary_range,
      headcount: positionForm.value.headcount,
      status: positionForm.value.status,
      requirements: positionForm.value.requirements,
      description: positionForm.value.description,
      department_name: dept?.name || ''
    }))
    if (positionIsEdit.value) {
      await window.electronAPI.position.update(positionCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.position.add(data, getOperator())
      ElMessage.success('新增成功')
    }
    positionDialogVisible.value = false
    loadPositions()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    positionSubmitting.value = false
  }
}

// 候选人操作
function handleAddCandidate() {
  candidateIsEdit.value = false
  candidateCurrentId.value = null
  candidateForm.value = { position_id: null, name: '', phone: '', email: '', source: '', status: 'pending', resume: '', remark: '' }
  candidateDialogVisible.value = true
}

function handleEditCandidate(row) {
  candidateIsEdit.value = true
  candidateCurrentId.value = row.id
  candidateForm.value = {
    position_id: row.position_id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    source: row.source || '',
    status: row.status || 'pending',
    resume: row.resume || '',
    remark: row.remark || ''
  }
  candidateDialogVisible.value = true
}

async function handleDeleteCandidate(row) {
  try {
    await ElMessageBox.confirm('确定要删除该候选人吗？', '提示', { type: 'warning' })
    await window.electronAPI.candidate.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadCandidates()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitCandidate() {
  try {
    await candidateFormRef.value.validate()
    candidateSubmitting.value = true
    // 转换为普通对象，避免 IPC 序列化问题
    const data = JSON.parse(JSON.stringify({
      position_id: candidateForm.value.position_id,
      name: candidateForm.value.name,
      phone: candidateForm.value.phone,
      email: candidateForm.value.email,
      source: candidateForm.value.source,
      status: candidateForm.value.status,
      resume: candidateForm.value.resume,
      remark: candidateForm.value.remark
    }))
    if (candidateIsEdit.value) {
      await window.electronAPI.candidate.update(candidateCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.candidate.add(data, getOperator())
      ElMessage.success('新增成功')
    }
    candidateDialogVisible.value = false
    loadCandidates()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    candidateSubmitting.value = false
  }
}

// 面试操作
function handleArrangeInterview(row) {
  currentCandidate.value = row
  interviewIsEdit.value = false
  interviewCurrentId.value = null
  interviewForm.value = { interviewer_id: null, interview_time: null, location: '', round: 1, type: 'onsite', status: 'scheduled', remark: '' }
  interviewDialogVisible.value = true
}

function handleEditInterview(row) {
  interviewIsEdit.value = true
  interviewCurrentId.value = row.id
  interviewForm.value = {
    interviewer_id: row.interviewer_id,
    interview_time: row.interview_time ? row.interview_time * 1000 : null,
    location: row.location || '',
    round: row.round || 1,
    type: row.type || 'onsite',
    status: row.status || 'scheduled',
    remark: row.remark || ''
  }
  interviewDialogVisible.value = true
}

async function handleDeleteInterview(row) {
  try {
    await ElMessageBox.confirm('确定要删除该面试记录吗？', '提示', { type: 'warning' })
    await window.electronAPI.interview.delete(row.id, getOperator())
    ElMessage.success('删除成功')
    loadInterviews()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败：' + e.message)
  }
}

async function handleSubmitInterview() {
  try {
    await interviewFormRef.value.validate()
    interviewSubmitting.value = true
    // 转换为普通对象，避免 IPC 序列化问题
    const data = JSON.parse(JSON.stringify({
      interviewer_id: interviewForm.value.interviewer_id,
      interview_time: interviewForm.value.interview_time ? Math.floor(interviewForm.value.interview_time / 1000) : null,
      location: interviewForm.value.location,
      round: interviewForm.value.round,
      type: interviewForm.value.type,
      status: interviewForm.value.status,
      remark: interviewForm.value.remark
    }))
    if (interviewIsEdit.value) {
      await window.electronAPI.interview.update(interviewCurrentId.value, data, getOperator())
      ElMessage.success('更新成功')
    } else {
      data.candidate_id = currentCandidate.value.id
      await window.electronAPI.interview.add(data, getOperator())
      ElMessage.success('安排成功')
    }
    interviewDialogVisible.value = false
    loadInterviews()
    loadCandidates()
  } catch (e) {
    if (e !== false) ElMessage.error('操作失败：' + e.message)
  } finally {
    interviewSubmitting.value = false
  }
}

onMounted(() => {
  empStore.loadAll()
  deptStore.loadAll()
  dictStore.loadAll()
  loadPositions()
  loadCandidates()
  loadInterviews()
})
</script>

<style scoped>
.recruitment-manage {
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
</style>
