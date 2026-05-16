<template>
  <div class="tab-bar" v-if="tabs.length > 0" ref="tabBarRef">
    <div class="tab-list" ref="tabListRef">
      <div
        v-for="tab in visibleTabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: tab.path === activePath }"
        @click="handleClick(tab.path)"
        @contextmenu.prevent="showContextMenu($event, tab.path)"
      >
        <el-icon v-if="tab.icon" class="tab-icon">
          <component :is="tab.icon" />
        </el-icon>
        <span class="tab-title">{{ tab.title }}</span>
        <el-icon v-if="!tab.fixed" class="tab-close" @click.stop="handleClose(tab.path)">
          <Close />
        </el-icon>
      </div>
    </div>

    <div class="tab-actions" v-if="hiddenTabs.length > 0">
      <el-dropdown trigger="click" @command="handleHiddenCommand">
        <el-button text class="action-btn">
          <el-icon><ArrowDown /></el-icon>
          <span class="hidden-count">{{ hiddenTabs.length }}</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="tab in hiddenTabs"
              :key="tab.path"
              :command="tab.path"
            >
              <el-icon v-if="tab.icon" style="margin-right: 6px;">
                <component :is="tab.icon" />
              </el-icon>
              {{ tab.title }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="tab-actions">
      <el-dropdown trigger="click" @command="handleCommand">
        <el-button text class="action-btn">
          <el-icon><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="closeOthers">关闭其他</el-dropdown-item>
            <el-dropdown-item command="closeAll">关闭所有</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 右键菜单 -->
    <teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      >
        <div v-if="!contextMenuFixed" class="context-menu-item" @click="handleContextCommand('close')">关闭</div>
        <div class="context-menu-item" @click="handleContextCommand('closeOthers')">关闭其他</div>
        <div class="context-menu-item" @click="handleContextCommand('closeAll')">关闭所有</div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Close, ArrowDown } from '@element-plus/icons-vue'
import { useTabsStore } from '../stores/tabs.js'

const router = useRouter()
const tabsStore = useTabsStore()
const { list: tabs, activePath } = storeToRefs(tabsStore)

// 标签栏引用
const tabBarRef = ref(null)
const tabListRef = ref(null)

// 标签固定宽度
const TAB_WIDTH = 120

// 可见标签数量
const visibleCount = ref(tabs.value.length)

/**
 * 计算可见标签数量
 */
function calculateVisibleCount() {
  nextTick(() => {
    if (!tabBarRef.value) return

    // 标签栏总宽度 - 右侧操作按钮区域（约80px）
    const containerWidth = tabBarRef.value.offsetWidth - 80
    // 计算能放下的标签数量
    const count = Math.floor(containerWidth / TAB_WIDTH)
    visibleCount.value = Math.max(1, count)
  })
}

// 监听标签变化重新计算
watch(tabs, () => {
  calculateVisibleCount()
}, { deep: true })

// 可见标签列表
const visibleTabs = computed(() => {
  // 确保当前激活的标签始终可见
  const activeIndex = tabs.value.findIndex(t => t.path === activePath.value)
  const count = visibleCount.value

  // 如果激活标签在隐藏区域，调整显示范围
  if (activeIndex >= count) {
    return tabs.value.slice(activeIndex - count + 1, activeIndex + 1)
  }
  return tabs.value.slice(0, count)
})

// 隐藏的标签列表
const hiddenTabs = computed(() => {
  const visiblePaths = visibleTabs.value.map(t => t.path)
  return tabs.value.filter(t => !visiblePaths.includes(t.path))
})

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuPath = ref('')
const contextMenuFixed = ref(false)

/**
 * 点击标签切换页面
 */
function handleClick(path) {
  if (path !== activePath.value) {
    tabsStore.setActive(path)
    router.push(path)
  }
}

/**
 * 关闭标签
 */
function handleClose(path) {
  const redirectPath = tabsStore.removeTab(path)
  if (redirectPath) {
    router.push(redirectPath)
  }
}

/**
 * 下拉菜单命令处理
 */
function handleCommand(command) {
  if (command === 'closeOthers') {
    tabsStore.closeOthers(activePath.value)
  } else if (command === 'closeAll') {
    const redirectPath = tabsStore.closeAll()
    router.push(redirectPath)
  }
}

/**
 * 隐藏标签下拉命令处理
 */
function handleHiddenCommand(path) {
  tabsStore.setActive(path)
  router.push(path)
}

/**
 * 显示右键菜单
 */
function showContextMenu(event, path) {
  const tab = tabs.value.find(t => t.path === path)
  contextMenuVisible.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuPath.value = path
  contextMenuFixed.value = tab?.fixed || false
}

/**
 * 隐藏右键菜单
 */
function hideContextMenu() {
  contextMenuVisible.value = false
}

/**
 * 右键菜单命令处理
 */
function handleContextCommand(command) {
  hideContextMenu()
  if (command === 'close') {
    handleClose(contextMenuPath.value)
  } else if (command === 'closeOthers') {
    tabsStore.closeOthers(contextMenuPath.value)
    if (contextMenuPath.value !== activePath.value) {
      router.push(contextMenuPath.value)
    }
  } else if (command === 'closeAll') {
    const redirectPath = tabsStore.closeAll()
    router.push(redirectPath)
  }
}

// 点击其他地方关闭右键菜单
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
  calculateVisibleCount()
  // 监听窗口大小变化
  window.addEventListener('resize', calculateVisibleCount)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  window.removeEventListener('resize', calculateVisibleCount)
})
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);
  border-bottom: 1px solid #e1e4e8;
  height: 40px;
  flex-shrink: 0;
  padding: 0 8px;
}

.tab-list {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 28px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.tab-item:hover {
  background: #fff;
  color: #1f2937;
  border-color: #9ca3af;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-item.active {
  background: #fff;
  color: #2563eb;
  border-color: #2563eb;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.tab-icon {
  font-size: 14px;
  opacity: 0.8;
}

.tab-item.active .tab-icon {
  opacity: 1;
}

.tab-title {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  font-size: 12px;
  color: #9ca3af;
  border-radius: 50%;
  padding: 2px;
  margin-left: 2px;
  transition: all 0.15s ease;
}

.tab-close:hover {
  background: #fee2e2;
  color: #ef4444;
}

.tab-item.active .tab-close {
  color: #93c5fd;
}

.tab-item.active .tab-close:hover {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.tab-actions {
  display: flex;
  align-items: center;
  padding: 0 4px;
  flex-shrink: 0;
}

.hidden-count {
  margin-left: 4px;
  font-size: 12px;
  background: #ef4444;
  color: #fff;
  border-radius: 10px;
  padding: 0 6px;
  min-width: 18px;
  text-align: center;
}

.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  color: #6b7280;
}

.action-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  padding: 6px 0;
  min-width: 120px;
}

.context-menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.context-menu-item:hover {
  background: #eff6ff;
  color: #2563eb;
}
</style>
