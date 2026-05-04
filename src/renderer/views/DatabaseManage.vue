<template>
  <div class="db-manage-page">
    <!-- 左侧表列表 -->
    <div class="table-list-panel">
      <div class="panel-header">
        <h3>数据表</h3>
      </div>
      <el-scrollbar class="table-scroll">
        <el-menu
          :default-active="currentTable"
          @select="handleTableSelect"
        >
          <el-menu-item v-for="table in tables" :key="table" :index="table">
            <el-tooltip v-if="tableComments[table]" :content="tableComments[table]" placement="right" :show-after="300">
              <div class="table-info">
                <el-icon><Grid /></el-icon>
                <span class="table-name">{{ table }}</span>
              </div>
            </el-tooltip>
            <div v-else class="table-info">
              <el-icon><Grid /></el-icon>
              <span class="table-name">{{ table }}</span>
            </div>
            <span class="table-count">{{ tableCounts[table] || 0 }}</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 右侧数据区 -->
    <div class="data-panel">
      <template v-if="currentTable">
        <div class="panel-header">
          <h3>{{ currentTable }}</h3>
          <div class="header-actions">
            <el-button size="small" @click="loadData">刷新</el-button>
            <el-button size="small" type="primary" @click="openSqlDialog">执行SQL</el-button>
          </div>
        </div>
        <!-- 表说明 -->
        <div v-if="tableComments[currentTable]" class="table-desc">
          {{ tableComments[currentTable] }}
        </div>
        <el-scrollbar class="data-scroll">
          <el-table
            :data="tableData"
            stripe
            border
            size="small"
            max-height="calc(100vh - 240px)"
          >
            <el-table-column
              v-for="col in tableSchema"
              :key="col.name"
              :prop="col.name"
              :label="col.name"
              :min-width="getColumnWidth(col)"
              show-overflow-tooltip
            >
              <template #header>
                <el-tooltip v-if="getFieldComment(col.name)" :content="getFieldComment(col.name)" placement="top">
                  <div class="col-header">
                    <span class="col-name">{{ col.name }}</span>
                    <span class="col-type">{{ col.type }}</span>
                  </div>
                </el-tooltip>
                <div v-else class="col-header">
                  <span class="col-name">{{ col.name }}</span>
                  <span class="col-type">{{ col.type }}</span>
                </div>
              </template>
              <template #default="scope">
                <span :class="{ 'null-value': scope.row[col.name] === null }">
                  {{ formatValue(scope.row[col.name]) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button v-if="permStore.hasPermission('db:edit')" link type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
                <el-button v-if="permStore.hasPermission('db:delete')" link type="danger" size="small" @click="deleteRow(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
        <div class="pagination-bar">
          <span class="total-count">共 {{ total }} 条</span>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100, 200]"
            layout="prev, pager, next, sizes"
            :total="total"
            background
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </template>
      <el-empty v-else description="请选择数据表" />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑记录" width="600px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item
          v-for="col in tableSchema.filter(c => c.name !== 'id')"
          :key="col.name"
          :label="col.name"
        >
          <div class="edit-field">
            <el-input
              v-model="editForm[col.name]"
              :placeholder="getFieldPlaceholder(col)"
            />
            <span v-if="getFieldComment(col.name)" class="field-comment">
              {{ getFieldComment(col.name) }}
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- SQL执行弹窗 -->
    <el-dialog v-model="sqlDialogVisible" title="执行SQL" width="600px">
      <el-input
        v-model="sqlText"
        type="textarea"
        :rows="6"
        placeholder="输入SQL语句，如：SELECT * FROM employees LIMIT 10"
      />
      <div v-if="sqlResult" class="sql-result">
        <div class="result-header">
          <span>执行结果</span>
          <el-button size="small" text @click="sqlResult = null">清除</el-button>
        </div>
        <pre>{{ JSON.stringify(sqlResult, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="sqlDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeSql">执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid } from '@element-plus/icons-vue'
import { usePermissionStore } from '../stores/permission.js'

const permStore = usePermissionStore()

const tables = ref([])
const currentTable = ref('')
const tableSchema = ref([])
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const tableCounts = ref({})

const editDialogVisible = ref(false)
const editForm = ref({})
const editingId = ref(null)

const sqlDialogVisible = ref(false)
const sqlText = ref('')
const sqlResult = ref(null)

// 表和字段注释（从后端获取）
const tableComments = ref({})
const fieldComments = ref({})

/**
 * 加载所有表名
 */
async function loadTables() {
  tables.value = await window.electronAPI.db.getTables()
  // 加载每个表的记录数
  for (const table of tables.value) {
    const result = await window.electronAPI.db.getTableData(table, { page: 1, pageSize: 1 })
    tableCounts.value[table] = result.total
  }
}

/**
 * 选择表
 * @param {string} tableName - 表名
 */
async function handleTableSelect(tableName) {
  currentTable.value = tableName
  page.value = 1
  await loadSchema()
  await loadData()
}

/**
 * 加载表结构
 */
async function loadSchema() {
  tableSchema.value = await window.electronAPI.db.getTableSchema(currentTable.value)
}

/**
 * 加载表数据
 */
async function loadData() {
  const result = await window.electronAPI.db.getTableData(currentTable.value, {
    page: page.value,
    pageSize: pageSize.value
  })
  tableData.value = result.list
  total.value = result.total
}

/**
 * 格式化显示值
 * @param {*} value - 值
 * @returns {string} 格式化后的字符串
 */
function formatValue(value) {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * 获取列宽度
 * @param {Object} col - 列信息
 * @returns {number} 列宽度
 */
function getColumnWidth(col) {
  if (col.name === 'id') return 70
  if (col.type === 'INTEGER') return 100
  if (col.type === 'TEXT') return 150
  return 120
}

/**
 * 获取字段占位符提示
 * @param {Object} col - 列信息
 * @returns {string} 占位符文本
 */
function getFieldPlaceholder(col) {
  const comment = fieldComments.value[currentTable.value]?.[col.name]
  if (comment) return comment
  return col.type + (col.notnull ? ' (必填)' : '')
}

/**
 * 获取字段注释
 * @param {string} fieldName - 字段名
 * @returns {string|null} 字段注释
 */
function getFieldComment(fieldName) {
  return fieldComments.value[currentTable.value]?.[fieldName] || null
}

/**
 * 打开编辑弹窗
 * @param {Object} row - 行数据
 */
function openEditDialog(row) {
  editingId.value = row.id
  editForm.value = {}
  // 复制数据，将null转为空字符串方便编辑
  tableSchema.value.forEach(col => {
    if (col.name !== 'id') {
      editForm.value[col.name] = row[col.name] === null ? '' : String(row[col.name])
    }
  })
  editDialogVisible.value = true
}

/**
 * 保存编辑
 */
async function saveEdit() {
  const data = {}
  // 转换类型
  tableSchema.value.forEach(col => {
    if (col.name !== 'id') {
      let value = editForm.value[col.name]
      if (value === '' || value === null || value === undefined) {
        data[col.name] = null
      } else if (col.type === 'INTEGER') {
        data[col.name] = parseInt(value, 10)
      } else if (col.type === 'REAL') {
        data[col.name] = parseFloat(value)
      } else {
        data[col.name] = value
      }
    }
  })

  try {
    await window.electronAPI.db.updateTableData(currentTable.value, editingId.value, data)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    await loadData()
  } catch (e) {
    ElMessage.error('更新失败: ' + e.message)
  }
}

/**
 * 删除行
 * @param {Object} row - 行数据
 */
async function deleteRow(row) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？此操作不可恢复！', '警告', { type: 'warning' })
    await window.electronAPI.db.deleteTableData(currentTable.value, row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    if (e.message) {
      ElMessage.error('删除失败: ' + e.message)
    }
  }
}

/**
 * 打开SQL弹窗
 */
function openSqlDialog() {
  sqlText.value = ''
  sqlResult.value = null
  sqlDialogVisible.value = true
}

/**
 * 执行SQL
 */
async function executeSql() {
  if (!sqlText.value.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }
  try {
    const result = await window.electronAPI.db.executeSql(sqlText.value)
    sqlResult.value = result
    ElMessage.success('执行成功')
    // 如果是修改操作，刷新数据
    if (sqlText.value.trim().toUpperCase().startsWith('UPDATE') ||
        sqlText.value.trim().toUpperCase().startsWith('DELETE') ||
        sqlText.value.trim().toUpperCase().startsWith('INSERT')) {
      await loadData()
    }
  } catch (e) {
    ElMessage.error('执行失败: ' + e.message)
    sqlResult.value = { error: e.message }
  }
}

onMounted(async () => {
  // 加载表和字段注释
  const comments = await window.electronAPI.db.getComments()
  tableComments.value = comments.tableComments
  fieldComments.value = comments.fieldComments
  // 加载表列表
  await loadTables()
})
</script>

<style scoped>
.db-manage-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
.table-list-panel {
  width: 200px;
  min-width: 200px;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.data-panel {
  flex: 1;
  height: 100%;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  flex-shrink: 0;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.table-scroll {
  flex: 1;
  min-height: 0;
}
.table-count {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 0 6px;
  border-radius: 10px;
}
.table-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.table-name {
  font-size: 14px;
  color: #303133;
}
.table-desc {
  padding: 8px 16px;
  background: #f0f9ff;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  color: #606266;
}
.data-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 16px;
}
.col-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.col-name {
  font-weight: 500;
}
.col-type {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
}
.null-value {
  color: #909399;
  font-style: italic;
}
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}
.total-count {
  color: #606266;
  font-size: 13px;
}
.edit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.field-comment {
  font-size: 12px;
  color: #909399;
}
.sql-result {
  margin-top: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
}
.sql-result .result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}
.sql-result pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
}
</style>
