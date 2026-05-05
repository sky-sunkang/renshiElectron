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
          </div>
        </div>
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
import { User, OfficeBuilding, Tickets, Briefcase } from '@element-plus/icons-vue'
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
const attendanceStats = ref({ check_in: 0, check_out: 0 })

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
      // 获取所有考勤记录，前端计算统计
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const monthStart = new Date(year, month - 1, 1).getTime() / 1000
      const monthEnd = new Date(year, month, 1).getTime() / 1000

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
        if (!dayMap[key]) dayMap[key] = { check_in: false, check_out: false }
        if (r.type === 'check_in') dayMap[key].check_in = true
        if (r.type === 'check_out') dayMap[key].check_out = true
      })

      let checkInDays = 0, checkOutDays = 0
      Object.keys(dayMap).forEach(key => {
        if (dayMap[key].check_in) checkInDays++
        if (dayMap[key].check_out) checkOutDays++
      })

      attendanceStats.value = { check_in: checkInDays, check_out: checkOutDays }
    } catch (e) {
      console.error('获取考勤统计失败', e)
    }
  }
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

onMounted(() => {
  loadStats()
  loadTodayAttendance()
  loadAttendanceStats()
  loadAnnouncements()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  padding: 24px 32px;
  border-radius: 12px;
}

.welcome-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
}

.quick-actions {
  display: flex;
  gap: 12px;
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

.today-attendance {
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attendance-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.attendance-content .el-divider--vertical {
  height: 60px;
}

.attendance-info {
  display: flex;
  gap: 32px;
}

.attendance-item .label {
  color: #64748b;
}

.attendance-item .value {
  font-weight: 500;
  color: #1e293b;
}

.attendance-stats {
  flex: 1;
}

.stats-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
}

.stats-items {
  display: flex;
  gap: 32px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #3b82f6;
}

.stats-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.announcement-section {
  background: #fff;
}

.announcement-list {
  display: flex;
  flex-direction: column;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-item:hover {
  background: #f8fafc;
  margin: 0 -16px;
  padding: 12px 16px;
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  color: #334155;
}

.announcement-time {
  font-size: 12px;
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
</style>
