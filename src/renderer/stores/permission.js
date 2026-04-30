import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 权限状态管理
 * 管理用户权限、角色信息，提供权限检查功能
 */
export const usePermissionStore = defineStore('permission', () => {
  // 用户权限列表
  const permissions = ref([])
  // 用户角色列表
  const roles = ref([])
  // 是否为超级管理员
  const isSuperAdmin = ref(false)

  /**
   * 从登录用户信息初始化权限
   * @param {Object} user - 登录用户对象
   */
  function initFromUser(user) {
    if (user) {
      permissions.value = user.permissions || []
      roles.value = user.roles || []
      isSuperAdmin.value = user.isSuperAdmin || false
    } else {
      permissions.value = []
      roles.value = []
      isSuperAdmin.value = false
    }
  }

  /**
   * 检查是否有指定权限
   * @param {string} permissionCode - 权限代码
   * @returns {boolean} 是否有权限
   */
  function hasPermission(permissionCode) {
    // 超级管理员拥有所有权限
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permissionCode)
  }

  /**
   * 检查是否有任意一个权限
   * @param {Array} permissionCodes - 权限代码数组
   * @returns {boolean} 是否有任意权限
   */
  function hasAnyPermission(permissionCodes) {
    if (isSuperAdmin.value) return true
    if (!permissionCodes || permissionCodes.length === 0) return true
    return permissionCodes.some(code => permissions.value.includes(code))
  }

  /**
   * 检查是否有所有权限
   * @param {Array} permissionCodes - 权限代码数组
   * @returns {boolean} 是否有所有权限
   */
  function hasAllPermissions(permissionCodes) {
    if (isSuperAdmin.value) return true
    if (!permissionCodes || permissionCodes.length === 0) return true
    return permissionCodes.every(code => permissions.value.includes(code))
  }

  /**
   * 检查是否有指定角色
   * @param {string} roleCode - 角色代码
   * @returns {boolean} 是否有角色
   */
  function hasRole(roleCode) {
    if (isSuperAdmin.value && roleCode === 'sysadmin') return true
    return roles.value.some(role => role.code === roleCode)
  }

  /**
   * 检查是否有任意一个角色
   * @param {Array} roleCodes - 角色代码数组
   * @returns {boolean} 是否有任意角色
   */
  function hasAnyRole(roleCodes) {
    if (isSuperAdmin.value) return true
    if (!roleCodes || roleCodes.length === 0) return true
    const userRoleCodes = roles.value.map(r => r.code)
    return roleCodes.some(code => userRoleCodes.includes(code))
  }

  // 菜单权限计算属性
  const hasEmployeeMenu = computed(() => isSuperAdmin.value || hasPermission('menu:employee'))
  const hasDepartmentMenu = computed(() => isSuperAdmin.value || hasPermission('menu:department'))
  const hasDictionaryMenu = computed(() => isSuperAdmin.value || hasPermission('menu:dictionary'))
  const hasStatisticsMenu = computed(() => isSuperAdmin.value || hasPermission('menu:statistics'))
  const hasRolePermissionMenu = computed(() => isSuperAdmin.value || hasPermission('menu:role'))
  const hasRoleUserMenu = computed(() => isSuperAdmin.value || hasPermission('menu:role'))

  /**
   * 清空权限数据
   */
  function clear() {
    permissions.value = []
    roles.value = []
    isSuperAdmin.value = false
  }

  return {
    // state
    permissions,
    roles,
    isSuperAdmin,
    // getters (computed)
    hasEmployeeMenu,
    hasDepartmentMenu,
    hasDictionaryMenu,
    hasStatisticsMenu,
    hasRolePermissionMenu,
    hasRoleUserMenu,
    // actions
    initFromUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    clear
  }
})
