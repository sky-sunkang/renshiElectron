<template>
  <!-- 有权限时显示内容 -->
  <slot v-if="hasAuth" />
  <!-- 无权限时显示备用内容 -->
  <slot v-else name="noAuth" />
</template>

<script setup>
import { computed } from 'vue'
import { usePermissionStore } from '../stores/permission.js'

const props = defineProps({
  // 需要的权限代码
  permission: {
    type: String,
    default: ''
  },
  // 多个权限（满足任意一个）
  permissions: {
    type: Array,
    default: () => []
  },
  // 需要的角色代码
  role: {
    type: String,
    default: ''
  },
  // 多个角色（满足任意一个）
  roles: {
    type: Array,
    default: () => []
  },
  // 是否检查所有权限（默认任意一个）
  all: {
    type: Boolean,
    default: false
  }
})

const permStore = usePermissionStore()

/**
 * 计算当前用户是否拥有所需权限
 * @returns {boolean} 是否有权限访问
 */
const hasAuth = computed(() => {
  // 超级管理员直接通过
  if (permStore.isSuperAdmin) return true

  // 检查单个权限
  if (props.permission) {
    return permStore.hasPermission(props.permission)
  }

  // 检查多个权限
  if (props.permissions && props.permissions.length > 0) {
    if (props.all) {
      return permStore.hasAllPermissions(props.permissions)
    }
    return permStore.hasAnyPermission(props.permissions)
  }

  // 检查单个角色
  if (props.role) {
    return permStore.hasRole(props.role)
  }

  // 检查多个角色
  if (props.roles && props.roles.length > 0) {
    return permStore.hasAnyRole(props.roles)
  }

  // 没有设置任何权限要求，默认显示
  return true
})
</script>
