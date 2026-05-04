<template>
  <el-dialog
    v-model="visible"
    title="选择人员"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="selector-container">
      <!-- 左侧部门树 -->
      <div class="dept-panel">
        <div class="panel-title">部门架构</div>
        <el-scrollbar class="dept-scroll">
          <el-tree
            ref="treeRef"
            :data="deptTreeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          />
        </el-scrollbar>
      </div>

      <!-- 中间部门人员 -->
      <div class="emp-panel">
        <div class="panel-title">
          <el-checkbox
            v-model="includeChildren"
            label="包含子部门"
            size="small"
          />
          <el-checkbox
            :model-value="isAllSelected"
            :indeterminate="isPartialSelected"
            @change="toggleSelectAll"
            label="全选"
            size="small"
          />
        </div>
        <div class="search-bar">
          <el-input
            v-model="searchName"
            placeholder="搜索姓名/账号"
            size="small"
            clearable
            style="flex: 1"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" size="small" @click="handleSearch">搜索</el-button>
        </div>
        <el-scrollbar class="emp-scroll">
          <div class="emp-list">
            <div
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="emp-item"
              :class="{ selected: isInSelectedList(emp) }"
            >
              <el-checkbox :model-value="isInSelectedList(emp)" @change="toggleSelect(emp)" />
              <span class="emp-name" @click="toggleSelect(emp)">{{ emp.name }}（{{ emp.account }}）</span>
              <el-tooltip placement="right" :show-after="300">
                <template #content>
                  <div class="emp-tooltip">
                    <div><strong>姓名：</strong>{{ emp.name }}</div>
                    <div><strong>账号：</strong>{{ emp.account }}</div>
                    <div><strong>职位：</strong>{{ emp.position || '-' }}</div>
                    <div><strong>部门：</strong>{{ emp.department_name || '-' }}</div>
                    <div><strong>性别：</strong>{{ emp.gender === 'male' ? '男' : emp.gender === 'female' ? '女' : '-' }}</div>
                    <div><strong>年龄：</strong>{{ emp.age || '-' }}</div>
                    <div><strong>电话：</strong>{{ emp.phone || '-' }}</div>
                    <div><strong>邮箱：</strong>{{ emp.email || '-' }}</div>
                  </div>
                </template>
                <el-icon class="emp-info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div v-if="filteredEmployees.length === 0" class="emp-empty">暂无人员</div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧已选人员 -->
      <div class="selected-panel">
        <div class="panel-title">已选人员 ({{ selectedList.length }})</div>
        <el-scrollbar class="selected-scroll">
          <div class="selected-list">
            <div
              v-for="(emp, index) in selectedList"
              :key="emp.id"
              class="selected-item"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <span class="drag-handle">
                <el-icon><Rank /></el-icon>
              </span>
              <span class="emp-name">{{ emp.name }}</span>
              <span class="emp-account">{{ emp.account }}</span>
              <el-button link type="danger" size="small" @click="removeSelected(emp)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div v-if="selectedList.length === 0" class="selected-empty">暂无已选人员</div>
          </div>
        </el-scrollbar>
        <div class="panel-footer">
          <el-button type="danger" size="small" plain @click="clearSelected">清空</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { InfoFilled, Rank, Delete } from '@element-plus/icons-vue'
import { useDeptStore } from '../stores/dept.js'
import { useEmpStore } from '../stores/emp.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  excludeIds: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const deptStore = useDeptStore()
const empStore = useEmpStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const treeRef = ref()
const deptTreeData = computed(() => deptStore.treeData)
const currentDept = ref(null)
const searchName = ref('')
const selectedList = ref([])
const includeChildren = ref(false)

// 拖拽排序相关
const dragIndex = ref(null)

/**
 * 递归获取部门及其所有子部门的ID列表
 * @param {Object|null} dept - 部门节点对象
 * @returns {number[]} 部门ID数组
 */
function getDeptAndChildrenIds(dept) {
  if (!dept) return []
  const ids = [dept.id]
  /**
   * 递归收集子部门ID
   * @param {Object} node - 部门节点
   */
  function collectChildren(node) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        ids.push(child.id)
        collectChildren(child)
      })
    }
  }
  collectChildren(dept)
  return ids
}

/**
 * 根据部门筛选和搜索关键字过滤员工列表
 * @returns {Object[]} 过滤后的员工列表
 */
const filteredEmployees = computed(() => {
  let list = empStore.list.filter(emp => {
    // 排除指定ID
    if (props.excludeIds.includes(emp.id)) return false
    // 部门过滤
    if (currentDept.value) {
      if (includeChildren.value) {
        // 包含子部门
        const deptIds = getDeptAndChildrenIds(currentDept.value)
        return deptIds.includes(emp.department_id)
      } else {
        // 仅当前部门
        return emp.department_id === currentDept.value.id
      }
    }
    return true
  })
  // 姓名和账号搜索
  if (searchName.value) {
    const keyword = searchName.value.toLowerCase()
    list = list.filter(emp => {
      const nameMatch = emp.name && emp.name.toLowerCase().includes(keyword)
      const accountMatch = emp.account && emp.account.toLowerCase().includes(keyword)
      return nameMatch || accountMatch
    })
  }
  return list
})

/**
 * 判断指定员工是否已在已选列表中
 * @param {Object} emp - 员工对象
 * @returns {boolean} 是否已选中
 */
function isInSelectedList(emp) {
  return selectedList.value.some(s => s.id === emp.id)
}

/**
 * 计算当前过滤列表是否全部选中
 * @returns {boolean} 是否全选
 */
const isAllSelected = computed(() => {
  if (filteredEmployees.value.length === 0) return false
  return filteredEmployees.value.every(emp => isInSelectedList(emp))
})

/**
 * 计算当前过滤列表是否部分选中（有选中但未全选）
 * @returns {boolean} 是否部分选中
 */
const isPartialSelected = computed(() => {
  if (filteredEmployees.value.length === 0) return false
  const selectedCount = filteredEmployees.value.filter(emp => isInSelectedList(emp)).length
  return selectedCount > 0 && selectedCount < filteredEmployees.value.length
})

/**
 * 全选/取消全选当前过滤列表
 * @param {boolean} checked - 是否选中
 */
function toggleSelectAll(checked) {
  if (checked) {
    // 全选：添加所有未选中的人员
    filteredEmployees.value.forEach(emp => {
      if (!isInSelectedList(emp)) {
        selectedList.value.push(emp)
      }
    })
  } else {
    // 取消全选：移除所有当前过滤列表中已选中的人员
    const filteredIds = filteredEmployees.value.map(emp => emp.id)
    selectedList.value = selectedList.value.filter(emp => !filteredIds.includes(emp.id))
  }
}

/**
 * 切换员工选中状态（直接添加/移除）
 * @param {Object} emp - 员工对象
 */
function toggleSelect(emp) {
  console.log('[EmployeeSelector] toggleSelect:', emp.name, emp.id)
  const index = selectedList.value.findIndex(s => s.id === emp.id)
  if (index > -1) {
    // 已选中则移除
    selectedList.value.splice(index, 1)
    console.log('[EmployeeSelector] removed, selectedList:', selectedList.value.length)
  } else {
    // 未选中则添加
    selectedList.value.push(emp)
    console.log('[EmployeeSelector] added, selectedList:', selectedList.value.length)
  }
}

/**
 * 搜索按钮点击处理
 * 注：搜索逻辑已通过 computed 自动处理，此处仅用于触发交互反馈
 */
function handleSearch() {
  // 搜索逻辑已通过 computed 自动处理，此处仅用于触发交互反馈
}

/**
 * 处理拖拽开始事件
 * @param {DragEvent} event - 拖拽事件对象
 * @param {number} index - 被拖拽项在列表中的索引
 */
function handleDragStart(event, index) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

/**
 * 处理拖拽放置事件
 * @param {DragEvent} event - 拖拽事件对象
 * @param {number} dropIndex - 放置位置的索引
 */
function handleDrop(event, dropIndex) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === dropIndex) return

  // 交换位置
  const item = selectedList.value[dragIndex.value]
  selectedList.value.splice(dragIndex.value, 1)
  selectedList.value.splice(dropIndex, 0, item)

  dragIndex.value = null
}

/**
 * 处理部门树节点点击
 * @param {Object} data - 被点击的部门节点数据
 */
function handleNodeClick(data) {
  currentDept.value = data
}

/**
 * 从已选列表中移除指定员工
 * @param {Object} row - 要移除的员工对象
 */
function removeSelected(row) {
  const index = selectedList.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    selectedList.value.splice(index, 1)
  }
}

/**
 * 清空已选人员列表
 */
function clearSelected() {
  selectedList.value = []
}

/**
 * 关闭弹窗并重置状态
 */
function handleClose() {
  visible.value = false
  selectedList.value = []
  currentDept.value = null
  searchName.value = ''
}

/**
 * 确认选择，将已选人员列表通过事件返回给父组件
 */
function handleConfirm() {
  emit('confirm', selectedList.value)
  handleClose()
}

/**
 * 组件挂载时加载部门和员工数据，并默认选中第一个部门
 */
onMounted(async () => {
  await deptStore.loadAll()
  await empStore.loadAll()
  // 默认选中第一个部门
  if (deptTreeData.value.length > 0) {
    currentDept.value = deptTreeData.value[0]
    nextTick(() => {
      treeRef.value?.setCurrentKey(deptTreeData.value[0].id)
    })
  }
})

/**
 * 监听弹窗显示状态，打开时初始化已选列表并加载数据
 */
watch(visible, async (val) => {
  if (val) {
    // 根据 selectedIds 初始化已选列表
    if (props.selectedIds.length > 0) {
      selectedList.value = empStore.list.filter(emp => props.selectedIds.includes(emp.id))
    } else {
      selectedList.value = []
    }
    // 确保数据已加载
    if (empStore.list.length === 0) {
      await empStore.loadAll()
      // 加载后重新初始化已选列表
      if (props.selectedIds.length > 0) {
        selectedList.value = empStore.list.filter(emp => props.selectedIds.includes(emp.id))
      }
    }
    if (deptTreeData.value.length === 0) {
      await deptStore.loadAll()
    }
    currentDept.value = deptTreeData.value[0] || null
    console.log('[EmployeeSelector] opened, empStore.list:', empStore.list.length, 'currentDept:', currentDept.value?.name)
    nextTick(() => {
      treeRef.value?.setCurrentKey(currentDept.value?.id)
    })
  }
})
</script>

<style scoped>
.selector-container {
  display: flex;
  gap: 16px;
  height: 450px;
}
.dept-panel,
.emp-panel,
.selected-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}
.dept-panel {
  width: 200px;
}
.emp-panel {
  flex: 1;
  min-width: 0;
}
.selected-panel {
  width: 260px;
}
.panel-title {
  padding: 10px 12px;
  font-weight: 500;
  color: #1e293b;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.dept-scroll,
.emp-scroll,
.selected-scroll {
  flex: 1;
  min-height: 0;
}
.emp-list {
  padding: 6px;
}
.emp-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
  margin-bottom: 2px;
}
.emp-item:hover {
  background-color: #f5f7fa;
}
.emp-item.selected {
  background-color: #ecf5ff;
  border-color: #409eff;
}
.emp-item.selected .emp-name {
  color: #409eff;
  font-weight: 500;
}
.emp-name {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
}
.emp-info-icon {
  color: #909399;
  cursor: help;
  font-size: 14px;
}
.emp-info-icon:hover {
  color: #409eff;
}
.emp-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
.emp-tooltip {
  line-height: 1.8;
  font-size: 13px;
}
.emp-tooltip div {
  white-space: nowrap;
}
.selected-list {
  padding: 6px;
}
.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin-bottom: 6px;
  cursor: move;
  transition: all 0.2s;
}
.selected-item:hover {
  background-color: #ecf5ff;
}
.selected-item:last-child {
  margin-bottom: 0;
}
.drag-handle {
  color: #909399;
  cursor: move;
  display: flex;
  align-items: center;
}
.drag-handle:hover {
  color: #409eff;
}
.selected-item .emp-name {
  flex: 1;
  font-weight: 500;
}
.selected-item .emp-account {
  color: #909399;
  font-size: 12px;
}
.selected-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
</style>
