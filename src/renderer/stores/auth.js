import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from './permission.js'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const currentUser = ref(null)

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

  function login(user) {
    currentUser.value = user
    isLoggedIn.value = true
    localStorage.setItem('currentUser', JSON.stringify(user))
    // 初始化权限
    const permStore = usePermissionStore()
    permStore.initFromUser(user)
  }

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
