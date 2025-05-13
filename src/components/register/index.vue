<template>
  <div class="register-container">
    <div class="register-box">
      <el-card class="register-card">
        <div class="register-header">
          <h2 class="title">注册模型账号</h2>
          <div class="sub-title">你所在地区仅支持手机号注册，只需一个模型账号，即可访问所有服务</div>
        </div>

        <el-form ref="registerForm" :model="formData" :rules="rules" @submit.prevent="handleSubmit">
          <!-- 手机号输入 -->
          <el-form-item prop="username">
            <el-input v-model="formData.username" placeholder="请输入手机号" class="with-prefix">
              <template #prepend>+86</template>
            </el-input>
          </el-form-item>

          <!-- 密码输入 -->
          <el-form-item prop="password">
            <el-input v-model="formData.password" type="password" placeholder="请输入密码（8-20位字符）" show-password />
          </el-form-item>

          <!-- 确认密码 -->
          <el-form-item prop="confirmPassword">
            <el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="agreed">
              我已阅读并同意
              <el-link type="primary">《用户协议》</el-link>
              和
              <el-link type="primary">《隐私政策》</el-link>
            </el-checkbox>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item>
            <el-button native-type="submit" type="primary" class="submit-btn" :disabled="!agreed">
              立即注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="footer">
          <el-link type="info" @click="$router.push('/login')">
            <i class="el-icon-arrow-left"></i>
            返回登录
          </el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive} from 'vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/api.js'
import { useRouter } from 'vue-router'
const router = useRouter()

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const countdown = ref(0)
const agreed = ref(false)
const registerForm = ref(null)

// 验证规则
const validatePass = (rule, value, callback) => {
  if (value.length < 8) {
    callback(new Error('密码长度不能小于8位'))
  } else {
    if (formData.confirmPassword !== '') {
      registerForm.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
})


// 提交注册
const handleSubmit = async () => {
  try {
    await registerForm.value.validate()
    const data = {
      userName: formData.username,
      password: formData.password,
    }

    const response = await register(data)
    if (response.code === 200) {
      ElMessage.success(response.msg)
      router.push('/login')
    } else {
      ElMessage.error(response.msg)
    }
  } catch (error) {
    ElMessage.error('注册失败，请重试!')
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.register-box {
  width: 450px;
}

.register-card {
  padding: 30px 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.sub-title {
  font-size: 14px;
  color: #606266;
}

.captcha-input {
  display: flex;
  gap: 10px;
}

.send-btn {
  width: 120px;
}

.submit-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
}

.footer {
  text-align: center;
  margin-top: 20px;
}

.el-icon-arrow-left {
  margin-right: 5px;
}

.with-prefix :deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  padding: 0 15px;
}
</style>
