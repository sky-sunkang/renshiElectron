<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#3b82f6"><UserFilled /></el-icon>
        <h2>人事管理系统</h2>
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

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="form.captcha"
              placeholder="验证码"
              size="large"
              :prefix-icon="Key"
              @keyup.enter="handleLogin"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <canvas ref="captchaCanvas" width="100" height="40"></canvas>
            </div>
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Lock, Key } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const captchaCanvas = ref()
const captchaCode = ref('')
const form = reactive({ account: 'sysadmin', password: '123456', captcha: '8888' })
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

/**
 * 生成随机验证码
 */
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 绘制验证码图片
 */
function drawCaptcha() {
  const canvas = captchaCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 背景色
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, width, height)

  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }

  // 绘制验证码文字
  const code = captchaCode.value
  ctx.font = 'bold 24px Arial'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < code.length; i++) {
    const x = 15 + i * 22
    const y = height / 2
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`
    // 随机旋转
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.4)
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }

  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`
    ctx.beginPath()
    ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
}

/**
 * 刷新验证码
 */
function refreshCaptcha() {
  captchaCode.value = generateCaptcha()
  drawCaptcha()
}

/**
 * 处理登录操作
 * 验证表单、校验验证码、调用登录接口
 */
async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  // 验证码校验（8888 为万能验证码）
  if (form.captcha !== '8888' && form.captcha.toLowerCase() !== captchaCode.value.toLowerCase()) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    return
  }

  loading.value = true
  try {
    const user = await window.electronAPI.auth.login(form.account, form.password)
    loading.value = false
    if (user) {
      ElMessage.success('登录成功')
      authStore.login(user)
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
      refreshCaptcha()
    }
  } catch (err) {
    loading.value = false
    console.error('[Login] error:', err)
    ElMessage.error('登录失败: ' + (err.message || '未知错误'))
    refreshCaptcha()
  }
}

onMounted(() => {
  refreshCaptcha()
})
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
.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.captcha-row :deep(.el-input) {
  flex: 1;
}
.captcha-img {
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}
.captcha-img:hover {
  border-color: #409eff;
}
</style>