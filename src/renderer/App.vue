<template>
  <el-config-provider :locale="zhCn">
    <div class="app">
      <TitleBar />

      <div v-if="!isLoggedIn" class="login-wrapper">
        <router-view />
      </div>

      <div v-else class="main-layout">
        <Sidebar />

        <div class="main-content">
          <TopBar
            :current-user="currentUser"
            :current-user-avatar="currentUserAvatar"
            @open-profile="profileDialogVisible = true"
            @open-password="pwdDialogVisible = true"
            @logout="handleLogout"
          />

          <div class="content-body">
            <el-empty v-if="menuItems.length === 0" description="您没有任何菜单权限，请联系管理员" />
            <router-view v-else />
          </div>
        </div>
      </div>

      <PasswordDialog
        v-model="pwdDialogVisible"
        :current-user="currentUser"
        @success="handleLogout"
      />

      <ProfileDialog
        v-model="profileDialogVisible"
        :current-user="currentUser"
        :current-user-avatar="currentUserAvatar"
        @save="currentUserAvatar = $event"
      />
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useAuthStore } from './stores/auth.js'
import { usePermissionStore } from './stores/permission.js'
import routerConfig from './router/index.js'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
import PasswordDialog from './components/PasswordDialog.vue'
import ProfileDialog from './components/ProfileDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const permStore = usePermissionStore()
const { isLoggedIn, currentUser } = storeToRefs(authStore)
const { isSuperAdmin, permissions } = storeToRefs(permStore)

const currentUserAvatar = ref('')
const pwdDialogVisible = ref(false)
const profileDialogVisible = ref(false)

/**
 * 加载当前用户的头像
 */
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

/**
 * 根据用户权限过滤后的菜单项
 */
const menuItems = computed(() => {
  const admin = isSuperAdmin.value
  const perms = permissions.value

  /**
   * 检查当前用户是否拥有指定权限
   * @param {string} permission - 权限代码
   * @returns {boolean} 是否拥有权限
   */
  function hasPermission(permission) {
    return admin || perms.includes(permission)
  }

  const result = []

  // 遍历路由配置，根据权限过滤菜单
  routerConfig.options.routes.forEach(r => {
    // 排除无标题或无需登录的路由
    if (!r.meta || !r.meta.title || r.meta.noAuth) return

    // 处理有子菜单的路由
    if (r.children && r.children.length > 0) {
      const filteredChildren = r.children.filter(child => {
        if (!child.meta || !child.meta.permission) return true
        return hasPermission(child.meta.permission)
      })
      if (filteredChildren.length > 0) {
        result.push({ ...r, children: filteredChildren })
      }
      return
    }

    // 处理无子菜单的路由，检查权限
    if (r.meta.permission) {
      if (hasPermission(r.meta.permission)) {
        result.push(r)
      }
      return
    }

    result.push(r)
  })

  return result
})

/**
 * 用户退出登录，清除登录状态并跳转到登录页
 */
function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // 组件挂载时检查登录状态
  authStore.checkLogin()
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.login-wrapper {
  flex: 1;
  overflow: hidden;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  overflow: hidden;
}

.content-body {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
}
</style>
