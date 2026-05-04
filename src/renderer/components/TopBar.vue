<template>
  <div class="top-bar">
    <span class="page-title">{{ pageTitle }}</span>
    <div class="user-info">
      <el-avatar
        :size="32"
        :src="currentUserAvatar"
        class="user-avatar"
        @click="$emit('openProfile')"
      >
        {{ currentUser?.name ? currentUser.name.charAt(0) : '?' }}
      </el-avatar>
      <span class="user-name">{{ currentUser?.name || '管理员' }}</span>
      <el-divider direction="vertical" />
      <el-button link type="primary" size="small" @click="$emit('openPassword')">修改密码</el-button>
      <el-divider direction="vertical" />
      <el-button link type="primary" size="small" @click="$emit('logout')">退出</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePermissionStore } from '../stores/permission.js'
import routerConfig from '../router/index.js'

const route = useRoute()
const permStore = usePermissionStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)

defineProps({
  currentUser: Object,
  currentUserAvatar: String
})

defineEmits(['openProfile', 'openPassword', 'logout'])

/**
 * 当前页面的标题，根据路由匹配菜单获取
 */
const pageTitle = computed(() => {
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

  const menuItems = []

  // 遍历路由配置，根据权限过滤菜单
  routerConfig.options.routes.forEach(r => {
    if (!r.meta || !r.meta.title || r.meta.noAuth) return

    // 处理有子菜单的路由
    if (r.children && r.children.length > 0) {
      const filteredChildren = r.children.filter(child => {
        if (!child.meta || !child.meta.permission) return true
        return hasPermission(child.meta.permission)
      })
      if (filteredChildren.length > 0) {
        menuItems.push({ ...r, children: filteredChildren })
      }
      return
    }

    // 处理无子菜单的路由，检查权限
    if (r.meta.permission) {
      if (hasPermission(r.meta.permission)) {
        menuItems.push(r)
      }
      return
    }

    menuItems.push(r)
  })

  // 匹配当前路由获取页面标题
  const currentRoute = menuItems.find(r => r.path === route.path)
  return currentRoute?.meta?.title || ''
})
</script>

<style scoped>
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

.user-avatar {
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}

.user-avatar:hover {
  border-color: #3b82f6;
}
</style>
