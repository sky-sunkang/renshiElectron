<template>
  <div class="attendance-statistics">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalEmployees }}</div>
          <div class="stat-label">在职员工数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #10b981;">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayCheckIn }}</div>
          <div class="stat-label">今日签到人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">
          <el-icon :size="24"><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayCheckOut }}</div>
          <div class="stat-label">今日签退人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ef4444;">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayAbsent }}</div>
          <div class="stat-label">今日未签到</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-form :inline="true" class="filter-form">
      <el-form-item label="统计月份">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="x"
          @change="loadData"
        />
      </el-form-item>
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
          <span>签到趋势（本月）</span>
        </template>
        <div ref="trendChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>部门考勤对比</span>
        </template>
        <div ref="deptChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 考勤明细表 -->
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>考勤明细</span>
          <el-button @click="handleExport">导出</el-button>
        </div>
      </template>
      <el-table :data="detailList" v-loading="loading" stripe border max-height="400">
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="department_name" label="所属部门" width="150" />
        <el-table-column prop="check_in_days" label="签到天数" width="100" />
        <el-table-column prop="check_out_days" label="签退天数" width="100" />
        <el-table-column prop="absent_days" label="缺勤天数" width="100" />
        <el-table-column prop="work_days" label="应出勤天数" width="100" />
        <el-table-column label="出勤率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.attendance_rate" :stroke-width="10" :text-inside="true" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Clock, Timer, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import { useEmpStore } from '../stores/emp.js'
import { useDeptStore } from '../stores/dept.js'
import { storeToRefs } from 'pinia'

const empStore = useEmpStore()
const deptStore = useDeptStore()
const { list: employees } = storeToRefs(empStore)
const { list: departments } = storeToRefs(deptStore)

const loading = ref(false)
const selectedMonth = ref(new Date().getTime())
const selectedDept = ref(null)

// 统计数据
const stats = ref({
  totalEmployees: 0,
  todayCheckIn: 0,
  todayCheckOut: 0,
  todayAbsent: 0
})

// 明细列表
const detailList = ref([])

// 图表
const trendChartRef = ref(null)
const deptChartRef = ref(null)
let trendChart = null
let deptChart = null

/**
 * 获取月份的工作日天数（从工作日历获取）
 */
async function getWorkDays(year, month) {
  try {
    return await window.electronAPI.calendar.getWorkDays(year, month)
  } catch (e) {
    // 如果获取失败，使用默认计算（排除周末）
    const daysInMonth = new Date(year, month, 0).getDate()
    let workDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++
      }
    }
    return workDays
  }
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true
  try {
    // 获取所有员工
    let empList = employees.value.filter(e => !e.is_deleted)
    if (selectedDept.value) {
      empList = empList.filter(e => e.department_id === selectedDept.value)
    }

    // 计算今日统计
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000
    const todayEnd = todayStart + 86400

    const allAttendance = await window.electronAPI.attendance.getAll({ page: 1, pageSize: 10000 })
    const todayRecords = allAttendance.list.filter(r => r.check_time >= todayStart && r.check_time < todayEnd)

    const todayCheckInIds = new Set(todayRecords.filter(r => r.type === 'check_in').map(r => r.employee_id))
    const todayCheckOutIds = new Set(todayRecords.filter(r => r.type === 'check_out').map(r => r.employee_id))

    stats.value.totalEmployees = empList.length
    stats.value.todayCheckIn = todayCheckInIds.size
    stats.value.todayCheckOut = todayCheckOutIds.size
    stats.value.todayAbsent = empList.length - todayCheckInIds.size

    // 计算选中月份的明细
    const monthDate = new Date(selectedMonth.value)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth() + 1
    const monthStart = new Date(year, month - 1, 1).getTime() / 1000
    const monthEnd = new Date(year, month, 1).getTime() / 1000
    const workDays = await getWorkDays(year, month)

    const monthRecords = allAttendance.list.filter(r => r.check_time >= monthStart && r.check_time < monthEnd)

    // 按员工统计
    const employeeStats = {}
    empList.forEach(emp => {
      employeeStats[emp.id] = {
        employee_id: emp.id,
        employee_name: emp.name,
        department_name: emp.department_name || '',
        check_in_days: new Set(),
        check_out_days: new Set()
      }
    })

    monthRecords.forEach(r => {
      if (employeeStats[r.employee_id]) {
        const date = new Date(r.check_time * 1000)
        const dateKey = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate()
        if (r.type === 'check_in') {
          employeeStats[r.employee_id].check_in_days.add(dateKey)
        } else if (r.type === 'check_out') {
          employeeStats[r.employee_id].check_out_days.add(dateKey)
        }
      }
    })

    detailList.value = Object.values(employeeStats).map(stat => ({
      ...stat,
      check_in_days: stat.check_in_days.size,
      check_out_days: stat.check_out_days.size,
      work_days: workDays,
      absent_days: Math.max(0, workDays - stat.check_in_days.size),
      attendance_rate: workDays > 0 ? Math.round((stat.check_in_days.size / workDays) * 100) : 0
    }))

    // 更新图表
    updateCharts(year, month, monthRecords, empList)
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
function updateCharts(year, month, records, empList) {
  // 签到趋势图
  const daysInMonth = new Date(year, month, 0).getDate()
  const trendData = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStart = new Date(year, month - 1, d).getTime() / 1000
    const dayEnd = dayStart + 86400
    const dayRecords = records.filter(r => r.check_time >= dayStart && r.check_time < dayEnd)
    const checkInCount = new Set(dayRecords.filter(r => r.type === 'check_in').map(r => r.employee_id)).size
    trendData.push(checkInCount)
  }

  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Array.from({ length: daysInMonth }, (_, i) => i + 1 + '日')
      },
      yAxis: { type: 'value', name: '签到人数' },
      series: [{
        name: '签到人数',
        type: 'line',
        data: trendData,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#3b82f6' }
      }]
    })
  }

  // 部门考勤对比图
  const deptStats = {}
  empList.forEach(emp => {
    const deptName = emp.department_name || '未分配'
    if (!deptStats[deptName]) {
      deptStats[deptName] = { total: 0, checkIn: new Set() }
    }
    deptStats[deptName].total++
  })

  records.forEach(r => {
    if (r.type === 'check_in') {
      const emp = empList.find(e => e.id === r.employee_id)
      if (emp) {
        const deptName = emp.department_name || '未分配'
        if (deptStats[deptName]) {
          const date = new Date(r.check_time * 1000)
          const dateKey = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate()
          deptStats[deptName].checkIn.add(dateKey + '_' + r.employee_id)
        }
      }
    }
  })

  const deptNames = Object.keys(deptStats)
  const deptCheckInData = deptNames.map(name => deptStats[name].checkIn.size)

  if (deptChart) {
    deptChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: deptNames, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '签到人次' },
      series: [{
        name: '签到人次',
        type: 'bar',
        data: deptCheckInData,
        itemStyle: { color: '#10b981' }
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
    '签到天数': item.check_in_days,
    '签退天数': item.check_out_days,
    '缺勤天数': item.absent_days,
    '应出勤天数': item.work_days,
    '出勤率': item.attendance_rate + '%'
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '考勤统计')
  const monthDate = new Date(selectedMonth.value)
  const fileName = `考勤统计_${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月.xlsx`
  XLSX.writeFile(wb, fileName)

  ElMessage.success('导出成功')
}

/**
 * 初始化图表
 */
function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (deptChartRef.value) {
    deptChart = echarts.init(deptChartRef.value)
  }
}

onMounted(async () => {
  await empStore.loadAll()
  await deptStore.loadAll()
  initCharts()
  loadData()
})

onUnmounted(() => {
  if (trendChart) trendChart.dispose()
  if (deptChart) deptChart.dispose()
})
</script>

<style scoped>
.attendance-statistics {
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
