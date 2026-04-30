import { usePermissionStore } from '../stores/permission.js'

/**
 * 权限检查工具函数
 */

/**
 * 检查是否有指定权限
 * @param {string} permissionCode - 权限代码
 * @returns {boolean} 是否有权限
 */
export function hasPermission(permissionCode) {
  const permStore = usePermissionStore()
  return permStore.hasPermission(permissionCode)
}

/**
 * 检查是否有任意一个权限
 * @param {Array} permissionCodes - 权限代码数组
 * @returns {boolean} 是否有任意权限
 */
export function hasAnyPermission(permissionCodes) {
  const permStore = usePermissionStore()
  return permStore.hasAnyPermission(permissionCodes)
}

/**
 * 检查是否有所有权限
 * @param {Array} permissionCodes - 权限代码数组
 * @returns {boolean} 是否有所有权限
 */
export function hasAllPermissions(permissionCodes) {
  const permStore = usePermissionStore()
  return permStore.hasAllPermissions(permissionCodes)
}

/**
 * 检查是否有指定角色
 * @param {string} roleCode - 角色代码
 * @returns {boolean} 是否有角色
 */
export function hasRole(roleCode) {
  const permStore = usePermissionStore()
  return permStore.hasRole(roleCode)
}

/**
 * 检查是否有任意一个角色
 * @param {Array} roleCodes - 角色代码数组
 * @returns {boolean} 是否有任意角色
 */
export function hasAnyRole(roleCodes) {
  const permStore = usePermissionStore()
  return permStore.hasAnyRole(roleCodes)
}

/**
 * 检查是否为超级管理员
 * @returns {boolean} 是否为超级管理员
 */
export function isSuperAdmin() {
  const permStore = usePermissionStore()
  return permStore.isSuperAdmin
}
