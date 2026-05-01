<template>
  <el-config-provider :locale="zhCn">
  <div class="app">
    <!-- 自定义标题栏 -->
    <div class="title-bar">
      <div class="title-bar-drag">
        <span class="app-title">人事管理系统</span>
      </div>
      <div class="window-controls">
        <el-button text class="win-btn" @click="minimizeWindow">
          <el-icon><Minus /></el-icon>
        </el-button>
        <el-button text class="win-btn" @click="maximizeWindow">
          <el-icon><FullScreen v-if="!isMaximized" /><Crop v-else /></el-icon>
        </el-button>
        <el-button text class="win-btn close-btn" @click="closeWindow">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 未登录：显示登录页 -->
    <Login v-if="!isLoggedIn" @login="handleLogin" />

    <!-- 已登录：显示主布局 -->
    <div v-else class="main-layout">
      <!-- 左侧侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <el-icon :size="28" color="#3b82f6"><UserFilled /></el-icon>
          </div>
          <div class="sidebar-title">人事管理系统</div>
        </div>

        <el-scrollbar class="sidebar-scrollbar">
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            background-color="#1e293b"
            text-color="#cbd5e1"
            active-text-color="#3b82f6"
            @select="handleMenuSelect"
          >
            <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.meta.icon" /></el-icon>
              <span>{{ item.meta.title }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </div>

      <!-- 右侧内容区 -->
      <div class="main-content">
        <!-- 顶部栏 -->
        <div class="top-bar">
          <span class="page-title">{{ pageTitle }}</span>
          <div class="user-info">
            <el-avatar
              :size="32"
              :src="currentUserAvatar"
              class="user-avatar"
              @click="openProfileDialog"
            >
              {{ currentUser?.name ? currentUser.name.charAt(0) : '?' }}
            </el-avatar>
            <span class="user-name">{{ currentUser?.name || '管理员' }}</span>
            <el-divider direction="vertical" />
            <el-button link type="primary" size="small" @click="openPwdDialog">修改密码</el-button>
            <el-divider direction="vertical" />
            <el-button link type="primary" size="small" @click="handleLogout">退出</el-button>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="content-body">
          <!-- 无权限提示 -->
          <el-empty v-if="menuItems.length === 0" description="您没有任何菜单权限，请联系管理员" />
          <router-view v-else />
        </div>
      </div>
    </div>
  </div>

  <!-- 修改密码弹窗 -->
  <el-dialog v-model="pwdDialogVisible" title="修改密码" width="400px">
    <el-form :model="pwdForm" label-width="90px" :rules="pwdRules" ref="pwdFormRef">
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input v-model="pwdForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="pwdDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleChangePassword">确定</el-button>
    </template>
  </el-dialog>

  <!-- 个人资料弹窗 -->
  <el-dialog v-model="profileDialogVisible" title="个人资料" width="400px">
    <div class="profile-content">
      <div class="profile-avatar-section">
        <el-avatar
          :size="80"
          :src="profileAvatar"
          class="profile-avatar"
        >
          {{ currentUser?.name ? currentUser.name.charAt(0) : '?' }}
        </el-avatar>
        <el-upload
          class="profile-avatar-uploader"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleProfileAvatarChange"
          accept="image/*"
        >
          <el-button type="primary" size="small">更换头像</el-button>
        </el-upload>
      </div>
      <div class="profile-info">
        <div class="profile-item">
          <span class="profile-label">姓名：</span>
          <span class="profile-value">{{ currentUser?.name || '-' }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">账号：</span>
          <span class="profile-value">{{ currentUser?.account || '-' }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">职位：</span>
          <span class="profile-value">{{ currentUser?.position || '-' }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="profileDialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="saveProfileAvatar">保存</el-button>
    </template>
  </el-dialog>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { Minus, FullScreen, Crop, Close, UserFilled } from '@element-plus/icons-vue'
import Login from './views/Login.vue'
import { useAuthStore } from './stores/auth.js'
import { usePermissionStore } from './stores/permission.js'
import routerConfig from './router/index.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const permStore = usePermissionStore()
const { isLoggedIn, currentUser } = storeToRefs(authStore)
const { isSuperAdmin, permissions } = storeToRefs(permStore)

// 当前用户头像
const currentUserAvatar = ref('')

// 加载当前用户头像
async function loadCurrentUserAvatar() {
  if (currentUser.value?.id) {
    const avatar = await window.electronAPI.emp.getAvatar(currentUser.value.id)
    currentUserAvatar.value = avatar || ''
  }
}

// 监听用户信息变化，自动加载头像
watch(currentUser, () => {
  loadCurrentUserAvatar()
}, { immediate: true })

// 从路由配置中读取菜单项（根据权限过滤）
const menuItems = computed(() => {
  // 显式依赖 isSuperAdmin 和 permissions
  const admin = isSuperAdmin.value
  const perms = permissions.value
  console.log('[App] menuItems computed, isSuperAdmin:', admin, 'permissions:', perms)

  return routerConfig.options.routes.filter(r => {
    // 排除重定向路由
    if (!r.meta || !r.meta.title) return false
    // 检查权限 - 超级管理员直接显示所有菜单
    if (r.meta.permission) {
      return admin || perms.includes(r.meta.permission)
    }
    return true
  })
})

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => {
  const currentRoute = menuItems.value.find(r => r.path === route.path)
  return currentRoute?.meta?.title || ''
})

const isMaximized = ref(false)

function handleLogin(user) {
  authStore.login(user)
  // 跳转到有权限的第一个菜单页面
  const firstMenu = menuItems.value[0]
  if (firstMenu) {
    router.push(firstMenu.path)
  }
}

function handleLogout() {
  authStore.logout()
}

const pwdDialogVisible = ref(false)
const pwdFormRef = ref()
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 个人资料弹窗
const profileDialogVisible = ref(false)
const profileAvatar = ref('')

function openProfileDialog() {
  profileAvatar.value = currentUserAvatar.value
  profileDialogVisible.value = true
}

function handleProfileAvatarChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    profileAvatar.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function saveProfileAvatar() {
  if (profileAvatar.value && profileAvatar.value !== currentUserAvatar.value) {
    await window.electronAPI.emp.updateAvatar(currentUser.value.id, profileAvatar.value)
    currentUserAvatar.value = profileAvatar.value
    ElMessage.success('头像更新成功')
  }
  profileDialogVisible.value = false
}

function openPwdDialog() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdDialogVisible.value = true
}

async function handleChangePassword() {
  try {
    await pwdFormRef.value.validate()
  } catch (e) {
    return
  }
  // 验证旧密码
  const user = await window.electronAPI.auth.login(currentUser.value.account, pwdForm.oldPassword)
  if (!user) {
    ElMessage.error('旧密码错误')
    return
  }
  const operator = { id: currentUser.value.id, name: currentUser.value.name }
  await window.electronAPI.emp.updatePassword(currentUser.value.id, pwdForm.newPassword, operator)
  ElMessage.success('密码修改成功，请重新登录')
  pwdDialogVisible.value = false
  handleLogout()
}

async function minimizeWindow() {
  await window.electronAPI.window.minimize()
}

async function maximizeWindow() {
  await window.electronAPI.window.maximize()
  isMaximized.value = await window.electronAPI.window.isMaximized()
}

async function closeWindow() {
  await window.electronAPI.window.close()
}

function handleMenuSelect(index) {
  router.push(index)
}

onMounted(async () => {
  authStore.checkLogin()
  isMaximized.value = await window.electronAPI.window.isMaximized()
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 自定义标题栏 */
.title-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: #0f172a;
  color: #fff;
  flex-shrink: 0;
}
.title-bar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 16px;
  -webkit-app-region: drag;
  height: 100%;
}
.app-title {
  font-size: 13px;
  user-select: none;
  color: #94a3b8;
}
.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}
.win-btn {
  color: #94a3b8;
  font-size: 14px;
  width: 40px;
  height: 36px;
  border-radius: 0;
  margin: 0;
  padding: 0;
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.close-btn:hover {
  background: #e81123;
}

/* 主布局 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧侧边栏 */
.sidebar {
  width: 220px;
  background: #1e293b;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #334155;
}
.sidebar-title {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 500;
}
.sidebar-scrollbar {
  flex: 1;
}
.sidebar-menu {
  border-right: none;
}
.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #334155 !important;
}

/* 右侧内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  overflow: hidden;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
}
.user-name {
  font-weight: 500;
}

/* 用户头像 */
.user-avatar {
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}
.user-avatar:hover {
  border-color: #3b82f6;
}

/* 个人资料弹窗 */
.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.profile-avatar {
  border: 3px solid #e2e8f0;
}
.profile-info {
  width: 100%;
}
.profile-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.profile-label {
  color: #64748b;
  width: 60px;
  flex-shrink: 0;
}
.profile-value {
  color: #1e293b;
  font-weight: 500;
}

/* 内容区 */
.content-body {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
}
</style>
