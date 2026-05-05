<template>
  <div class="recruitment-statistics">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">
          <el-icon :size="24"><Briefcase /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activePositions }}</div>
          <div class="stat-label">招聘中岗位</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #10b981;">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalCandidates }}</div>
          <div class="stat-label">候选人总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">
          <el-icon :size="24"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.interviewing }}</div>
          <div class="stat-label">面试中人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #8b5cf6;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.hired }}</div>
          <div class="stat-label">已入职人数</div>
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
    </el-form>

    <!-- 图表区域 -->
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>候选人状态分布</span>
        </template>
        <div ref="statusChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>岗位招聘进度</span>
        </template>
        <div ref="positionChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 岗位招聘明细 -->
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>岗位招聘明细</span>
          <el-button @click="handleExport">导出</el-button>
        </div>
      </template>
      <el-table :data="positionList" v-loading="loading" stripe border>
        <el-table-column prop="title" label="岗位名称" width="180" />
        <el-table-column prop="department_name" label="所属部门" width="150" />
        <el-table-column prop="headcount" label="招聘人数" width="100" />
        <el-table-column prop="candidate_count" label="候选人数" width="100" />
        <el-table-column prop="interview_count" label="面试中" width="100" />
        <el-table-column prop="hired_count" label="已入职" width="100" />
        <el-table-column label="完成率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.completion_rate" :stroke-width="10" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'success' : row.status === 'paused' ? 'warning' : 'info'">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Briefcase, User, ChatDotRound, CircleCheck } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import { useDeptStore } from '../stores/dept.js'
import { useDictStore } from '../stores/dict.js'
import { storeToRefs } from 'pinia'

const deptStore = useDeptStore()
const dictStore = useDictStore()
const { list: departments } = storeToRefs(deptStore)
const { list: dictList } = storeToRefs(dictStore)

const loading = ref(false)
const selectedDept = ref(null)

// 统计数据
const stats = ref({
  activePositions: 0,
  totalCandidates: 0,
  interviewing: 0,
  hired: 0
})

// 岗位列表
const positionList = ref([])

// 图表
const statusChartRef = ref(null)
const positionChartRef = ref(null)
let statusChart = null
let positionChart = null

/**
 * 获取岗位状态显示文本
 */
function getStatusLabel(status) {
  const map = { open: '招聘中', closed: '已关闭', paused: '已暂停' }
  return map[status] || status
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true
  try {
    // 获取岗位数据
    const positionResult = await window.electronAPI.position.getAll({ page: 1, pageSize: 1000 })
    let positions = positionResult.list || []

    // 获取候选人数据
    const candidateResult = await window.electronAPI.candidate.getAll({ page: 1, pageSize: 1000 })
    let candidates = candidateResult.list || []

    // 获取面试数据
    const interviewResult = await window.electronAPI.interview.getAll({ page: 1, pageSize: 1000 })
    const interviews = interviewResult.list || []

    // 按部门筛选
    if (selectedDept.value) {
      positions = positions.filter(p => p.department_id === selectedDept.value)
      candidates = candidates.filter(c => {
        const pos = positions.find(p => p.id === c.position_id)
        return pos !== undefined
      })
    }

    // 统计数据
    stats.value.activePositions = positions.filter(p => p.status === 'open').length
    stats.value.totalCandidates = candidates.length
    stats.value.interviewing = candidates.filter(c => c.status === 'interviewing').length
    stats.value.hired = candidates.filter(c => c.status === 'hired').length

    // 岗位招聘明细
    positionList.value = positions.map(pos => {
      const posCandidates = candidates.filter(c => c.position_id === pos.id)
      const interviewCount = posCandidates.filter(c => c.status === 'interviewing').length
      const hiredCount = posCandidates.filter(c => c.status === 'hired').length
      const completionRate = pos.headcount > 0 ? Math.round((hiredCount / pos.headcount) * 100) : 0

      return {
        ...pos,
        candidate_count: posCandidates.length,
        interview_count: interviewCount,
        hired_count: hiredCount,
        completion_rate: completionRate
      }
    })

    // 更新图表
    updateCharts(candidates, positions)
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
function updateCharts(candidates, positions) {
  // 候选人状态分布
  const statusCount = {
    pending: 0,
    interviewing: 0,
    passed: 0,
    rejected: 0,
    hired: 0
  }
  candidates.forEach(c => {
    if (statusCount.hasOwnProperty(c.status)) {
      statusCount[c.status]++
    }
  })

  if (statusChart) {
    statusChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '状态分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: statusCount.pending, name: '待筛选', itemStyle: { color: '#6b7280' } },
          { value: statusCount.interviewing, name: '面试中', itemStyle: { color: '#f59e0b' } },
          { value: statusCount.passed, name: '已通过', itemStyle: { color: '#10b981' } },
          { value: statusCount.rejected, name: '已拒绝', itemStyle: { color: '#ef4444' } },
          { value: statusCount.hired, name: '已入职', itemStyle: { color: '#8b5cf6' } }
        ].filter(item => item.value > 0)
      }]
    })
  }

  // 岗位招聘进度
  const activePositions = positions.filter(p => p.status === 'open')
  const positionNames = activePositions.map(p => p.title)
  const hiredData = activePositions.map(p => {
    const posCandidates = candidates.filter(c => c.position_id === p.id && c.status === 'hired')
    return posCandidates.length
  })
  const targetData = activePositions.map(p => p.headcount)

  if (positionChart) {
    positionChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: positionNames, axisLabel: { rotate: 30, interval: 0 } },
      yAxis: { type: 'value', name: '人数' },
      series: [
        {
          name: '已入职',
          type: 'bar',
          data: hiredData,
          itemStyle: { color: '#8b5cf6' }
        },
        {
          name: '目标人数',
          type: 'bar',
          data: targetData,
          itemStyle: { color: '#3b82f6' }
        }
      ]
    })
  }
}

/**
 * 导出数据
 */
function handleExport() {
  if (positionList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const exportData = positionList.value.map(item => ({
    '岗位名称': item.title,
    '所属部门': item.department_name,
    '招聘人数': item.headcount,
    '候选人数': item.candidate_count,
    '面试中': item.interview_count,
    '已入职': item.hired_count,
    '完成率': item.completion_rate + '%',
    '状态': getStatusLabel(item.status)
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '招聘统计')
  const fileName = `招聘统计_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
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
  if (positionChartRef.value) {
    positionChart = echarts.init(positionChartRef.value)
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
  if (positionChart) positionChart.dispose()
})
</script>

<style scoped>
.recruitment-statistics {
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