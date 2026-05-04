import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 部门状态管理
 * 管理部门列表和部门树结构数据
 */
export const useDeptStore = defineStore('dept', () => {
  /** 部门列表 */
  const list = ref([])
  /** 加载状态 */
  const loading = ref(false)

  /** 部门树结构数据 */
  const treeData = computed(() => buildTree(list.value))

  /**
   * 将扁平列表转换为树结构
   * @param {Array} items - 部门列表
   * @returns {Array} 树结构数据
   */
  function buildTree(items) {
    const map = {}
    // 创建所有节点的映射
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })
    const tree = []
    // 构建树结构
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

  /**
   * 加载所有部门数据
   */
  async function loadAll() {
    loading.value = true
    list.value = await window.electronAPI.dept.getAll()
    loading.value = false
  }

  return { list, loading, treeData, loadAll }
})
