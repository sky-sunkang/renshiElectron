<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#3b82f6"><UserFilled /></el-icon>
        <h2>员工信息管理系统</h2>
        <p>请登录您的账户</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            placeholder="账号"
            size="large"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Lock } from '@element-plus/icons-vue'

const emit = defineEmits(['login'])

const formRef = ref()
const loading = ref(false)
const form = reactive({ account: 'sysadmin', password: '123456' })
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  loading.value = true
  try {
    const user = await window.electronAPI.auth.login(form.account, form.password)
    loading.value = false
    if (user) {
      ElMessage.success('登录成功')
      emit('login', user)
    } else {
      ElMessage.error('账号或密码错误')
    }
  } catch (err) {
    loading.value = false
    console.error('[Login] error:', err)
    ElMessage.error('登录失败: ' + (err.message || '未知错误'))
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}
.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h2 {
  margin: 16px 0 8px;
  font-size: 22px;
  color: #1e293b;
}
.login-header p {
  color: #94a3b8;
  font-size: 14px;
}
.login-form :deep(.el-input__inner) {
  height: 44px;
}
</style>