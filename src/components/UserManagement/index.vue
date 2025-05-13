<template>
  <div class="login-container">
    <div class="login-wrapper">
      <!-- 左侧登录表单 -->
      <div class="login-main">
        <div class="login-header">
          <h2>用户登录</h2>
          <div class="login-tabs">
            <el-radio-group v-model="activeTab">
              <el-radio-button label="captcha">验证码登录</el-radio-button>
              <el-radio-button label="password">密码登录</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 登录表单 -->
        <el-form
            ref="loginForm"
            :model="formData"
            :rules="rules"
            @submit.prevent="handleSubmit"
        >
          <el-form-item prop="username">
            <el-input
                v-model="formData.username"
                :placeholder="activeTab === 'password' ? '手机号/邮箱' : '手机号/邮箱'"
                clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="activeTab === 'password'" prop="password">
            <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password
                clearable
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item v-else prop="captcha">
            <div class="captcha-input">
              <el-input
                  v-model="formData.captcha"
                  placeholder="请输入验证码"
                  clearable
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
              <el-button
                  class="send-captcha"
                  :disabled="!canSendCaptcha"
                  @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-button
              native-type="submit"
              type="primary"
              class="login-btn"
          >
            {{ activeTab === 'password' ? '立即登录' : '验证码登录' }}
          </el-button>
        </el-form>

        <div class="login-footer">
          <el-link type="info" @click="$router.push('/forgotPassword')">
            忘记密码
          </el-link>
          <el-link type="primary" @click="$router.push('/register')">
            立即注册
          </el-link>
        </div>
      </div>

      <!-- 右侧微信登录 -->
      <div class="wechat-login" v-if="activeTab === 'captcha'">
        <div class="qrcode-box">
          <h3>微信扫码登录</h3>
          <div class="qrcode">
            <!-- <img src="@/assets/wechat-qrcode.png" alt="微信登录二维码"> -->
          </div>
          <p>扫码后关注公众号完成登录</p>
        </div>
      </div>
    </div>

    <div class="agreement">
      注册登录即代表已阅读并同意
      <el-link type="primary" @click="$router.push('/agreement')">用户协议</el-link> 和
      <el-link type="primary" @click="$router.push('/privacy')">隐私政策</el-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { watch } from 'vue';
import {useRouter} from "vue-router";
import {useAuthStore} from "@/store/user.js"
import {loginByCaptcha, sendCaptcha, login} from "@/api/api.js";
const router = useRouter()

const activeTab = ref('captcha')
const formData = reactive({
  username: '',
  password: '',
  captcha: ''
})
const countdown = ref(0)
const loginForm = ref(null)


// 校验规则
const validateAccount = (rule, value, callback) => {
  const isPhone = /^1[3-9]\d{9}$/.test(value)
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  if (!value.trim()) {
    return callback(new Error('请输入手机号/邮箱'))
  }

  // 根据登录方式验证格式
  if (activeTab.value === 'captcha' && !isPhone) {
    return callback(new Error('验证码登录需要有效手机号'))
  }

  if (activeTab.value === 'password' && !isPhone && !isEmail) {
    return callback(new Error('请输入有效手机号或邮箱'))
  }

  callback()
}

const rules = reactive({
  username: [{
    validator: validateAccount,
    trigger: ['blur', 'change'] // 增加实时校验
  }],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['blur', 'change'],
      // 动态显示密码规则
      validator: (_, value, callback) => {
        if (activeTab.value !== 'password') return callback()
        if (!value?.trim()) return callback(new Error('密码不能为空'))
        if (value.length < 8 || value.length > 20) {
          return callback(new Error('密码长度需8-20位'))
        }
        callback()
      }
    }
  ],
  captcha: [
    {
      required: true,
      message: '请输入6位数字验证码',
      trigger: ['blur', 'change'],
      validator: (_, value, callback) => {
        if (activeTab.value !== 'captcha') return callback()
        if (!/^\d{6}$/.test(value)) {
          return callback(new Error('验证码为6位数字'))
        }
        callback()
      }
    }
  ]
})

// 验证码发送条件
const canSendCaptcha = computed(() => {
  if (countdown.value > 0) return false
  return /^1[3-9]\d{9}$/.test(formData.username)
})

const sendCode = async () => {
  try {
    const response = await sendCaptcha(formData.username)
    console.log(response)
    if (response.code === 200) {
      ElMessage.success(response.msg)
      startCountdown()
      setTimeout(() => {
        ElMessage.success(response.data)
      }, 1000);
    } else {
      ElMessage.error(response.msg)
    }
  } catch (error) {
  ElMessage.error('验证码发送异常:', error)
}}

//倒计时逻辑
const startCountdown = () => {
    countdown.value = 60
    const timer = setInterval(() => {
      if (countdown.value <= 0) {
        clearInterval(timer)
        return
      }
      countdown.value--
    }, 1000)
}

const handleSubmit = async () => {
  try {
    await loginForm.value.validate()
    const data = activeTab.value === 'password'
        ? { userName: formData.username, password: formData.password }
        : { userName: formData.username, captcha: formData.captcha }
    // 发送请求
    const response = activeTab.value === 'password'
        ? await login(data)
        : await loginByCaptcha(data)
    if (response.code === 200) {
      const token = response.data.token;
      const user = response.data.user
      // 2. 调用 Pinia Store 存储 Token
      const authStore = useAuthStore();
      authStore.login(token);
      authStore.UserInfo(user)

      ElMessage.success(response.msg)
      //跳转逻辑
      router.push('/home')
    }else {
      ElMessage.error(response.msg);
    }
  } catch (error) {
    ElMessage.error('登录失败，请重试!')
  }
}

// 监听标签切换
watch(activeTab, (newVal) => {
  // 重置所有表单字段
  formData.userName = '';
  formData.password = '';
  formData.captcha = '';

  // 重置验证码倒计时
  countdown.value = 0;

  // 重置表单验证状态
  if (loginForm.value) {
    loginForm.value.resetFields();
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 0;
}

.login-wrapper {
  display: flex;
  gap: 60px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 40px;
  width: 900px;
}

.login-main {
  flex: 1;
  border-right: 1px solid #eee;
  padding-right: 60px;
}

.login-header {
  margin-bottom: 30px;
}

.login-tabs {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.login-tabs button {
  padding: 0;
  border: none;
  background: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.login-tabs button.active {
  color: #1890ff;
  font-weight: 500;
}

.login-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1890ff;
}

.form-group {
  margin-bottom: 24px;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

input:focus {
  border-color: #1890ff;
  outline: none;
}

.captcha-input {
  display: flex;
  gap: 12px;
}

.send-captcha {
  flex-shrink: 0;
  width: 120px;
  background: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.send-captcha:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  height: 48px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.action-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
}

.wechat-login {
  width: 300px;
  text-align: center;
}

.qrcode-box h3 {
  color: #333;
  margin-bottom: 20px;
}

.qrcode {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.qrcode img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.agreement {
  margin-top: 30px;
  color: #666;
  font-size: 14px;
}

.agreement a {
  color: #1890ff;
  text-decoration: none;
}
</style>
