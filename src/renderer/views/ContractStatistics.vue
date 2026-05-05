<template>
  <div class="contract-statistics">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">
          <el-icon :size="24"><Tickets /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalContracts }}</div>
          <div class="stat-label">合同总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #10b981;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeContracts }}</div>
          <div class="stat-label">生效中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.expiringContracts }}</div>
          <div class="stat-label">即将到期</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ef4444;">
          <el-icon :size="24"><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.expiredContracts }}</div>
          <div class="stat-label">已过期</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-form :inline="true" class="filter-form">
      <el-form-item label="部门">
        <el-select v-model="selectedDept" placeholder="全部部门" clearable style="width: 200px" @change="loadData">
          <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="合同状态">
        <el-select v-model="selectedStatus" placeholder="全部状态" clearable style="width: 120px" @change="loadData">
          <el-option v-for="item in contractStatuses" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="合同类型">
        <el-select v-model="selectedType" placeholder="全部类型" clearable style="width: 120px" @change="loadData">
          <el-option v-for="item in contractTypes" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 图表区域 -->
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>合同状态分布</span>
        </template>
        <div ref="statusChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>合同类型分布</span>
        </template>
        <div ref="typeChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 即将到期合同提醒 -->
    <el-card class="expiring-card" v-if="expiringList.length > 0">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon style="color: #f59e0b; margin-right: 8px;"><Warning /></el-icon>
            即将到期合同（30天内）
          </span>
        </div>
      </template>
      <el-table :data="expiringList" stripe border max-height="300">
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="department_name" label="所属部门" width="150" />
        <el-table-column prop="contract_no" label="合同编号" width="150" />
        <el-table-column prop="contract_type" label="合同类型" width="100">
          <template #default="{ row }">{{ getTypeLabel(row.contract_type) }}</template>
        </el-table-column>
        <el-table-column prop="end_date" label="到期日期" width="120">
          <template #default="{ row }">{{ formatDate(row.end_date) }}</template>
        </el-table-column>
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.daysLeft <= 7 ? 'danger' : row.daysLeft <= 15 ? 'warning' : 'info'">
              {{ row.daysLeft }}天
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 合同明细表 -->
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>合同明细</span>
          <el-button @click="handleExport">导出</el-button>
        </div>
      </template>
      <el-table :data="detailList" v-loading="loading" stripe border max-height="400">
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="department_name" label="所属部门" width="150" />
        <el-table-column prop="contract_no" label="合同编号" width="150" />
        <el-table-column prop="contract_type" label="合同类型" width="100">
          <template #default="{ row }">{{ getTypeLabel(row.contract_type) }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120">
          <template #default="{ row }">{{ formatDate(row.start_date) }}</template>
        </el-table-column>
        <el-table-column prop="end_date" label="结束日期" width="120">
          <template #default="{ row }">{{ formatDate(row.end_date) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Tickets, CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import { useDeptStore } from '../stores/dept.js'
import { useDictStore } from '../stores/dict.js'
import { storeToRefs } from 'pinia'

const deptStore = useDeptStore()
const dictStore = useDictStore()
const { list: departments } = storeToRefs(deptStore)
const { list: dictList } = storeToRefs(dictStore)

// 字典数据
const contractTypes = computed(() => dictList.value.filter(item => item.type_code === 'contract_type'))
const contractStatuses = computed(() => dictList.value.filter(item => item.type_code === 'contract_status'))

const loading = ref(false)
const selectedDept = ref(null)
const selectedStatus = ref('')
const selectedType = ref('')

// 统计数据
const stats = ref({
  totalContracts: 0,
  activeContracts: 0,
  expiringContracts: 0,
  expiredContracts: 0
})

// 明细列表
const detailList = ref([])
const expiringList = ref([])

// 图表
const statusChartRef = ref(null)
const typeChartRef = ref(null)
let statusChart = null
let typeChart = null

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
 * 加载数据
 */
async function loadData() {
  loading.value = true
  try {
    const result = await window.electronAPI.contract.getAll({ page: 1, pageSize: 1000 })
    let list = result.list || []

    // 按部门筛选
    if (selectedDept.value) {
      list = list.filter(item => item.department_id === selectedDept.value)
    }

    // 按状态筛选
    if (selectedStatus.value) {
      list = list.filter(item => item.status === selectedStatus.value)
    }

    // 按类型筛选
    if (selectedType.value) {
      list = list.filter(item => item.contract_type === selectedType.value)
    }

    detailList.value = list

    // 计算统计数据
    const now = Math.floor(Date.now() / 1000)
    const thirtyDays = 30 * 24 * 60 * 60

    stats.value.totalContracts = list.length
    stats.value.activeContracts = list.filter(c => c.status === 'active').length
    stats.value.expiredContracts = list.filter(c => c.status === 'expired' || (c.end_date && c.end_date < now)).length

    // 即将到期合同
    const expiring = list.filter(c => {
      if (!c.end_date || c.status !== 'active') return false
      const daysLeft = Math.floor((c.end_date - now) / 86400)
      return daysLeft > 0 && daysLeft <= 30
    }).map(c => ({
      ...c,
      daysLeft: Math.floor((c.end_date - now) / 86400)
    })).sort((a, b) => a.daysLeft - b.daysLeft)

    stats.value.expiringContracts = expiring.length
    expiringList.value = expiring

    // 更新图表
    updateCharts(list)
  } catch (e) {
    console.error('加载数据失败', e)
    ElMessage.error('加载数据失败：' + e.message)
  } finally {
    loading.value = false
  }
}

/**
 * 更新图表
 */
function updateCharts(list) {
  // 合同状态分布
  const statusCount = { active: 0, expired: 0, terminated: 0 }
  list.forEach(c => {
    if (statusCount.hasOwnProperty(c.status)) {
      statusCount[c.status]++
    }
  })

  if (statusChart) {
    statusChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}份 ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '状态分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: statusCount.active, name: '生效中', itemStyle: { color: '#10b981' } },
          { value: statusCount.expired, name: '已过期', itemStyle: { color: '#f59e0b' } },
          { value: statusCount.terminated, name: '已终止', itemStyle: { color: '#6b7280' } }
        ].filter(item => item.value > 0)
      }]
    })
  }

  // 合同类型分布
  const typeCount = {}
  list.forEach(c => {
    const typeName = getTypeLabel(c.contract_type) || '其他'
    typeCount[typeName] = (typeCount[typeName] || 0) + 1
  })

  if (typeChart) {
    typeChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}份 ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '类型分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: Object.keys(typeCount).map(name => ({
          value: typeCount[name],
          name: name
        }))
      }]
    })
  }
}

/**
 * 导出数据
 */
function handleExport() {
  if (detailList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const exportData = detailList.value.map(item => ({
    '员工姓名': item.employee_name,
    '所属部门': item.department_name,
    '合同编号': item.contract_no,
    '合同类型': getTypeLabel(item.contract_type),
    '开始日期': formatDate(item.start_date),
    '结束日期': formatDate(item.end_date),
    '状态': getStatusLabel(item.status),
    '备注': item.remark || ''
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '合同统计')
  const fileName = `合同统计_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)

  ElMessage.success('导出成功')
}

/**
 * 初始化图表
 */
function initCharts() {
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
  }
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
  }
}

onMounted(async () => {
  await deptStore.loadAll()
  await dictStore.loadAll()
  initCharts()
  loadData()
})

onUnmounted(() => {
  if (statusChart) statusChart.dispose()
  if (typeChart) typeChart.dispose()
})
</script>

<style scoped>
.contract-statistics {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.filter-form {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: #fff;
}

.chart-container {
  height: 300px;
}

.expiring-card {
  background: #fff;
}

.detail-card {
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>