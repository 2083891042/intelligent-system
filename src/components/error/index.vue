<template>
  <div class="not-found-container">
    <div class="error-content">
      <!-- 动态数字动画 -->
      <div class="error-code">
        <span>4</span>
        <div class="planet">
          <span>0</span>
        </div>
        <span>4</span>
      </div>

      <!-- 动态错误提示 -->
      <h1 class="error-title">
        页面迷失在{{ dynamicLocation }}中...
      </h1>

      <p class="error-description">
        我们的小火箭没能找到你要访问的页面<br>
        可能它去{{ randomActivity }}了
      </p>

      <!-- 交互式返回操作 -->
      <div class="action-buttons">
        <router-link
            to="/"
            class="home-button"
            @mouseenter="startRocket"
            @mouseleave="resetRocket"
        >
          <transition name="rocket">
            <svg-icon
                v-show="showRocket"
                icon-class="rocket"
                class="rocket-icon"
            />
          </transition>
          返回地球（首页）
        </router-link>

<!--        <button-->
<!--            class="explore-button"-->
<!--            @click="showGalaxyMap"-->
<!--        >-->
<!--          <svg-icon icon-class="telescope" />-->
<!--          探索其他星系-->
<!--        </button>-->
      </div>

      <!-- 星空背景 -->
      <div class="star-field">
        <div
            v-for="(star, index) in stars"
            :key="index"
            class="star"
            :style="starStyle(star)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 动态数据
const locations = ref(['银河系', '星云', '黑洞边缘', '时空裂缝'])
const activities = ref(['星际旅行', '收集星尘', '躲避流星雨', '充电能量'])
const dynamicLocation = ref('')
const randomActivity = ref('')

// 星空效果
const stars = ref(Array(100).fill(null))
const starStyle = (star) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 3}s`,
  width: `${Math.random() * 3 + 1}px`,
  height: `${Math.random() * 3 + 1}px`
})

// 火箭动画
const showRocket = ref(false)
const startRocket = () => {
  showRocket.value = true
  setTimeout(() => (showRocket.value = false), 1000)
}
const resetRocket = () => (showRocket.value = false)

// 初始化动态文案
const randomizeText = () => {
  dynamicLocation.value = locations.value[Math.floor(Math.random() * locations.value.length)]
  randomActivity.value = activities.value[Math.floor(Math.random() * activities.value.length)]
  setTimeout(randomizeText, 5000) // 每5秒更换文案
}

// // 星系地图
// const showGalaxyMap = () => {
//   // 实现星系地图交互逻辑
//   console.log('展开星际导航地图...')
// }

onMounted(() => {
  randomizeText()
})
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #0b0f2c, #1a1f4a);
  color: white;
  overflow: hidden;
}

.error-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.error-code {
  font-size: 12rem;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  position: relative;
}

.error-code span {
  text-shadow: 0 0 20px rgba(100, 255, 255, 0.5);
}

.planet {
  animation: float 4s ease-in-out infinite;
  margin: 0 2rem;
  width: 120px;
  filter: drop-shadow(0 0 12px rgba(100, 200, 255, 0.5));
}

.error-title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.error-description {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 3rem;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.home-button, .explore-button {
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
}

.home-button {
  background: linear-gradient(45deg, #00b4d8, #0077b6);
  border: 2px solid #90e0ef;
}

.explore-button {
  background: linear-gradient(45deg, #6d597a, #b56576);
  border: 2px solid #e56b6f;
}

.home-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 180, 216, 0.4);
}

.explore-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(181, 101, 118, 0.4);
}

.rocket-icon {
  width: 24px;
  height: 24px;
  animation: rocket 1s ease-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes rocket {
  0% { transform: translateX(-50px) rotate(-45deg); opacity: 0; }
  100% { transform: translateX(50px) rotate(45deg); opacity: 1; }
}

.star-field {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle 1.5s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>
