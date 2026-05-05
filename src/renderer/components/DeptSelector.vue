<template>
  <el-dialog
    v-model="visible"
    title="选择部门"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="selector-container">
      <el-input
        v-model="searchName"
        placeholder="搜索部门名称"
        size="small"
        clearable
        style="margin-bottom: 12px"
      />
      <el-scrollbar class="dept-scroll">
        <el-tree
          ref="treeRef"
          :data="filteredDeptTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <div class="dept-node" :class="{ selected: selectedDept?.id === data.id }">
              <span class="dept-name">{{ data.name }}</span>
              <el-icon v-if="selectedDept?.id === data.id" class="check-icon"><Check /></el-icon>
            </div>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="!selectedDept">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { useDeptStore } from '../stores/dept.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const deptStore = useDeptStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const treeRef = ref()
const searchName = ref('')
const selectedDept = ref(null)

/**
 * 根据搜索关键字过滤部门树
 */
const filteredDeptTree = computed(() => {
  if (!searchName.value) {
    return deptStore.treeData
  }

  const keyword = searchName.value.toLowerCase()

  /**
   * 递归过滤部门树
   * @param {Array} nodes - 部门节点数组
   * @returns {Array} 过滤后的部门节点数组
   */
  function filterNodes(nodes) {
    return nodes.reduce((result, node) => {
      const nameMatch = node.name && node.name.toLowerCase().includes(keyword)
      const children = node.children ? filterNodes(node.children) : []

      if (nameMatch || children.length > 0) {
        result.push({
          ...node,
          children: children.length > 0 ? children : node.children
        })
      }
      return result
    }, [])
  }

  return filterNodes(deptStore.treeData)
})

/**
 * 处理部门树节点点击
 * @param {Object} data - 被点击的部门节点数据
 */
function handleNodeClick(data) {
  selectedDept.value = data
}

/**
 * 关闭弹窗并重置状态
 */
function handleClose() {
  visible.value = false
  selectedDept.value = null
  searchName.value = ''
}

/**
 * 确认选择
 */
function handleConfirm() {
  if (selectedDept.value) {
    emit('confirm', selectedDept.value)
    handleClose()
  }
}

/**
 * 根据ID在树中查找部门
 * @param {Array} nodes - 部门节点数组
 * @param {number} id - 部门ID
 * @returns {Object|null} 找到的部门节点或null
 */
function findDeptById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findDeptById(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 监听弹窗显示状态
 */
watch(visible, async (val) => {
  if (val) {
    // 确保数据已加载
    if (deptStore.treeData.length === 0) {
      await deptStore.loadAll()
    }
    // 根据 selectedId 初始化选中状态
    if (props.selectedId) {
      selectedDept.value = findDeptById(deptStore.treeData, props.selectedId)
      nextTick(() => {
        treeRef.value?.setCurrentKey(props.selectedId)
      })
    }
  }
})
</script>

<style scoped>
.selector-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}
.dept-scroll {
  flex: 1;
  min-height: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.dept-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}
.dept-node.selected .dept-name {
  color: #409eff;
  font-weight: 500;
}
.check-icon {
  color: #409eff;
}
</style>
