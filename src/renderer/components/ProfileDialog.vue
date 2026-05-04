<template>
  <el-dialog v-model="visible" title="个人资料" width="400px">
    <div class="profile-content">
      <div class="profile-avatar-section">
        <el-avatar
          :size="80"
          :src="avatar"
          class="profile-avatar"
        >
          {{ currentUser?.name ? currentUser.name.charAt(0) : '?' }}
        </el-avatar>
        <el-upload
          class="profile-avatar-uploader"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleAvatarChange"
          accept="image/*"
        >
          <el-button type="primary" size="small">更换头像</el-button>
        </el-upload>
      </div>
      <div class="profile-info">
        <div class="profile-item">
          <span class="profile-label">姓名：</span>
          <span class="profile-value">{{ currentUser?.name || '-' }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">账号：</span>
          <span class="profile-value">{{ currentUser?.account || '-' }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">职位：</span>
          <span class="profile-value">{{ currentUser?.position || '-' }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  currentUser: Object,
  currentUserAvatar: String
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(props.modelValue)
const avatar = ref('')

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    avatar.value = props.currentUserAvatar
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

/**
 * 处理头像文件选择，将图片转为 base64 格式预览
 * @param {Object} uploadFile - 上传文件对象
 */
function handleAvatarChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    avatar.value = e.target.result
  }
  reader.readAsDataURL(file)
}

/**
 * 保存头像更新
 * 头像变更时调用 API 更新，并触发 save 事件通知父组件
 */
async function handleSave() {
  if (avatar.value && avatar.value !== props.currentUserAvatar) {
    await window.electronAPI.emp.updateAvatar(props.currentUser.id, avatar.value)
    emit('save', avatar.value)
    ElMessage.success('头像更新成功')
  }
  visible.value = false
}
</script>

<style scoped>
.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.profile-avatar {
  border: 3px solid #e2e8f0;
}

.profile-info {
  width: 100%;
}

.profile-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.profile-label {
  color: #64748b;
  width: 60px;
  flex-shrink: 0;
}

.profile-value {
  color: #1e293b;
  font-weight: 500;
}
</style>
