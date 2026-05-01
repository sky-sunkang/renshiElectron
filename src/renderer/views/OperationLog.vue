<template>
  <div class="log-page">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <el-select v-model="filters.module" placeholder="操作模块" clearable style="width: 140px">
        <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
      </el-select>
      <el-select v-model="filters.action" placeholder="操作类型" clearable style="width: 120px">
        <el-option v-for="a in actions" :key="a" :label="a" :value="a" />
      </el-select>
      <el-input v-model="filters.userName" placeholder="操作人" clearable style="width: 120px" />
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 240px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 日志列表 -->
    <el-table :data="logList" stripe border size="small" style="width: 100%">
      <el-table-column prop="user_name" label="操作人" width="100" />
      <el-table-column prop="module" label="操作模块" width="100" />
      <el-table-column prop="action" label="操作类型" width="80">
        <template #default="scope">
          <el-tag :type="getActionTagType(scope.row.action)" size="small">
            {{ scope.row.action }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_name" label="操作对象" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.target_name">{{ scope.row.target_name }}</span>
          <span v-else style="color: #909399">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="detail" label="操作详情" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.detail">{{ formatDetail(scope.row.detail) }}</span>
          <span v-else style="color: #909399">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at_formatted" label="操作时间" width="170" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const logList = ref([])
const modules = ref([])
const actions = ref([])

const filters = reactive({
  module: '',
  action: '',
  userName: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

/**
 * 加载日志列表
 */
async function loadLogs() {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    module: filters.module || undefined,
    action: filters.action || undefined,
    userName: filters.userName || undefined,
    startDate: filters.dateRange?.[0] || undefined,
    endDate: filters.dateRange?.[1] || undefined
  }
  const result = await window.electronAPI.log.getList(params)
  logList.value = result.list
  pagination.total = result.total
}

/**
 * 加载模块和操作类型列表
 */
async function loadFilters() {
  modules.value = await window.electronAPI.log.getModules()
  actions.value = await window.electronAPI.log.getActions()
}

/**
 * 搜索
 */
function handleSearch() {
  pagination.page = 1
  loadLogs()
}

/**
 * 重置筛选
 */
function handleReset() {
  filters.module = ''
  filters.action = ''
  filters.userName = ''
  filters.dateRange = null
  pagination.page = 1
  loadLogs()
}

/**
 * 获取操作类型标签样式
 */
function getActionTagType(action) {
  const typeMap = {
    '新增': 'success',
    '编辑': 'warning',
    '删除': 'danger',
    '登录': 'primary',
    '退出': 'info',
    '导出': ''
  }
  return typeMap[action] || ''
}

/**
 * 格式化详情
 */
function formatDetail(detail) {
  if (!detail) return '-'
  try {
    const obj = JSON.parse(detail)
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  } catch {
    return detail
  }
}

onMounted(() => {
  loadLogs()
  loadFilters()
})
</script>

<style scoped>
.log-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}
.page-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}
.page-header h2 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}
.filter-bar {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}
.el-table {
  flex: 1;
}
.pagination-wrapper {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e4e7ed;
}
</style>
