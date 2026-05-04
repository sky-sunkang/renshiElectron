<template>
  <el-scrollbar class="stats-scrollbar">
    <div class="stats-page">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ stats.todayCount }}</div>
          <div class="stat-label">今日操作</div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ stats.weekCount }}</div>
          <div class="stat-label">本周操作</div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ stats.monthCount }}</div>
          <div class="stat-label">本月操作</div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ stats.totalCount }}</div>
          <div class="stat-label">操作总数</div>
        </el-card>
      </div>

      <!-- 图表区域 -->
      <div class="chart-row">
        <!-- 操作趋势图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>近7天操作趋势</span></template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
        <!-- 操作类型分布 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>操作类型分布</span></template>
          <div ref="actionChartRef" class="chart-container"></div>
        </el-card>
      </div>

      <!-- 模块统计和用户统计 -->
      <div class="chart-row">
        <!-- 模块操作统计 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>模块操作统计</span></template>
          <div ref="moduleChartRef" class="chart-container"></div>
        </el-card>
        <!-- 用户操作排行 -->
        <el-card class="chart-card" shadow="hover">
          <template #header><span>用户操作排行</span></template>
          <div ref="userChartRef" class="chart-container"></div>
        </el-card>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const stats = ref({
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  totalCount: 0,
  moduleStats: [],
  actionStats: [],
  userStats: [],
  dailyStats: []
})

// 图表 DOM 引用
const trendChartRef = ref(null)
const actionChartRef = ref(null)
const moduleChartRef = ref(null)
const userChartRef = ref(null)

// 图表实例
let trendChart = null
let actionChart = null
let moduleChart = null
let userChart = null

/**
 * 初始化操作趋势图
 */
function initTrendChart() {
  if (!trendChartRef.value) return

  if (trendChart) trendChart.dispose()

  trendChart = echarts.init(trendChartRef.value)

  const dates = stats.value.dailyStats.map(d => d.date)
  const counts = stats.value.dailyStats.map(d => d.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [{
      name: '操作次数',
      type: 'line',
      data: counts,
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

  trendChart.setOption(option)
}

/**
 * 初始化操作类型分布图
 */
function initActionChart() {
  if (!actionChartRef.value) return

  if (actionChart) actionChart.dispose()

  actionChart = echarts.init(actionChartRef.value)

  const pieData = stats.value.actionStats.map(d => ({
    name: d.action,
    value: d.count
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      type: 'scroll'
    },
    series: [{
      name: '操作类型',
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
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: pieData
    }]
  }

  actionChart.setOption(option)
}

/**
 * 初始化模块统计图
 */
function initModuleChart() {
  if (!moduleChartRef.value) return

  if (moduleChart) moduleChart.dispose()

  moduleChart = echarts.init(moduleChartRef.value)

  const modules = stats.value.moduleStats.map(d => d.module)
  const counts = stats.value.moduleStats.map(d => d.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      minInterval: 1
    },
    yAxis: {
      type: 'category',
      data: modules.reverse(),
      axisLabel: {
        width: 80,
        overflow: 'truncate'
      }
    },
    series: [{
      name: '操作次数',
      type: 'bar',
      data: counts.reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#60a5fa' }
        ])
      }
    }]
  }

  moduleChart.setOption(option)
}

/**
 * 初始化用户操作排行图
 */
function initUserChart() {
  if (!userChartRef.value) return

  if (userChart) userChart.dispose()

  userChart = echarts.init(userChartRef.value)

  const users = stats.value.userStats.map(d => d.user_name)
  const counts = stats.value.userStats.map(d => d.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      minInterval: 1
    },
    yAxis: {
      type: 'category',
      data: users.reverse(),
      axisLabel: {
        width: 60,
        overflow: 'truncate'
      }
    },
    series: [{
      name: '操作次数',
      type: 'bar',
      data: counts.reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#22c55e' },
          { offset: 1, color: '#4ade80' }
        ])
      }
    }]
  }

  userChart.setOption(option)
}

/**
 * 加载统计数据并初始化图表
 */
async function load() {
  stats.value = await window.electronAPI.stats.getLogStats()

  await nextTick()
  initTrendChart()
  initActionChart()
  initModuleChart()
  initUserChart()
}

/**
 * 窗口大小变化时重绘图表
 */
function handleResize() {
  trendChart?.resize()
  actionChart?.resize()
  moduleChart?.resize()
  userChart?.resize()
}

onMounted(() => {
  load()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  actionChart?.dispose()
  moduleChart?.dispose()
  userChart?.dispose()
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
</style>
