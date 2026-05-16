import { ref } from 'vue'
import { defineStore } from 'pinia'

/** 固定标签路径（工作台） */
const FIXED_TAB_PATH = '/dashboard'

/**
 * 标签页状态管理
 * 管理历史访问的页面标签
 */
export const useTabsStore = defineStore('tabs', () => {
  /** 标签列表 */
  const list = ref([])
  /** 当前激活的路径 */
  const activePath = ref('')

  /**
   * 检查是否为固定标签
   * @param {string} path - 路径
   * @returns {boolean}
   */
  function isFixed(path) {
    return path === FIXED_TAB_PATH
  }

  /**
   * 添加标签
   * @param {Object} route - 路由对象
   */
  function addTab(route) {
    // 排除登录页和无标题的路由
    if (!route.meta?.title || route.meta?.noAuth) return

    // 检查是否已存在
    const exists = list.value.find(tab => tab.path === route.path)
    if (exists) {
      activePath.value = route.path
      return
    }

    // 如果是固定标签，插入到第一个位置
    if (route.path === FIXED_TAB_PATH) {
      // 移除已存在的固定标签（如果有）
      list.value = list.value.filter(tab => tab.path !== FIXED_TAB_PATH)
      list.value.unshift({
        path: route.path,
        title: route.meta.title,
        icon: route.meta.icon,
        fixed: true
      })
      activePath.value = route.path
      return
    }

    // 添加新标签到末尾
    list.value.push({
      path: route.path,
      title: route.meta.title,
      icon: route.meta.icon,
      fixed: false
    })
    activePath.value = route.path
  }

  /**
   * 关闭标签
   * @param {string} path - 要关闭的路径
   * @returns {string|null} 关闭后应该跳转的路径
   */
  function removeTab(path) {
    // 固定标签不能关闭
    if (isFixed(path)) return null

    const index = list.value.findIndex(tab => tab.path === path)
    if (index === -1) return null

    list.value.splice(index, 1)

    // 如果关闭的是当前激活的标签，需要跳转到其他标签
    if (activePath.value === path) {
      if (list.value.length === 0) {
        activePath.value = ''
        return '/dashboard'
      }
      // 跳转到相邻的标签
      const newIndex = Math.min(index, list.value.length - 1)
      activePath.value = list.value[newIndex].path
      return list.value[newIndex].path
    }
    return null
  }

  /**
   * 关闭所有标签（保留固定标签）
   * @returns {string} 关闭后应该跳转的路径
   */
  function closeAll() {
    // 保留固定标签
    list.value = list.value.filter(tab => tab.fixed)
    if (list.value.length > 0) {
      activePath.value = list.value[0].path
      return list.value[0].path
    }
    activePath.value = ''
    return '/dashboard'
  }

  /**
   * 关闭其他标签（保留固定标签和指定标签）
   * @param {string} path - 保留的路径
   */
  function closeOthers(path) {
    list.value = list.value.filter(tab => tab.path === path || tab.fixed)
    activePath.value = path
  }

  /**
   * 设置当前激活路径
   * @param {string} path - 路径
   */
  function setActive(path) {
    activePath.value = path
  }

  /**
   * 清空所有标签
   */
  function clear() {
    list.value = []
    activePath.value = ''
  }

  return {
    list,
    activePath,
    isFixed,
    addTab,
    removeTab,
    closeAll,
    closeOthers,
    setActive,
    clear
  }
})