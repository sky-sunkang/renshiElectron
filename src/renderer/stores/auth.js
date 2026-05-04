import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from './permission.js'

/**
 * 认证状态管理
 * 管理用户登录状态、当前用户信息
 */
export const useAuthStore = defineStore('auth', () => {
  /** 是否已登录 */
  const isLoggedIn = ref(false)
  /** 当前登录用户信息 */
  const currentUser = ref(null)

  /**
   * 检查登录状态，从 localStorage 恢复用户信息
   */
  function checkLogin() {
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      try {
        currentUser.value = JSON.parse(userStr)
        isLoggedIn.value = true
        // 初始化权限
        const permStore = usePermissionStore()
        permStore.initFromUser(currentUser.value)
      } catch (e) {
        localStorage.removeItem('currentUser')
      }
    }
  }

  /**
   * 用户登录，保存用户信息到状态和 localStorage
   * @param {Object} user - 登录用户对象
   */
  function login(user) {
    currentUser.value = user
    isLoggedIn.value = true
    localStorage.setItem('currentUser', JSON.stringify(user))
    // 初始化权限
    const permStore = usePermissionStore()
    permStore.initFromUser(user)
  }

  /**
   * 用户退出登录，清除状态和 localStorage
   */
  function logout() {
    localStorage.removeItem('currentUser')
    currentUser.value = null
    isLoggedIn.value = false
    // 清空权限
    const permStore = usePermissionStore()
    permStore.clear()
    ElMessage.success('已退出登录')
  }

  return { isLoggedIn, currentUser, checkLogin, login, logout }
})
