import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEmpStore = defineStore('emp', () => {
  const list = ref([])
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    list.value = await window.electronAPI.emp.getAll()
    loading.value = false
  }

  return { list, loading, loadAll }
})
