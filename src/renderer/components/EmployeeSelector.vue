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
          <span>{{ currentDept ? currentDept.name + ' - 人员' : '部门人员' }}</span>
          <el-input
            v-model="searchName"
            placeholder="搜索姓名"
            size="small"
            clearable
            style="width: 120px; margin-left: 8px"
          />
        </div>
        <el-scrollbar class="emp-scroll">
          <div class="emp-list">
            <div
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="emp-item"
              :class="{ selected: isSelected(emp) }"
              @click="toggleSelect(emp)"
            >
              <el-checkbox v-model="emp.checked" @click.stop />
              <span class="emp-name">{{ emp.name }}</span>
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
        <div class="panel-footer">
          <el-button type="primary" size="small" @click="addToSelected">
            添加选中 ({{ currentSelection.length }})
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
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
import { ArrowRight, InfoFilled, Rank, Delete } from '@element-plus/icons-vue'
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

// 当前选中的人员ID集合
const currentSelection = computed(() => {
  return empStore.list.filter(emp => emp.checked)
})

// 拖拽排序相关
const dragIndex = ref(null)

// 过滤后的员工列表（排除已选和排除项）
const filteredEmployees = computed(() => {
  let list = empStore.list.filter(emp => {
    // 排除已选人员
    if (selectedList.value.some(s => s.id === emp.id)) return false
    // 排除指定ID
    if (props.excludeIds.includes(emp.id)) return false
    // 部门过滤
    if (currentDept.value) {
      return emp.department_id === currentDept.value.id
    }
    return true
  })
  // 姓名搜索
  if (searchName.value) {
    list = list.filter(emp => emp.name && emp.name.includes(searchName.value))
  }
  return list
})

/**
 * 判断是否已选中
 */
function isSelected(emp) {
  return emp.checked === true
}

/**
 * 切换选中状态
 */
function toggleSelect(emp) {
  emp.checked = !emp.checked
}

/**
 * 处理拖拽开始
 */
function handleDragStart(event, index) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

/**
 * 处理拖拽放置
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
 * 处理部门点击
 */
function handleNodeClick(data) {
  currentDept.value = data
}

/**
 * 添加到已选
 */
function addToSelected() {
  const selected = currentSelection.value
  if (selected.length === 0) {
    return
  }
  selectedList.value.push(...selected)
  // 清空当前选择
  empStore.list.forEach(emp => {
    emp.checked = false
  })
}

/**
 * 从已选移除
 */
function removeSelected(row) {
  const index = selectedList.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    selectedList.value.splice(index, 1)
  }
}

/**
 * 清空已选
 */
function clearSelected() {
  selectedList.value = []
}

/**
 * 关闭弹窗
 */
function handleClose() {
  visible.value = false
  selectedList.value = []
  currentDept.value = null
  searchName.value = ''
}

/**
 * 确认选择
 */
function handleConfirm() {
  emit('confirm', selectedList.value)
  handleClose()
}

// 加载数据
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

// 监听visible变化，打开时重置
watch(visible, (val) => {
  if (val) {
    selectedList.value = []
    currentDept.value = deptTreeData.value[0] || null
    // 清空所有选中状态
    empStore.list.forEach(emp => {
      emp.checked = false
    })
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
  padding: 12px 16px;
  font-weight: 500;
  color: #1e293b;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.dept-scroll,
.emp-scroll,
.selected-scroll {
  flex: 1;
  min-height: 0;
}
.emp-list {
  padding: 8px;
}
.emp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}
.emp-item:hover {
  background-color: #f5f7fa;
}
.emp-item.selected {
  background-color: #ecf5ff;
  border-color: #409eff;
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
  padding: 8px;
}
.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin-bottom: 8px;
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
