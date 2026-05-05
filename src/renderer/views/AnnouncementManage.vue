<template>
  <div class="announcement-manage">
    <div class="header">
      <el-button type="primary" v-if="hasPermission('announcement:add')" @click="handleAdd">发布公告</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="publisher_name" label="发布人" width="120" />
      <el-table-column prop="publish_time" label="发布时间" width="180">
        <template #default="{ row }">
          {{ row.publish_time ? formatTime(row.publish_time) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="primary" v-if="hasPermission('announcement:edit')" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" v-if="hasPermission('announcement:delete')" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadList"
      @current-change="loadList"
      class="pagination"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="800" destroy-on-close @open="initEditor" @close="destroyEditor">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择公告类型">
            <el-option label="普通" value="normal" />
            <el-option label="重要" value="important" />
            <el-option label="紧急" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="草稿" value="draft" />
            <el-option label="发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间" prop="expire_time">
          <el-date-picker
            v-model="form.expire_time"
            type="datetime"
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm"
            value-format="x"
          />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <div style="border: 1px solid #ccc; width: 100%;">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="editorMode"
              style="border-bottom: 1px solid #ccc"
            />
            <Editor
              v-model="form.content"
              :defaultConfig="editorConfig"
              :mode="editorMode"
              style="height: 300px; overflow-y: hidden;"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog v-model="viewVisible" title="公告详情" width="700">
      <div class="announcement-detail" v-if="currentItem">
        <h3>{{ currentItem.title }}</h3>
        <div class="meta">
          <el-tag :type="getTypeTag(currentItem.type)">{{ getTypeLabel(currentItem.type) }}</el-tag>
          <span class="publisher">发布人：{{ currentItem.publisher_name || '-' }}</span>
          <span class="time">发布时间：{{ currentItem.publish_time ? formatTime(currentItem.publish_time) : '-' }}</span>
        </div>
        <el-divider />
        <div class="content" v-html="currentItem.content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '../stores/permission.js'
import { storeToRefs } from 'pinia'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const permStore = usePermissionStore()
const { isSuperAdmin, permissions } = storeToRefs(permStore)

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const viewVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const currentItem = ref(null)

// 富文本编辑器相关
const editorRef = shallowRef(null)
const editorMode = 'default'
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入公告内容...',
  MENU_CONF: {
    // 图片上传配置 - 自定义上传逻辑，转为 base64
    uploadImage: {
      // 自定义上传函数 - wangEditor v5 正确格式
      customUpload: async (file, insertFn) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            // 插入 base64 图片
            insertFn(e.target.result, file.name, '')
            resolve()
          }
          reader.readAsDataURL(file)
        })
      }
    }
  }
}

const form = ref({
  title: '',
  content: '',
  type: 'normal',
  status: 'published',
  expire_time: null
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

/**
 * 编辑器创建回调
 */
function handleEditorCreated(editor) {
  editorRef.value = editor
}

/**
 * 初始化编辑器内容
 */
function initEditor() {
  setTimeout(() => {
    if (editorRef.value && form.value.content) {
      editorRef.value.setHtml(form.value.content)
    }
  }, 100)
}

/**
 * 销毁编辑器
 */
function destroyEditor() {
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
}

/**
 * 检查是否有指定权限
 */
function hasPermission(code) {
  return isSuperAdmin.value || permissions.value.includes(code)
}

/**
 * 获取类型标签颜色
 */
function getTypeTag(type) {
  const map = { normal: 'info', important: 'warning', emergency: 'danger' }
  return map[type] || 'info'
}

/**
 * 获取类型显示文本
 */
function getTypeLabel(type) {
  const map = { normal: '普通', important: '重要', emergency: '紧急' }
  return map[type] || type
}

/**
 * 获取状态标签颜色
 */
function getStatusTag(status) {
  const map = { draft: 'info', published: 'success', archived: 'warning' }
  return map[status] || 'info'
}

/**
 * 获取状态显示文本
 */
function getStatusLabel(status) {
  const map = { draft: '草稿', published: '已发布', archived: '已归档' }
  return map[status] || status
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

/**
 * 加载公告列表
 */
async function loadList() {
  loading.value = true
  try {
    const result = await window.electronAPI.announcement.getAll({
      page: page.value,
      pageSize: pageSize.value
    })
    list.value = result.list
    total.value = result.total
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 新增公告
 */
function handleAdd() {
  isEdit.value = false
  form.value = { title: '', content: '<p></p>', type: 'normal', status: 'published', expire_time: null }
  dialogVisible.value = true
}

/**
 * 编辑公告
 */
function handleEdit(row) {
  isEdit.value = true
  currentItem.value = row
  form.value = {
    title: row.title,
    content: row.content || '<p></p>',
    type: row.type,
    status: row.status,
    expire_time: row.expire_time ? row.expire_time * 1000 : null
  }
  dialogVisible.value = true
}

/**
 * 查看公告详情
 */
function handleView(row) {
  currentItem.value = row
  viewVisible.value = true
}

/**
 * 删除公告
 */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '提示', { type: 'warning' })
    await window.electronAPI.announcement.delete(row.id, getCurrentUser())
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + e.message)
    }
  }
}

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    // 从编辑器获取最新的 HTML 内容
    let content = form.value.content
    if (editorRef.value) {
      content = editorRef.value.getHtml()
    }

    console.log('编辑器HTML内容:', content)
    console.log('内容长度:', content.length)
    console.log('是否包含图片:', content.includes('<img'))

    const data = {
      title: form.value.title,
      content: content,
      type: form.value.type,
      status: form.value.status,
      expire_time: form.value.expire_time ? Math.floor(form.value.expire_time / 1000) : null
    }

    if (isEdit.value) {
      await window.electronAPI.announcement.update(currentItem.value.id, data, getCurrentUser())
      ElMessage.success('更新成功')
    } else {
      const result = await window.electronAPI.announcement.add(data, getCurrentUser())
      console.log('新增结果:', result)
      ElMessage.success('发布成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (e) {
    console.error('提交错误:', e)
    if (e !== false) {
      ElMessage.error('操作失败：' + e.message)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadList()
})

onBeforeUnmount(() => {
  destroyEditor()
})
</script>

<style scoped>
.announcement-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.announcement-detail h3 {
  margin: 0 0 12px;
  font-size: 18px;
  text-align: center;
}

.announcement-detail .meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.announcement-detail .content {
  line-height: 1.6;
}
</style>
