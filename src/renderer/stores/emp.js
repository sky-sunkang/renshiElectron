import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 员工状态管理
 * 管理员工列表数据
 */
export const useEmpStore = defineStore('emp', () => {
  /** 员工列表 */
  const list = ref([])
  /** 加载状态 */
  const loading = ref(false)

  /**
   * 加载所有员工数据
   */
  async function loadAll() {
    loading.value = true
    list.value = await window.electronAPI.emp.getAll()
    loading.value = false
  }

  return { list, loading, loadAll }
})
