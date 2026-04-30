import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDeptStore = defineStore('dept', () => {
  const list = ref([])
  const loading = ref(false)

  const treeData = computed(() => buildTree(list.value))

  function buildTree(items) {
    const map = {}
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })
    const tree = []
    items.forEach(item => {
      const pid = item.parent_id || 0
      if (pid !== 0 && map[pid]) {
        map[pid].children.push(map[item.id])
      } else {
        tree.push(map[item.id])
      }
    })
    return tree
  }

  async function loadAll() {
    loading.value = true
    list.value = await window.electronAPI.dept.getAll()
    loading.value = false
  }

  return { list, loading, treeData, loadAll }
})
