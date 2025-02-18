<script setup>

</script>

<template>
  <div class="iframe-container">
    <iframe src="/public/index2.html"></iframe>
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 设置 iframe 占据整个容器 */
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
}

/* 响应式设计：根据屏幕宽度调整 iframe 的高度 */
@media (max-width: 480px) {
  /* 小手机设备 */
  .iframe-container {
    height: 100vh; /* 根据需要调整小手机上的高度 */
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  /* 中型手机和平板设备 */
  .iframe-container {
    height: 100vh; /* 根据需要调整手机和平板上的高度 */
  }
}

@media (min-width: 769px) {
  /* 电脑设备 */
  .iframe-container {
    height: 100vh; /* 占据整个视口高度 */
  }
}
</style>