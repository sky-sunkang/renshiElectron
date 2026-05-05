<template>
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
        <template v-for="item in menuItems" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
            <template #title>
              <el-icon><component :is="item.meta.icon" /></el-icon>
              <span>{{ item.meta.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              <el-icon><component :is="child.meta.icon" /></el-icon>
              <span>{{ child.meta.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.meta.icon" /></el-icon>
            <span>{{ item.meta.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { UserFilled, HomeFilled } from '@element-plus/icons-vue'
import { usePermissionStore } from '../stores/permission.js'
import routerConfig from '../router/index.js'

const route = useRoute()
const router = useRouter()
const permStore = usePermissionStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)

const activeMenu = computed(() => route.path)

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
 * 处理菜单选择，导航到对应路由
 * @param {string} index - 选中的菜单路径
 */
function handleMenuSelect(index) {
  router.push(index)
}
</script>

<style scoped>
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

.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background-color: #1e293b !important;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  background-color: #1e293b !important;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item:hover) {
  background-color: #334155 !important;
}
</style>
