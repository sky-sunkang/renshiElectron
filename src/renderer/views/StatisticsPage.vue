<template>
  <el-scrollbar class="stats-scrollbar">
    <div class="stats-page">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">员工总数</div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ deptCount }}</div>
          <div class="stat-label">部门数量</div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ avgSalaryText }}</div>
          <div class="stat-label">平均薪资</div>
        </el-card>
        <el-card class="stat-card gender-card" shadow="hover">
          <div class="gender-stats-inline">
            <div v-for="g in stats.genderStats" :key="g.gender" class="gender-item-inline">
              <span class="gender-label">{{ g.gender || '未知' }}</span>
              <span class="gender-value">{{ g.count }}</span>
            </div>
          </div>
          <div class="stat-label">性别比例</div>
        </el-card>
      </div>

      <!-- 图表区域 -->
      <div class="chart-row">
        <!-- 部门人数折线图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>部门人数趋势</span></template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
        <!-- 部门人数饼状图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>部门人数分布</span></template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </div>

      <!-- 部门薪资折线图 -->
      <el-card class="salary-card" shadow="hover">
        <template #header><span>部门薪资统计</span></template>
        <div ref="salaryChartRef" class="salary-chart-container"></div>
      </el-card>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import * as echarts from 'echarts'
import { useDeptStore } from '../stores/dept.js'

const deptStore = useDeptStore()
const { list: deptList } = storeToRefs(deptStore)

const stats = ref({ total: 0, deptStats: [], genderStats: [], avgSalary: 0, deptSalaryStats: [] })

// 图表 DOM 引用
const lineChartRef = ref(null)
const pieChartRef = ref(null)
const salaryChartRef = ref(null)

// 图表实例
let lineChart = null
let pieChart = null
let salaryChart = null

const deptCount = computed(() => deptList.value.length)

const avgSalaryText = computed(() => {
  return stats.value.avgSalary ? '¥' + stats.value.avgSalary.toFixed(0) : '¥0'
})

/**
 * 初始化部门人数折线图
 */
function initLineChart() {
  if (!lineChartRef.value) return

  // 销毁已有实例
  if (lineChart) lineChart.dispose()

  lineChart = echarts.init(lineChartRef.value)

  const deptNames = stats.value.deptStats.map(d => d.name)
  const deptCounts = stats.value.deptStats.map(d => d.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: deptNames,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [{
      name: '人数',
      type: 'line',
      data: deptCounts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: '#3b82f6'
      },
      itemStyle: {
        color: '#3b82f6'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
        ])
      }
    }]
  }

  lineChart.setOption(option)
}

/**
 * 初始化部门人数饼状图
 */
function initPieChart() {
  if (!pieChartRef.value) return

  // 销毁已有实例
  if (pieChart) pieChart.dispose()

  pieChart = echarts.init(pieChartRef.value)

  const pieData = stats.value.deptStats.map(d => ({
    name: d.name,
    value: d.count
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      type: 'scroll'
    },
    series: [{
      name: '部门人数',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: pieData
    }]
  }

  pieChart.setOption(option)
}

/**
 * 初始化部门薪资折线图（平均、最高、最低）
 */
function initSalaryChart() {
  if (!salaryChartRef.value) return

  // 销毁已有实例
  if (salaryChart) salaryChart.dispose()

  salaryChart = echarts.init(salaryChartRef.value)

  const deptNames = stats.value.deptSalaryStats.map(d => d.name)
  const avgSalaries = stats.value.deptSalaryStats.map(d => d.avgSalary)
  const maxSalaries = stats.value.deptSalaryStats.map(d => d.maxSalary)
  const minSalaries = stats.value.deptSalaryStats.map(d => d.minSalary)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(p => {
          result += p.marker + p.seriesName + ': ¥' + p.value + '<br/>'
        })
        return result
      }
    },
    legend: {
      data: ['平均薪资', '最高薪资', '最低薪资'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: deptNames,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '平均薪资',
        type: 'line',
        data: avgSalaries,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '最高薪资',
        type: 'line',
        data: maxSalaries,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' }
      },
      {
        name: '最低薪资',
        type: 'line',
        data: minSalaries,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#ef4444' },
        itemStyle: { color: '#ef4444' }
      }
    ]
  }

  salaryChart.setOption(option)
}

/**
 * 加载统计数据并初始化图表
 */
async function load() {
  await deptStore.loadAll()
  stats.value = await window.electronAPI.stats.get()

  // 等待 DOM 更新后初始化图表
  await nextTick()
  initLineChart()
  initPieChart()
  initSalaryChart()
}

/**
 * 窗口大小变化时重绘图表
 */
function handleResize() {
  lineChart?.resize()
  pieChart?.resize()
  salaryChart?.resize()
}

onMounted(() => {
  load()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
  salaryChart?.dispose()
})
</script>

<style scoped>
.stats-scrollbar {
  height: 100%;
}
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}
.stats-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.stat-card {
  flex: 1;
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #3b82f6;
}
.stat-label {
  margin-top: 4px;
  color: #64748b;
  font-size: 14px;
}
.gender-card {
  flex: 1.2;
}
.gender-stats-inline {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.gender-item-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.gender-label {
  font-size: 14px;
  color: #64748b;
}
.gender-value {
  font-size: 28px;
  font-weight: 600;
  color: #3b82f6;
}
.chart-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.chart-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.chart-container {
  width: 100%;
  height: 280px;
  flex-shrink: 0;
}
.salary-card {
  flex-shrink: 0;
}
.salary-chart-container {
  width: 100%;
  height: 300px;
}
</style>