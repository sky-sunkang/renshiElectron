import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 字典配置 Store
 * 管理字典类型和字典项数据，统一管理页面中的下拉选项枚举值
 */
export const useDictStore = defineStore('dict', () => {
  /** 字典类型列表 */
  const types = ref([])
  /** 所有字典项列表 */
  const list = ref([])
  /** 当前选中类型下的字典项列表 */
  const items = ref([])
  const loading = ref(false)

  /** 性别字典项（用于员工管理） */
  const gender = computed(() => list.value.filter(i => i.type_code === 'gender'))

  /**
   * 获取指定类型的字典选项（用于 el-option）
   * @param {string} typeCode - 字典类型编码
   * @returns {Array} 选项列表 {label, value}
   */
  function getOptions(typeCode) {
    return list.value
      .filter(i => i.type_code === typeCode)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map(i => ({ label: i.label, value: i.value }))
  }

  /**
   * 加载所有字典类型
   */
  async function loadTypes() {
    types.value = await window.electronAPI.dict.getTypes()
  }

  /**
   * 加载指定类型的字典项
   * @param {string} typeCode - 字典类型编码
   */
  async function loadItems(typeCode) {
    items.value = await window.electronAPI.dict.getItems(typeCode)
  }

  /**
   * 加载所有字典类型和字典项
   */
  async function loadAll() {
    loading.value = true
    const allTypes = await window.electronAPI.dict.getTypes()
    types.value = allTypes
    const allItems = []
    for (const t of allTypes) {
      const typeItems = await window.electronAPI.dict.getItems(t.code)
      allItems.push(...typeItems)
    }
    list.value = allItems
    loading.value = false
  }

  return { types, list, items, loading, gender, getOptions, loadTypes, loadItems, loadAll }
})