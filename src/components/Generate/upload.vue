<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="uploadFile">上传文件</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {upload} from '@/api/api.js';
import { ElMessage } from 'element-plus';

const file = ref(null);
const uploadStatus = ref('');
const MAX_FILE_SIZE = 50 * 1024 *1024; //50MB
const ALLOWED_FILE_TYPES = ['glb', 'gltf']; // 正确的MIME类型

const handleFileChange = (event) => {
  file.value = event.target.files[0];
};

const uploadFile = async () => {
  if (!file.value) {
    uploadStatus.value = '请选择一个文件';
    return;
  }
  // 检查文件大小
  if(file.value.size > MAX_FILE_SIZE){
    ElMessage.error('文件大小超过限制，请选择小于50MB的文件')
    return
  }
  const fileType =file.value.name.split('.')[1]
  // 检查文件类型
  if (!ALLOWED_FILE_TYPES.includes(fileType)){
    ElMessage.error('文件类型不正确，请选择GLTF/GLB文件')
    return
  }
  const formData = new FormData();
  formData.append('file', file.value);

  try {
    const response = await upload(formData)
    ElMessage.success('文件上传成功:');
  } catch (error) {
    ElMessage.error('文件上传失败:',error)
  }
};
</script>

<style scoped>
/* 添加一些样式 */
</style>
