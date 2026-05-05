<template>
  <div class="performance-statistics">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalAssessments }}</div>
          <div class="stat-label">考核记录数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #10b981;">
          <el-icon :size="24"><TrophyBase /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.excellentCount }}</div>
          <div class="stat-label">优秀人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgScore }}</div>
          <div class="stat-label">平均得分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ef4444;">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.unqualifiedCount }}</div>
          <div class="stat-label">不合格人数</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-form :inline="true" class="filter-form">
      <el-form-item label="考核周期">
        <el-input v-model="selectedPeriod" placeholder="如：2026-05" clearable style="width: 150px" @change="loadData" />
      </el-form-item>
      <el-form-item label="部门">
        <el-select v-model="selectedDept" placeholder="全部部门" clearable style="width: 200px" @change="loadData">
          <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="考核等级">
        <el-select v-model="selectedLevel" placeholder="全部等级" clearable style="width: 120px" @change="loadData">
          <el-option v-for="item in assessmentLevels" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 图表区域 -->
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>等级分布</span>
        </template>
        <div ref="levelChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>部门绩效对比</span>
        </template>
        <div ref="deptChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 得分趋势图 -->
    <el-card class="trend-card">
      <template #header>
        <span>得分趋势（近6期）</span>
      </template>
      <div ref="trendChartRef" class="chart-container-large"></div>
    </el-card>

    <!-- 绩效明细表 -->
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>绩效明细</span>
          <el-button @click="handleExport">导出</el-button>
        </div>
      </template>
      <el-table :data="detailList" v-loading="loading" stripe border max-height="400">
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="department_name" label="所属部门" width="150" />
        <el-table-column prop="period" label="考核周期" width="100" />
        <el-table-column prop="total_score" label="总得分" width="100" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.level" :type="getLevelType(row.level)">{{ getLevelLabel(row.level) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'info'">
              {{ row.status === 'completed' ? '已完成' : '待评分' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, TrophyBase, TrendCharts, Warning } from '@element-plus/icons-vue'
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
const assessmentLevels = computed(() => dictList.value.filter(item => item.type_code === 'assessment_level'))

const loading = ref(false)
const selectedPeriod = ref('')
const selectedDept = ref(null)
const selectedLevel = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 统计数据
const stats = ref({
  totalAssessments: 0,
  excellentCount: 0,
  avgScore: 0,
  unqualifiedCount: 0
})

// 明细列表
const detailList = ref([])

// 图表
const levelChartRef = ref(null)
const deptChartRef = ref(null)
const trendChartRef = ref(null)
let levelChart = null
let deptChart = null
let trendChart = null

/**
 * 获取等级标签颜色
 */
function getLevelType(level) {
  const map = { excellent: 'success', good: 'primary', qualified: 'info', improve: 'warning', unqualified: 'danger' }
  return map[level] || 'info'
}

/**
 * 获取等级显示文本
 */
function getLevelLabel(level) {
  const item = assessmentLevels.value.find(t => t.value === level)
  return item ? item.label : level
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true
  try {
    // 获取考核记录
    const result = await window.electronAPI.assessment.getAll({
      page: page.value,
      pageSize: pageSize.value,
      period: selectedPeriod.value,
      keyword: ''
    })

    let list = result.list || []

    // 按部门筛选
    if (selectedDept.value) {
      list = list.filter(item => item.department_id === selectedDept.value)
    }

    // 按等级筛选
    if (selectedLevel.value) {
      list = list.filter(item => item.level === selectedLevel.value)
    }

    detailList.value = list
    total.value = list.length

    // 计算统计数据
    const completedList = list.filter(item => item.status === 'completed')
    stats.value.totalAssessments = list.length
    stats.value.excellentCount = completedList.filter(item => item.level === 'excellent').length
    stats.value.unqualifiedCount = completedList.filter(item => item.level === 'unqualified').length

    if (completedList.length > 0) {
      const totalScore = completedList.reduce((sum, item) => sum + (item.total_score || 0), 0)
      stats.value.avgScore = (totalScore / completedList.length).toFixed(1)
    } else {
      stats.value.avgScore = 0
    }

    // 更新图表
    updateCharts(completedList)
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
  // 等级分布饼图
  const levelCount = {
    excellent: 0,
    good: 0,
    qualified: 0,
    improve: 0,
    unqualified: 0
  }
  list.forEach(item => {
    if (item.level && levelCount.hasOwnProperty(item.level)) {
      levelCount[item.level]++
    }
  })

  if (levelChart) {
    levelChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: levelCount.excellent, name: '优秀', itemStyle: { color: '#10b981' } },
          { value: levelCount.good, name: '良好', itemStyle: { color: '#3b82f6' } },
          { value: levelCount.qualified, name: '合格', itemStyle: { color: '#6b7280' } },
          { value: levelCount.improve, name: '待改进', itemStyle: { color: '#f59e0b' } },
          { value: levelCount.unqualified, name: '不合格', itemStyle: { color: '#ef4444' } }
        ].filter(item => item.value > 0)
      }]
    })
  }

  // 部门绩效对比
  const deptStats = {}
  list.forEach(item => {
    const deptName = item.department_name || '未分配'
    if (!deptStats[deptName]) {
      deptStats[deptName] = { total: 0, count: 0 }
    }
    deptStats[deptName].total += item.total_score || 0
    deptStats[deptName].count++
  })

  const deptNames = Object.keys(deptStats)
  const deptAvgScores = deptNames.map(name =>
    deptStats[name].count > 0 ? (deptStats[name].total / deptStats[name].count).toFixed(1) : 0
  )

  if (deptChart) {
    deptChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: deptNames, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '平均得分' },
      series: [{
        name: '平均得分',
        type: 'bar',
        data: deptAvgScores,
        itemStyle: { color: '#8b5cf6' }
      }]
    })
  }

  // 得分趋势图（近6期）
  updateTrendChart()
}

/**
 * 更新得分趋势图
 */
async function updateTrendChart() {
  try {
    // 获取近6期数据
    const periods = []
    const avgScores = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      periods.push(period)

      const result = await window.electronAPI.assessment.getAll({
        page: 1,
        pageSize: 1000,
        period: period
      })

      const completedList = (result.list || []).filter(item => item.status === 'completed')
      if (completedList.length > 0) {
        const totalScore = completedList.reduce((sum, item) => sum + (item.total_score || 0), 0)
        avgScores.push((totalScore / completedList.length).toFixed(1))
      } else {
        avgScores.push(0)
      }
    }

    if (trendChart) {
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: periods },
        yAxis: { type: 'value', name: '平均得分', min: 0, max: 100 },
        series: [{
          name: '平均得分',
          type: 'line',
          data: avgScores,
          smooth: true,
          itemStyle: { color: '#3b82f6' },
          areaStyle: { opacity: 0.3 }
        }]
      })
    }
  } catch (e) {
    console.error('更新趋势图失败', e)
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
    '考核周期': item.period,
    '总得分': item.total_score,
    '等级': getLevelLabel(item.level),
    '状态': item.status === 'completed' ? '已完成' : '待评分',
    '备注': item.remark || ''
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '绩效统计')
  const fileName = `绩效统计_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)

  ElMessage.success('导出成功')
}

/**
 * 初始化图表
 */
function initCharts() {
  if (levelChartRef.value) {
    levelChart = echarts.init(levelChartRef.value)
  }
  if (deptChartRef.value) {
    deptChart = echarts.init(deptChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
}

onMounted(async () => {
  await deptStore.loadAll()
  await dictStore.loadAll()
  initCharts()
  loadData()
})

onUnmounted(() => {
  if (levelChart) levelChart.dispose()
  if (deptChart) deptChart.dispose()
  if (trendChart) trendChart.dispose()
})
</script>

<style scoped>
.performance-statistics {
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

.chart-container-large {
  height: 250px;
}

.trend-card {
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

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
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
