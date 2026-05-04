<template>
  <el-dialog v-model="visible" title="修改密码" width="400px">
    <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" placeholder="请输入旧密码" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  currentUser: Object
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(props.modelValue)
const formRef = ref()
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

/**
 * 提交修改密码表单
 * 验证旧密码，更新新密码，成功后触发 success 事件
 */
async function handleSubmit() {
  try {
    // 表单验证
    await formRef.value.validate()
  } catch (e) {
    return
  }

  // 验证旧密码是否正确
  const user = await window.electronAPI.auth.login(props.currentUser.account, form.oldPassword)
  if (!user) {
    ElMessage.error('旧密码错误')
    return
  }

  // 更新密码
  const operator = { id: props.currentUser.id, name: props.currentUser.name }
  await window.electronAPI.emp.updatePassword(props.currentUser.id, form.newPassword, operator)
  ElMessage.success('密码修改成功，请重新登录')
  visible.value = false
  emit('success')
}
</script>
