<template>
  <div class="work-calendar">
    <div class="header">
      <div class="year-selector">
        <el-button @click="prevYear"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="year-text">{{ currentYear }}年</span>
        <el-button @click="nextYear"><el-icon><ArrowRight /></el-icon></el-button>
      </div>
      <div class="month-tabs">
        <el-button
          v-for="m in 12"
          :key="m"
          :type="currentMonth === m ? 'primary' : 'default'"
          size="small"
          @click="currentMonth = m"
        >
          {{ m }}月
        </el-button>
      </div>
      <div class="actions">
        <el-button type="primary" @click="initCurrentYear">初始化年度日历</el-button>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="dot workday"></span> 工作日</span>
      <span class="legend-item"><span class="dot weekend"></span> 周末</span>
      <span class="legend-item"><span class="dot holiday"></span> 节假日</span>
      <span class="legend-item"><span class="dot adjustment"></span> 调休日</span>
    </div>

    <div class="calendar-grid">
      <div class="week-header">
        <div v-for="w in weekDays" :key="w" class="week-cell">{{ w }}</div>
      </div>
      <div class="calendar-body">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="['day-cell', day.type, { 'other-month': !day.currentMonth }]"
          @click="handleDayClick(day)"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-name" v-if="day.name">{{ day.name }}</div>
          <div class="day-type-tag">{{ getTypeLabel(day.type) }}</div>
        </div>
      </div>
    </div>

    <!-- 设置日期类型弹窗 -->
    <el-dialog v-model="dialogVisible" title="设置日期类型" width="400px">
      <el-form :model="dayForm" label-width="80px">
        <el-form-item label="日期">
          <span>{{ dayForm.dateStr }}</span>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="dayForm.type" placeholder="请选择类型">
            <el-option label="工作日" value="workday" />
            <el-option label="周末" value="weekend" />
            <el-option label="节假日" value="holiday" />
            <el-option label="调休日" value="adjustment" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="dayForm.name" placeholder="如：春节、国庆节" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDayType">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const calendarData = ref([])
const dialogVisible = ref(false)
const dayForm = ref({
  dateStr: '',
  type: 'workday',
  name: ''
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 获取类型显示文本
 */
function getTypeLabel(type) {
  const map = {
    workday: '工作日',
    weekend: '周末',
    holiday: '节假日',
    adjustment: '调休'
  }
  return map[type] || type
}

/**
 * 计算日历格子数据
 */
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  // 获取当月第一天是星期几
  const firstDay = new Date(year, month - 1, 1).getDay()
  // 获取当月天数
  const daysInMonth = new Date(year, month, 0).getDate()
  // 获取上月天数
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  const days = []

  // 填充上月日期
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = month - 1 === 0 ? 12 : month - 1
    const prevYear = month - 1 === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = calendarData.value.find(d => d.date_str === dateStr)

    days.push({
      day,
      dateStr,
      type: dayData?.type || 'workday',
      name: dayData?.name || '',
      currentMonth: false
    })
  }

  // 填充当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayData = calendarData.value.find(day => day.date_str === dateStr)

    // 如果没有数据，根据星期几判断
    const date = new Date(year, month - 1, d)
    const dayOfWeek = date.getDay()
    const defaultType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'workday'

    days.push({
      day: d,
      dateStr,
      type: dayData?.type || defaultType,
      name: dayData?.name || '',
      currentMonth: true
    })
  }

  // 填充下月日期（补齐6行）
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month + 1 === 13 ? 1 : month + 1
    const nextYear = month + 1 === 13 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayData = calendarData.value.find(day => day.date_str === dateStr)

    days.push({
      day: d,
      dateStr,
      type: dayData?.type || 'workday',
      name: dayData?.name || '',
      currentMonth: false
    })
  }

  return days
})

/**
 * 加载月份数据
 */
async function loadMonthData() {
  try {
    calendarData.value = await window.electronAPI.calendar.getMonth(currentYear.value, currentMonth.value)
  } catch (e) {
    console.error('加载日历数据失败', e)
  }
}

/**
 * 上一年
 */
function prevYear() {
  currentYear.value--
}

/**
 * 下一年
 */
function nextYear() {
  currentYear.value++
}

/**
 * 初始化当前年度日历
 */
async function initCurrentYear() {
  try {
    const user = authStore.currentUser
    const operator = user ? { id: user.id, name: user.name } : null
    await window.electronAPI.calendar.initYear(currentYear.value, operator)
    ElMessage.success('初始化成功')
    loadMonthData()
  } catch (e) {
    ElMessage.error('初始化失败：' + e.message)
  }
}

/**
 * 点击日期
 */
function handleDayClick(day) {
  if (!day.currentMonth) return
  dayForm.value = {
    dateStr: day.dateStr,
    type: day.type,
    name: day.name || ''
  }
  dialogVisible.value = true
}

/**
 * 保存日期类型
 */
async function saveDayType() {
  try {
    const user = authStore.currentUser
    const operator = user ? { id: user.id, name: user.name } : null
    await window.electronAPI.calendar.setDayType(
      dayForm.value.dateStr,
      dayForm.value.type,
      dayForm.value.name,
      operator
    )
    ElMessage.success('设置成功')
    dialogVisible.value = false
    loadMonthData()
  } catch (e) {
    ElMessage.error('设置失败：' + e.message)
  }
}

// 监听年月变化
watch([currentYear, currentMonth], () => {
  loadMonthData()
})

onMounted(() => {
  loadMonthData()
})
</script>

<style scoped>
.work-calendar {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.year-text {
  font-size: 18px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

.month-tabs {
  display: flex;
  gap: 4px;
}

.actions {
  margin-left: auto;
}

.legend {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.workday {
  background: #fff;
  border: 1px solid #d1d5db;
}

.dot.weekend {
  background: #f3f4f6;
}

.dot.holiday {
  background: #fee2e2;
}

.dot.adjustment {
  background: #dcfce7;
}

.calendar-grid {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
}

.week-cell {
  padding: 12px;
  text-align: center;
  font-weight: 500;
  color: #64748b;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-cell {
  min-height: 80px;
  padding: 8px;
  border-right: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.day-cell:nth-child(7n) {
  border-right: none;
}

.day-cell:hover {
  background: #f8fafc;
}

.day-cell.other-month {
  opacity: 0.4;
}

.day-cell.workday {
  background: #fff;
}

.day-cell.weekend {
  background: #f9fafb;
}

.day-cell.holiday {
  background: #fef2f2;
}

.day-cell.adjustment {
  background: #f0fdf4;
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}

.day-name {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

.day-type-tag {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.day-cell.holiday .day-type-tag {
  color: #ef4444;
}

.day-cell.adjustment .day-type-tag {
  color: #22c55e;
}
</style>
