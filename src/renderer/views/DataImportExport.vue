<template>
  <div class="import-export">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="员工数据导出" name="export">
        <div class="section">
          <el-card shadow="never">
            <template #header>
              <span>导出员工列表</span>
            </template>
            <el-form :inline="true">
              <el-form-item label="部门">
                <el-tree-select
                  v-model="exportDeptId"
                  :data="deptTree"
                  :props="{ label: 'name', value: 'id' }"
                  placeholder="全部部门"
                  clearable
                  check-strictly
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleExportEmployees" :loading="exporting">
                  导出 Excel
                </el-button>
              </el-form-item>
            </el-form>
            <el-alert type="info" :closable="false" show-icon>
              导出当前筛选条件下的所有员工数据，包含：姓名、账号、性别、年龄、手机、邮箱、部门、职位、薪资
            </el-alert>
          </el-card>
        </div>

        <div class="section">
          <el-card shadow="never">
            <template #header>
              <span>导出操作日志</span>
            </template>
            <el-form :inline="true">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="logDateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="x"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleExportLogs" :loading="exportingLogs">
                  导出 Excel
                </el-button>
              </el-form-item>
            </el-form>
            <el-alert type="info" :closable="false" show-icon>
              导出指定时间范围内的操作日志记录
            </el-alert>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="员工数据导入" name="import">
        <div class="section">
          <el-card shadow="never">
            <template #header>
              <span>批量导入员工</span>
            </template>
            <el-steps :active="importStep" finish-status="success" simple>
              <el-step title="上传文件" />
              <el-step title="数据预览" />
              <el-step title="导入结果" />
            </el-steps>

            <div class="import-content">
              <!-- 步骤1：上传文件 -->
              <div v-if="importStep === 0" class="step-content">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :limit="1"
                  accept=".xlsx,.xls"
                  :on-change="handleFileChange"
                  drag
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">只能上传 xlsx/xls 文件</div>
                  </template>
                </el-upload>
                <div class="template-download">
                  <el-button type="primary" link @click="downloadTemplate">下载导入模板</el-button>
                </div>
              </div>

              <!-- 步骤2：数据预览 -->
              <div v-if="importStep === 1" class="step-content">
                <el-alert
                  v-if="previewData.errors.length > 0"
                  :title="`发现 ${previewData.errors.length} 条数据问题`"
                  type="warning"
                  :closable="false"
                  class="preview-alert"
                >
                  <ul>
                    <li v-for="(err, idx) in previewData.errors.slice(0, 5)" :key="idx">{{ err }}</li>
                    <li v-if="previewData.errors.length > 5">... 共 {{ previewData.errors.length }} 条错误</li>
                  </ul>
                </el-alert>
                <el-table :data="previewData.list" max-height="400" border stripe>
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="account" label="账号" width="120" />
                  <el-table-column prop="gender" label="性别" width="60" />
                  <el-table-column prop="age" label="年龄" width="60" />
                  <el-table-column prop="phone" label="手机" width="120" />
                  <el-table-column prop="email" label="邮箱" width="160" />
                  <el-table-column prop="department_name" label="部门" width="120" />
                  <el-table-column prop="position" label="职位" width="120" />
                  <el-table-column prop="salary" label="薪资" width="100" />
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row._valid ? 'success' : 'danger'">
                        {{ row._valid ? '正常' : row._error || '异常' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="step-actions">
                  <el-button @click="resetImport">重新上传</el-button>
                  <el-button type="primary" @click="handleImport" :loading="importing" :disabled="previewData.list.filter(r => r._valid).length === 0">
                    导入有效数据 ({{ previewData.list.filter(r => r._valid).length }} 条)
                  </el-button>
                </div>
              </div>

              <!-- 步骤3：导入结果 -->
              <div v-if="importStep === 2" class="step-content">
                <el-result
                  :icon="importResult.failed === 0 ? 'success' : 'warning'"
                  :title="importResult.failed === 0 ? '导入成功' : '部分导入成功'"
                >
                  <template #sub-title>
                    <p>成功：{{ importResult.success }} 条</p>
                    <p v-if="importResult.failed > 0">失败：{{ importResult.failed }} 条</p>
                  </template>
                  <template #extra>
                    <el-button type="primary" @click="resetImport">继续导入</el-button>
                  </template>
                </el-result>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useDeptStore } from '../stores/dept.js'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'

const deptStore = useDeptStore()
const { treeData } = storeToRefs(deptStore)

const activeTab = ref('export')
const exporting = ref(false)
const exportingLogs = ref(false)
const exportDeptId = ref(null)
const logDateRange = ref(null)

const importStep = ref(0)
const importing = ref(false)
const uploadRef = ref(null)
const previewData = ref({ list: [], errors: [] })
const importResult = ref({ success: 0, failed: 0 })

const deptTree = computed(() => {
  return [{ id: 0, name: '全部部门', children: treeData.value }]
})

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 导出员工数据
 */
async function handleExportEmployees() {
  exporting.value = true
  try {
    // 获取员工数据
    const employees = await window.electronAPI.emp.getAll()
    let data = employees

    // 按部门筛选
    if (exportDeptId.value) {
      data = employees.filter(e => e.department_id === exportDeptId.value)
    }

    if (data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    // 构建导出数据
    const exportData = data.map(e => ({
      '姓名': e.name,
      '账号': e.account,
      '性别': e.gender,
      '年龄': e.age,
      '手机': e.phone,
      '邮箱': e.email,
      '部门': e.department_name,
      '职位': e.position,
      '薪资': e.salary
    }))

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '员工列表')

    // 导出文件
    const fileName = `员工列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败：' + e.message)
  } finally {
    exporting.value = false
  }
}

/**
 * 导出操作日志
 */
async function handleExportLogs() {
  exportingLogs.value = true
  try {
    // 构建查询参数
    const params = {}
    if (logDateRange.value && logDateRange.value.length === 2) {
      params.startTime = Math.floor(logDateRange.value[0] / 1000)
      params.endTime = Math.floor(logDateRange.value[1] / 1000) + 86400
    }

    // 获取日志数据
    const result = await window.electronAPI.log.getList(params)
    const logs = result.list

    if (logs.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    // 构建导出数据
    const exportData = logs.map(log => ({
      '操作人': log.user_name,
      '模块': log.module,
      '操作': log.action,
      '对象类型': log.target_type,
      '对象名称': log.target_name,
      '详情': log.detail,
      '时间': log.created_at ? new Date(log.created_at * 1000).toLocaleString('zh-CN') : '-'
    }))

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '操作日志')

    // 导出文件
    const fileName = `操作日志_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败：' + e.message)
  } finally {
    exportingLogs.value = false
  }
}

/**
 * 下载导入模板
 */
function downloadTemplate() {
  const template = [
    { '姓名': '张三', '账号': 'zhangsan', '性别': '男', '年龄': 30, '手机': '13800138000', '邮箱': 'zhangsan@example.com', '部门': '技术部', '职位': '工程师', '薪资': 15000 },
    { '姓名': '李四', '账号': 'lisi', '性别': '女', '年龄': 28, '手机': '13800138001', '邮箱': 'lisi@example.com', '部门': '市场部', '职位': '销售', '薪资': 12000 }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '员工导入模板')
  XLSX.writeFile(wb, '员工导入模板.xlsx')
}

/**
 * 文件选择变化
 */
async function handleFileChange(file) {
  if (!file) return

  try {
    const data = await file.raw.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet)

    if (jsonData.length === 0) {
      ElMessage.error('文件中没有数据')
      return
    }

    // 获取部门和职位数据用于校验
    const departments = await window.electronAPI.dept.getAll()
    const deptMap = new Map(departments.map(d => [d.name, d.id]))

    // 校验数据
    const errors = []
    const list = jsonData.map((row, idx) => {
      const item = {
        name: row['姓名'] || '',
        account: row['账号'] || '',
        gender: row['性别'] || '男',
        age: row['年龄'] || null,
        phone: row['手机'] || '',
        email: row['邮箱'] || '',
        department_name: row['部门'] || '',
        position: row['职位'] || '',
        salary: row['薪资'] || null,
        _valid: true,
        _error: ''
      }

      // 校验必填字段
      if (!item.name) {
        item._valid = false
        item._error = '姓名不能为空'
        errors.push(`第 ${idx + 2} 行：姓名不能为空`)
      }
      if (!item.account) {
        item._valid = false
        item._error = '账号不能为空'
        errors.push(`第 ${idx + 2} 行：账号不能为空`)
      }

      // 校验部门是否存在
      if (item.department_name && !deptMap.has(item.department_name)) {
        item._valid = false
        item._error = '部门不存在'
        errors.push(`第 ${idx + 2} 行：部门"${item.department_name}"不存在`)
      }

      return item
    })

    previewData.value = { list, errors }
    importStep.value = 1
  } catch (e) {
    ElMessage.error('解析文件失败：' + e.message)
  }
}

/**
 * 执行导入
 */
async function handleImport() {
  importing.value = true
  try {
    const departments = await window.electronAPI.dept.getAll()
    const deptMap = new Map(departments.map(d => [d.name, d.id]))

    let success = 0
    let failed = 0

    for (const item of previewData.value.list) {
      if (!item._valid) {
        failed++
        continue
      }

      try {
        const empData = {
          name: item.name,
          account: item.account,
          gender: item.gender,
          age: item.age ? parseInt(item.age) : null,
          phone: item.phone,
          email: item.email,
          department_id: deptMap.get(item.department_name) || null,
          position: item.position,
          salary: item.salary ? parseFloat(item.salary) : null,
          password: '123456'
        }

        await window.electronAPI.emp.add(empData, getCurrentUser())
        success++
      } catch (e) {
        failed++
      }
    }

    importResult.value = { success, failed }
    importStep.value = 2
  } catch (e) {
    ElMessage.error('导入失败：' + e.message)
  } finally {
    importing.value = false
  }
}

/**
 * 重置导入
 */
function resetImport() {
  importStep.value = 0
  previewData.value = { list: [], errors: [] }
  importResult.value = { success: 0, failed: 0 }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

onMounted(() => {
  deptStore.loadAll()
})
</script>

<style scoped>
.import-export {
  height: 100%;
}

.section {
  margin-bottom: 20px;
}

.template-download {
  margin-top: 16px;
  text-align: center;
}

.import-content {
  margin-top: 20px;
}

.step-content {
  padding: 20px 0;
}

.preview-alert {
  margin-bottom: 16px;
}

.preview-alert ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.step-actions {
  margin-top: 16px;
  text-align: right;
}
</style>
