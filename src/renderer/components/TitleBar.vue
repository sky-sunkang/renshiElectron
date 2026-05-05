<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="app-title">人事管理系统</span>
    </div>
    <div class="window-controls">
      <el-button text class="win-btn dev-btn" @click="openDevTools">
        <el-icon><Monitor /></el-icon>
      </el-button>
      <el-button text class="win-btn" @click="minimizeWindow">
        <el-icon><Minus /></el-icon>
      </el-button>
      <el-button text class="win-btn" @click="maximizeWindow">
        <el-icon><FullScreen v-if="!isMaximized" /><Crop v-else /></el-icon>
      </el-button>
      <el-button text class="win-btn close-btn" @click="closeWindow">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Minus, FullScreen, Crop, Close, Monitor } from '@element-plus/icons-vue'

const isMaximized = ref(false)

onMounted(async () => {
  // 组件挂载时获取窗口最大化状态
  isMaximized.value = await window.electronAPI.window.isMaximized()
})

/**
 * 打开开发者工具
 */
async function openDevTools() {
  await window.electronAPI.window.openDevTools()
}

/**
 * 最小化窗口
 */
async function minimizeWindow() {
  await window.electronAPI.window.minimize()
}

/**
 * 最大化/还原窗口，并更新状态
 */
async function maximizeWindow() {
  await window.electronAPI.window.maximize()
  isMaximized.value = await window.electronAPI.window.isMaximized()
}

/**
 * 关闭窗口
 */
async function closeWindow() {
  await window.electronAPI.window.close()
}
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: #0f172a;
  color: #fff;
  flex-shrink: 0;
}

.title-bar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 16px;
  -webkit-app-region: drag;
  height: 100%;
}

.app-title {
  font-size: 13px;
  user-select: none;
  color: #94a3b8;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.win-btn {
  color: #94a3b8;
  font-size: 14px;
  width: 40px;
  height: 36px;
  border-radius: 0;
  margin: 0;
  padding: 0;
}

.win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dev-btn {
  color: #64748b;
}

.dev-btn:hover {
  color: #22d3ee;
}

.close-btn:hover {
  background: #e81123;
}
</style>
