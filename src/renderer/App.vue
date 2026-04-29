<template>
  <div class="app">
    <div class="title-bar">
      <div class="title-bar-drag">
        <span class="app-title">Electron + Vue3 + SQLite</span>
      </div>
      <div class="window-controls">
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

    <div class="content">
      <el-page-header title="返回" content="Electron + Vue3 + SQLite" />

      <el-card class="form-card" shadow="hover">
        <template #header>
          <span>添加数据</span>
        </template>
        <el-form :model="form" inline>
          <el-form-item label="名称">
            <el-input v-model="form.name" placeholder="请输入名称" clearable />
          </el-form-item>
          <el-form-item label="值">
            <el-input v-model="form.value" placeholder="请输入值" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addItem">添加</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>数据列表</span>
          <el-tag type="info" style="margin-left: 8px">{{ items.length }} 条</el-tag>
        </template>
        <el-table :data="items" stripe border style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="value" label="值" />
          <el-table-column label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="danger" size="small" @click="removeItem(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Minus, FullScreen, Crop, Close } from '@element-plus/icons-vue'

const form = reactive({ name: '', value: '' })
const items = ref([])
const loading = ref(false)
const isMaximized = ref(false)

async function loadItems() {
  loading.value = true
  items.value = await window.electronAPI.db.getAllItems()
  loading.value = false
}

async function addItem() {
  if (!form.name.trim()) {
    ElMessage.warning('名称不能为空')
    return
  }
  await window.electronAPI.db.addItem(form.name, form.value)
  form.name = ''
  form.value = ''
  ElMessage.success('添加成功')
  await loadItems()
}

async function removeItem(id) {
  await window.electronAPI.db.deleteItem(id)
  ElMessage.success('删除成功')
  await loadItems()
}

function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString()
}

async function minimizeWindow() {
  await window.electronAPI.window.minimize()
}

async function maximizeWindow() {
  await window.electronAPI.window.maximize()
  isMaximized.value = await window.electronAPI.window.isMaximized()
}

async function closeWindow() {
  await window.electronAPI.window.close()
}

onMounted(async () => {
  await loadItems()
  isMaximized.value = await window.electronAPI.window.isMaximized()
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.title-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: #2c2c2c;
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
  font-size: 14px;
  user-select: none;
}
.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}
.win-btn {
  color: #fff;
  font-size: 16px;
  width: 48px;
  height: 40px;
  border-radius: 0;
  margin: 0;
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.close-btn:hover {
  background: #e81123;
}
.content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.form-card {
  margin: 1.5rem 0;
}
</style>
