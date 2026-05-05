<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来，{{ currentUser?.name || '用户' }}</h2>
        <p>{{ currentDate }}</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" v-if="hasPermission('attendance:check')" @click="handleCheckIn">签到</el-button>
        <el-button type="success" v-if="hasPermission('attendance:check')" @click="handleCheckOut">签退</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" v-if="hasPermission('menu:employee')">
        <div class="stat-icon" style="background: #3b82f6;">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.employeeCount }}</div>
          <div class="stat-label">员工总数</div>
        </div>
      </div>
      <div class="stat-card" v-if="hasPermission('menu:department')">
        <div class="stat-icon" style="background: #10b981;">
          <el-icon :size="24"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.departmentCount }}</div>
          <div class="stat-label">部门数量</div>
        </div>
      </div>
      <div class="stat-card" v-if="hasPermission('menu:contract')">
        <div class="stat-icon" style="background: #f59e0b;">
          <el-icon :size="24"><Tickets /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.expiringContracts }}</div>
          <div class="stat-label">即将到期合同</div>
        </div>
      </div>
      <div class="stat-card" v-if="hasPermission('menu:recruitment')">
        <div class="stat-icon" style="background: #8b5cf6;">
          <el-icon :size="24"><Briefcase /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activePositions }}</div>
          <div class="stat-label">招聘中岗位</div>
        </div>
      </div>
    </div>

    <!-- 今日考勤状态 -->
    <el-card class="today-attendance" v-if="hasPermission('menu:attendance')">
      <template #header>
        <div class="card-header">
          <span>今日考勤</span>
          <el-tag :type="todayStatus.check_in ? 'success' : 'info'">
            {{ todayStatus.check_in ? '已签到' : '未签到' }}
          </el-tag>
        </div>
      </template>
      <div class="attendance-content">
        <div class="attendance-info">
          <div class="attendance-item">
            <span class="label">签到时间：</span>
            <span class="value">{{ todayStatus.check_in ? formatTime(todayStatus.check_in) : '未签到' }}</span>
          </div>
          <div class="attendance-item">
            <span class="label">签退时间：</span>
            <span class="value">{{ todayStatus.check_out ? formatTime(todayStatus.check_out) : '未签退' }}</span>
          </div>
        </div>
        <el-divider direction="vertical" />
        <div class="attendance-stats">
          <div class="stats-title">本月考勤统计</div>
          <div class="stats-items">
            <div class="stats-item">
              <span class="stats-value">{{ attendanceStats.check_in }}</span>
              <span class="stats-label">签到天数</span>
            </div>
            <div class="stats-item">
              <span class="stats-value">{{ attendanceStats.check_out }}</span>
              <span class="stats-label">签退天数</span>
            </div>
            <div class="stats-item">
              <span class="stats-value">{{ attendanceStats.workDays }}</span>
              <span class="stats-label">应出勤</span>
            </div>
            <div class="stats-item">
              <span class="stats-value">{{ attendanceStats.attendanceRate }}%</span>
              <span class="stats-label">出勤率</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 本月打卡日历 -->
    <el-card class="month-calendar" v-if="hasPermission('menu:attendance')">
      <template #header>
        <div class="card-header">
          <span>本月打卡记录</span>
          <el-button link type="primary" @click="goToAttendance">查看全部</el-button>
        </div>
      </template>
      <div class="calendar-grid">
        <div class="calendar-header">
          <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div class="calendar-body">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'empty': !day.date,
              'today': day.isToday,
              'weekend': day.isWeekend && !day.isHoliday && !day.isAdjustment,
              'holiday': day.isHoliday,
              'adjustment': day.isAdjustment,
              'checked': day.hasCheckIn,
              'absent': day.shouldWork && !day.hasCheckIn && !day.isFuture
            }"
          >
            <span v-if="day.date" class="day-num">{{ day.date }}</span>
            <span v-if="day.dayName" class="day-name">{{ day.dayName }}</span>
            <div v-if="day.date && day.hasCheckIn" class="check-mark">
              <el-icon v-if="day.hasCheckOut" color="#10b981"><Select /></el-icon>
              <el-icon v-else color="#f59e0b"><SemiSelect /></el-icon>
            </div>
            <el-tooltip v-if="day.date" :content="getDayTooltip(day)" placement="top">
              <span class="tooltip-trigger"></span>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="calendar-legend">
        <span class="legend-item"><span class="dot checked"></span>已打卡</span>
        <span class="legend-item"><span class="dot partial"></span>仅签到</span>
        <span class="legend-item"><span class="dot absent"></span>缺勤</span>
        <span class="legend-item"><span class="dot holiday"></span>节假日</span>
        <span class="legend-item"><span class="dot adjustment"></span>调休</span>
      </div>
    </el-card>

    <!-- 公告列表 -->
    <el-card class="announcement-section">
      <template #header>
        <div class="card-header">
          <span>系统公告</span>
          <el-button link type="primary" v-if="hasPermission('menu:announcement')" @click="goToAnnouncement">管理公告</el-button>
        </div>
      </template>
      <div class="announcement-list" v-if="announcements.length > 0">
        <div
          v-for="item in announcements"
          :key="item.id"
          class="announcement-item"
          @click="showAnnouncement(item)"
        >
          <div class="announcement-title">
            <el-tag :type="getAnnouncementType(item.type)" size="small">{{ getTypeLabel(item.type) }}</el-tag>
            <span class="title-text">{{ item.title }}</span>
          </div>
          <div class="announcement-time">{{ formatTime(item.publish_time) }}</div>
        </div>
      </div>
      <el-empty v-else description="暂无公告" :image-size="60" />
    </el-card>

    <!-- 公告详情对话框 -->
    <el-dialog v-model="dialogVisible" :title="currentAnnouncement?.title" width="600" destroy-on-close>
      <div class="announcement-detail">
        <div class="detail-meta">
          <el-tag :type="getAnnouncementType(currentAnnouncement?.type)" size="small">
            {{ getTypeLabel(currentAnnouncement?.type) }}
          </el-tag>
          <span class="publish-time">发布时间：{{ formatTime(currentAnnouncement?.publish_time) }}</span>
        </div>
        <el-divider />
        <div class="detail-content" v-html="currentAnnouncement?.content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, OfficeBuilding, Tickets, Briefcase, Select, SemiSelect } from '@element-plus/icons-vue'
import { usePermissionStore } from '../stores/permission.js'
import { useAuthStore } from '../stores/auth.js'
import { storeToRefs } from 'pinia'

const router = useRouter()
const permStore = usePermissionStore()
const authStore = useAuthStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)
const { currentUser } = storeToRefs(authStore)

// 统计数据
const stats = ref({
  employeeCount: 0,
  departmentCount: 0,
  expiringContracts: 0,
  activePositions: 0
})

// 今日考勤状态
const todayStatus = ref({ check_in: null, check_out: null })

// 本月考勤统计
const attendanceStats = ref({ check_in: 0, check_out: 0, workDays: 0, attendanceRate: 0 })

// 本月打卡日历数据
const calendarDays = ref([])

// 公告列表
const announcements = ref([])
const dialogVisible = ref(false)
const currentAnnouncement = ref(null)

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`
})

/**
 * 检查是否有指定权限
 */
function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

/**
 * 格式化时间戳（仅时间）
 */
function formatTimeOnly(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 获取公告类型标签
 */
function getAnnouncementType(type) {
  const map = { normal: 'info', important: 'warning', emergency: 'danger' }
  return map[type] || 'info'
}

/**
 * 获取公告类型文本
 */
function getTypeLabel(type) {
  const map = { normal: '普通', important: '重要', emergency: '紧急' }
  return map[type] || '普通'
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    // 员工总数
    if (hasPermission('menu:employee')) {
      const empResult = await window.electronAPI.emp.getAll()
      stats.value.employeeCount = empResult.length
    }

    // 部门数量
    if (hasPermission('menu:department')) {
      const deptResult = await window.electronAPI.dept.getAll()
      stats.value.departmentCount = deptResult.length
    }

    // 即将到期合同（30天内）
    if (hasPermission('menu:contract')) {
      const contractResult = await window.electronAPI.contract.getAll({ page: 1, pageSize: 1000 })
      const now = Math.floor(Date.now() / 1000)
      const thirtyDays = 30 * 24 * 60 * 60
      stats.value.expiringContracts = contractResult.list.filter(c => {
        if (!c.end_date || c.status !== 'active') return false
        const daysLeft = c.end_date - now
        return daysLeft > 0 && daysLeft <= thirtyDays
      }).length
    }

    // 招聘中岗位
    if (hasPermission('menu:recruitment')) {
      const positionResult = await window.electronAPI.position.getAll({ page: 1, pageSize: 1000 })
      stats.value.activePositions = positionResult.list.filter(p => p.status === 'open').length
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

/**
 * 加载今日考勤状态
 */
async function loadTodayAttendance() {
  if (currentUser.value?.id) {
    try {
      const result = await window.electronAPI.attendance.getToday(currentUser.value.id)
      todayStatus.value = result
    } catch (e) {
      console.error('获取今日考勤状态失败', e)
    }
  }
}

/**
 * 加载本月考勤统计
 */
async function loadAttendanceStats() {
  if (currentUser.value?.id) {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const monthStart = new Date(year, month - 1, 1).getTime() / 1000
      const monthEnd = new Date(year, month, 1).getTime() / 1000

      // 获取工作日数量和日历数据
      let workDays = 0
      let calendarData = {}
      try {
        const calendarList = await window.electronAPI.calendar.getMonth(year, month)
        calendarList.forEach(item => {
          calendarData[item.date_str] = { type: item.type, name: item.name }
        })
        workDays = await window.electronAPI.calendar.getWorkDays(year, month)
      } catch (e) {
        // 如果工作日历没有数据，按默认计算
        const daysInMonth = new Date(year, month, 0).getDate()
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month - 1, d)
          const dayOfWeek = date.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) workDays++
        }
      }

      // 获取考勤记录
      const result = await window.electronAPI.attendance.getAll({ page: 1, pageSize: 1000 })
      const myRecords = result.list.filter(r =>
        r.employee_id === currentUser.value.id &&
        r.check_time >= monthStart &&
        r.check_time < monthEnd
      )

      // 按日期分组统计
      const dayMap = {}
      myRecords.forEach(r => {
        const date = new Date(r.check_time * 1000)
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
        if (!dayMap[key]) dayMap[key] = { check_in: false, check_out: false, checkInTime: null, checkOutTime: null }
        if (r.type === 'check_in') {
          dayMap[key].check_in = true
          // 保留最早的签到时间
          if (!dayMap[key].checkInTime || r.check_time < dayMap[key].checkInTime) {
            dayMap[key].checkInTime = r.check_time
          }
        }
        if (r.type === 'check_out') {
          dayMap[key].check_out = true
          // 保留最晚的签退时间
          if (!dayMap[key].checkOutTime || r.check_time > dayMap[key].checkOutTime) {
            dayMap[key].checkOutTime = r.check_time
          }
        }
      })

      let checkInDays = 0, checkOutDays = 0
      Object.keys(dayMap).forEach(key => {
        if (dayMap[key].check_in) checkInDays++
        if (dayMap[key].check_out) checkOutDays++
      })

      // 计算出勤率
      const attendanceRate = workDays > 0 ? Math.round((checkInDays / workDays) * 100) : 0

      attendanceStats.value = {
        check_in: checkInDays,
        check_out: checkOutDays,
        workDays,
        attendanceRate
      }

      // 生成日历数据
      generateCalendarDays(year, month, dayMap, calendarData)
    } catch (e) {
      console.error('获取考勤统计失败', e)
    }
  }
}

/**
 * 生成日历数据
 */
function generateCalendarDays(year, month, dayMap, calendarData) {
  const now = new Date()
  const today = now.getDate()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const days = []

  // 填充月初空白
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ date: null })
  }

  // 填充日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, d).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const calendarItem = calendarData[dateStr]
    const dayType = calendarItem?.type
    const dayName = calendarItem?.name

    // 判断是否是工作日（根据日历或默认周末判断）
    const shouldWork = dayType ? (dayType === 'workday' || dayType === 'adjustment') : !isWeekend

    const dayInfo = {
      date: d,
      dateStr,
      isToday: d === today && month === currentMonth && year === currentYear,
      isWeekend,
      isHoliday: dayType === 'holiday',
      isAdjustment: dayType === 'adjustment',
      dayName: dayName,
      isFuture: d > today && month >= currentMonth && year >= currentYear,
      shouldWork,
      hasCheckIn: dayMap[dateStr]?.check_in || false,
      hasCheckOut: dayMap[dateStr]?.check_out || false,
      checkInTime: dayMap[dateStr]?.checkInTime || null,
      checkOutTime: dayMap[dateStr]?.checkOutTime || null
    }
    days.push(dayInfo)
  }

  calendarDays.value = days
}

/**
 * 加载公告列表
 */
async function loadAnnouncements() {
  try {
    announcements.value = await window.electronAPI.announcement.getActive(5)
  } catch (e) {
    console.error('加载公告失败', e)
  }
}

/**
 * 签到
 */
async function handleCheckIn() {
  try {
    const user = { id: currentUser.value.id, name: currentUser.value.name }
    await window.electronAPI.attendance.add({
      employee_id: user.id,
      type: 'check_in',
      check_time: Math.floor(Date.now() / 1000)
    }, user)
    ElMessage.success('签到成功')
    loadTodayAttendance()
    loadAttendanceStats()
  } catch (e) {
    ElMessage.error('签到失败：' + e.message)
  }
}

/**
 * 签退
 */
async function handleCheckOut() {
  try {
    const user = { id: currentUser.value.id, name: currentUser.value.name }
    await window.electronAPI.attendance.add({
      employee_id: user.id,
      type: 'check_out',
      check_time: Math.floor(Date.now() / 1000)
    }, user)
    ElMessage.success('签退成功')
    loadTodayAttendance()
    loadAttendanceStats()
  } catch (e) {
    ElMessage.error('签退失败：' + e.message)
  }
}

/**
 * 显示公告详情
 */
function showAnnouncement(item) {
  currentAnnouncement.value = item
  dialogVisible.value = true
}

/**
 * 跳转到公告管理
 */
function goToAnnouncement() {
  router.push('/announcement')
}

/**
 * 跳转到考勤管理
 */
function goToAttendance() {
  router.push('/attendance')
}

/**
 * 获取日期提示信息
 */
function getDayTooltip(day) {
  const parts = []
  if (day.dayName) parts.push(day.dayName)
  if (day.isHoliday) parts.push('节假日')
  if (day.isAdjustment) parts.push('调休日')
  if (day.checkInTime) parts.push(`签到: ${formatTimeOnly(day.checkInTime)}`)
  if (day.checkOutTime) parts.push(`签退: ${formatTimeOnly(day.checkOutTime)}`)
  return parts.join('\n') || '未打卡'
}

onMounted(() => {
  loadStats()
  loadTodayAttendance()
  loadAttendanceStats()
  loadAnnouncements()
})
</script>

<style scoped>
.dashboard {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  padding: 12px 20px;
  border-radius: 6px;
}

.welcome-text h2 {
  margin: 0 0 2px 0;
  font-size: 16px;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 1px;
}

.today-attendance {
  background: #fff;
}

.today-attendance :deep(.el-card__header) {
  padding: 10px 14px;
}

.today-attendance :deep(.el-card__body) {
  padding: 10px 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 13px;
  font-weight: 500;
}

.attendance-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attendance-content .el-divider--vertical {
  height: 32px;
}

.attendance-info {
  display: flex;
  gap: 20px;
}

.attendance-item .label {
  color: #64748b;
  font-size: 12px;
}

.attendance-item .value {
  font-weight: 500;
  color: #1e293b;
  font-size: 12px;
}

.attendance-stats {
  flex: 1;
}

.stats-title {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
}

.stats-items {
  display: flex;
  gap: 20px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-value {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
}

.stats-label {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 1px;
}

.announcement-section {
  background: #fff;
}

.announcement-section :deep(.el-card__header) {
  padding: 10px 14px;
}

.announcement-section :deep(.el-card__body) {
  padding: 6px 14px;
}

.announcement-list {
  display: flex;
  flex-direction: column;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-item:hover {
  background: #f8fafc;
  margin: 0 -14px;
  padding: 6px 14px;
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  color: #334155;
  font-size: 12px;
}

.announcement-time {
  font-size: 11px;
  color: #94a3b8;
}

.announcement-detail .detail-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

/* 对话框标题居中 */
:deep(.el-dialog__header) {
  text-align: center;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

.publish-time {
  font-size: 13px;
  color: #64748b;
}

.detail-content {
  line-height: 1.8;
  color: #334155;
}

.detail-content :deep(img) {
  max-width: 100%;
}

.detail-content :deep(p) {
  margin: 0 0 12px 0;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

.month-calendar {
  background: #fff;
}

.month-calendar :deep(.el-card__header) {
  padding: 10px 14px;
}

.month-calendar :deep(.el-card__body) {
  padding: 6px 14px;
}

.calendar-grid {
  padding: 4px 0;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  color: #64748b;
  padding-bottom: 4px;
  border-bottom: 1px solid #e2e8f0;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding-top: 4px;
}

.calendar-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 4px;
  cursor: default;
}

.calendar-day.empty {
  background: transparent;
}

.calendar-day.weekend {
  background: #f1f5f9;
}

.calendar-day.weekend .day-num {
  color: #94a3b8;
}

.calendar-day.holiday {
  background: #fef3c7;
}

.calendar-day.holiday .day-num {
  color: #f59e0b;
}

.calendar-day.adjustment {
  background: #dbeafe;
}

.calendar-day.adjustment .day-num {
  color: #3b82f6;
}

.calendar-day.today {
  background: #dbeafe;
  border: 1px solid #3b82f6;
}

.calendar-day.today .day-num {
  color: #3b82f6;
  font-weight: 600;
}

.calendar-day.checked {
  background: #dcfce7;
}

.calendar-day.checked .day-num {
  color: #10b981;
}

.calendar-day.absent {
  background: #fee2e2;
}

.calendar-day.absent .day-num {
  color: #ef4444;
}

.day-num {
  font-size: 12px;
  color: #334155;
}

.day-name {
  font-size: 9px;
  color: #64748b;
  max-width: 32px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-mark {
  margin-top: 0;
  line-height: 1;
}

.check-mark .el-icon {
  font-size: 10px;
}

.tooltip-trigger {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
  margin-top: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.legend-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-item .dot.checked {
  background: #dcfce7;
  border: 1px solid #10b981;
}

.legend-item .dot.partial {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.legend-item .dot.absent {
  background: #fee2e2;
  border: 1px solid #ef4444;
}

.legend-item .dot.holiday {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.legend-item .dot.adjustment {
  background: #dbeafe;
  border: 1px solid #3b82f6;
}
</style>
