<template>
  <div class="personal-container">
    <el-card class="profile-card">
      <!-- 头像与信息区域 -->
      <el-row :gutter="20" class="header">
        <el-col :span="6" class="avatar-col">
          <el-avatar :src="userInfo.avatar" :size="150" class="avatar" />
          <p v-if="isEditing" class="avatar-tip">点击头像可更换</p>
        </el-col>

        <el-col :span="18" class="basic-info">
          <div v-if="!isEditing" class="info-display">
            <h1 class="name">昵称：{{ userInfo.nickName }}</h1>
            <p class="position">账号：{{ userInfo.userName }}</p>
            <p class="position">号码：{{ userInfo.phonenumber }}</p>
            <p class="position">邮箱：{{ userInfo.email }}</p>
            <p class="position">性别：{{ formattedSex }}</p>
          </div>

          <div v-else class="edit-fields">
            <el-form label-position="top" label-width="80px">
              <el-form-item label="昵称">
                <el-input v-model="editingInfo.nickName" clearable>
                  <template #suffix>
                    <el-icon @click="clearInput('nickName')">
                      <CloseBold />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="账号">
                <el-input v-model="editingInfo.userName" clearable>
                  <template #suffix>
                    <el-icon @click="clearInput('userName')">
                      <CloseBold />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="邮箱">
                <el-input v-model="editingInfo.email" clearable>
                  <template #suffix>
                    <el-icon @click="clearInput('email')">
                      <CloseBold />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="号码">
                <el-input v-model="editingInfo.phonenumber" clearable>
                  <template #suffix>
                    <el-icon @click="clearInput('phonenumber')">
                      <CloseBold />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="性别">
                <el-input v-model="editingInfo.sex" @input="handleSexInput"  clearable>
                  <template #suffix>
                    <el-icon @click="clearInput('sex')">
                      <CloseBold />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="toggleEdit" type="primary" :icon="isEditing ? 'Close' : 'EditPen'">
          {{ isEditing ? '取消编辑' : '修改资料' }}
        </el-button>

        <template v-if="isEditing">
          <el-button type="success" @click="submitEdit" :loading="submitLoading" icon="Check">保存修改</el-button>
          <el-button type="info" @click="resetEdit" icon="Refresh">重置</el-button>
        </template>
      </div>

      <!-- 退出登录 -->
      <div class="logout-button">
        <el-button type="danger" @click="logout" icon="SwitchButton">退出登录</el-button>
      </div>
    </el-card>
  </div>
</template>


<script setup>
import { useAuthStore } from "@/store/user.js"
import { computed, ref } from "vue";
import {editApplyUser} from "@/api/api.js"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { CloseBold, EditPen, Check, Refresh, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore();
const userInfo = computed(() => authStore.userInfo);
const isEditing = ref(false)
const submitLoading = ref(false)

const sexMap = {
  0: '男',
  1: '女'
};
// 修改初始化逻辑
const editingInfo = ref({
  ...userInfo.value,
  sex: sexMap[userInfo.value.sex] || userInfo.value.sex // 显式转换
})
const formattedSex = computed(() => sexMap[userInfo.value.sex]);

const handleSexInput = (value) => {
  if (value === '男') {
    editingInfo.value.sex = 0;
  } else if (value === '女') {
    editingInfo.value.sex = 1;
  }
};


// 切换编辑状态
const toggleEdit = () => {
  isEditing.value = !isEditing.value;
  // 切换时同步最新 userInfo 到 editingInfo
  if (!isEditing.value) {
    editingInfo.value = { ...userInfo.value };
  }
};

// 数据验证
const validateFields = () => {
  if (!editingInfo.value.nickName.trim()) {
    ElMessage.error('昵称不能为空')
    return false
  }
  if (!editingInfo.value.userName.trim()) {
    ElMessage.error('账号不能为空')
    return false
  }
  return true
}

// 提交修改
const submitEdit = async () => {
  if (!validateFields()) return

  try {
    submitLoading.value = true
    const submitData = {
      ...editingInfo.value,
      sex: editingInfo.value.sex === '男' ? 0 :1
    };

    // 调用API更新数据
    const responnse = await editApplyUser(submitData);
    if(responnse.code === 200){
      ElMessage.success(responnse.msg)
      authStore.UserInfo(editingInfo.value);
    }
    

    ElMessage.success('信息更新成功')
    isEditing.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

// 重置编辑状态
const resetEdit = () => {
  editingInfo.value = { ...userInfo.value }
  ElMessage.info('已恢复原始数据')
}
</script>

<style scoped>
.personal-container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 20px;
  background: #f5f7fa;
}

.profile-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  padding: 30px;
  transition: all 0.3s ease;
}

.header {
  margin-bottom: 30px;
  align-items: center;
}

.avatar-col {
  text-align: center;
}

.avatar {
  border: 3px solid #e4e4e4;
  transition: all 0.3s ease;
}

.avatar:hover {
  border-color: #409EFF;
}

.avatar-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

.basic-info {
  padding-top: 20px;
}

.name {
  font-size: 32px;
  margin: 0 0 15px;
  color: #303133;
  font-weight: 600;
}

.position,
.email {
  font-size: 16px;
  color: #606266;
  margin: 8px 0;
}

.edit-fields {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.action-buttons {
  margin-top: 30px;
  text-align: right;
}

.logout-button {
  margin-top: 20px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .avatar-col {
    margin-bottom: 20px;
  }

  .basic-info {
    text-align: center;
  }
}
</style>
