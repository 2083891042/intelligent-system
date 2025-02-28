<script setup>
import { Scene, Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight, PlaneGeometry, MeshPhysicalMaterial, SpotLight, CylinderGeometry, DoubleSide, Vector2, Raycaster,PointLight } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {useModelStore} from "@/store/modelStore.js";
import {onMounted, ref, toRefs,watch,onUnmounted} from "vue";
import {ElMessage} from "element-plus";
import {getAnimation} from "@/api/api.js"
const modelStore = useModelStore();
let gltf = null;
import TWEEN from '@tweenjs/tween.js';
let carModel = null;
onMounted(()=>{
  init()
  render()
  gltf = modelStore.currentGltf;
  window.addEventListener('resize', handleResize)
  if (gltf && gltf.scene) {
    // 克隆场景对象
    carModel = gltf.scene.clone();
    // 对克隆后的对象进行操作
    carModel.rotation.y = Math.PI * 0.7;
    carModel.traverse(obj => {
      obj.castShadow = true;
    });
    scene.add(carModel);
  }
})
// 清理模型
onUnmounted(() => {
  if (renderId !== null) {
    cancelAnimationFrame(renderId);
  }
  // 从场景中移除模型
  if (carModel) {
    scene.remove(carModel);
    carModel.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    carModel = null;
  }
  // 移除画布
  if (renderer) {
    document.body.removeChild(renderer.domElement); // 移除画布
    renderer.dispose();
    renderer = null;
  }
})
function handleResize() {
  // camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
}
let scene, camera, renderer, controls;
let renderId = null
function render(time){
  // 动画
  renderer.render(scene, camera)
  renderId = requestAnimationFrame(render)
  TWEEN.update(time)
  controls.update()
}
// 初始化场景
function initscene(){
  scene = new Scene()
}

// 初始化相机
function initCamera(){
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(4.25, 1.4, -4.5)
}

// 初始化渲染器
function initRenderer(){
  if (!renderer){
    renderer = new WebGLRenderer({
      // 增加锯齿
      antialias: true
    })
    renderer.setSize(window.innerWidth,window.innerHeight)
    // 支持阴影
    renderer.shadowMap.enabled = true
    document.body.appendChild(renderer.domElement)
  }
}
// 初始化轨道
function initOrbitControls(){
  controls = new OrbitControls(camera,renderer.domElement)
  controls.enableDamping = true

  controls.maxDistance = 9
  controls.minDistance = 1

  controls.minPolarAngle = 0
  controls.maxPolarAngle = 80 / 360 * 2 * Math.PI
}
// 绘制光源
function initLight(){
  // 添加环境光
  const ambientLight = new AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

// 添加点光源
  const pointLight = new PointLight(0xffffff, 1, 100);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

}
// 绘制地板
function initFloor(){
  // 形状
  const floorGeometry = new PlaneGeometry(20,20)
  // 材质
  const material = new MeshPhysicalMaterial({
    // 双面绘制
    side:DoubleSide,
    color:0xFFFFFF,
    // 金属0 不金属1
    metalness:0,
    // 粗糙度,越小越光滑
    roughness:0.1
  })
  const mesh = new Mesh(floorGeometry,material)
  // 旋转
  mesh.rotation.x = Math.PI / 2
  // 接收阴影
  mesh.receiveShadow = true
  scene.add(mesh)
}
// 绘制聚光灯
function initSpotLight(){
  const spotLight = new SpotLight(0xffffff, 1)
  spotLight.angle = Math.PI / 8; //散射角度，跟水平线的家教
  spotLight.penumbra = 0.2;  // 聚光锥的半影衰减百分比
  spotLight.decay = 2; // 纵向：沿着光照距离的衰减量。
  spotLight.distance = 30;
  spotLight.shadow.radius = 10;
  // 阴影映射宽度，阴影映射高度
  spotLight.shadow.mapSize.set(4096, 4096);

  spotLight.position.set(-5, 10, 1);
  // 光照射的方向
  spotLight.target.position.set(0, 0, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);
}
// 绘制圆柱体
function initCylinder(){
  const geometry = new CylinderGeometry(10, 10, 20, 20)
  const material= new MeshPhysicalMaterial({
    color: 0xFFFFFF,
    side: DoubleSide
  })
  const cylinder = new Mesh(geometry, material)
  scene.add(cylinder)
}
function init(){
  initscene()
  initCamera()
  initRenderer()
  initOrbitControls()
  initLight()
  initSpotLight()
  initFloor()
  initCylinder()
}
let transcript = ref(''); // 添加 transcript 变量
let isLoading = ref(false); // 添加 isLoading 状态
let recognition = null; // 语音识别实例
let isRecording = ref(false); // 录音的状态
import axios from "axios";
import router from "@/router/index.js";
const isListening = ref(true);
// 按住说话
const listen = () =>{
  isListening.value = !isListening.value
  if (isRecording.value) {
    stopRecording();
  } else {
    Assistant();
  }
   //  TODO:语音图标变成蓝色
}

// 检测声音
let speakingThreshold = 0.05;
let noiseThreshold = 0.1;
// 获取麦克风权限并返回音频流
async function getMicrophoneStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    ElMessage.error('请打开麦克风说话', error);
    throw error;
  }
}

// 设置AudioContext和AnalyserNode进行音频分析
async function setupAudioAnalysis() {
  // 获取音频流
  const stream = await getMicrophoneStream();
  // 创建AudioContext
  const audioContext = new AudioContext();
  // 创建MediaStreamAudioSourceNode
  const source = audioContext.createMediaStreamSource(stream);
  // 创建AnalyserNode
  const analyser = audioContext.createAnalyser();

  // 设置AnalyserNode的参数
  analyser.fftSize = 2048; // 快速傅里叶变换的大小
  analyser.minDecibels = -90; // 最小分贝值
  analyser.maxDecibels = -10; // 最大分贝值
  analyser.smoothingTimeConstant = 0.85; // 平滑时间常数

  // 连接音频流到AnalyserNode
  source.connect(analyser);

  // 获取数据数组的长度
  const bufferLength = analyser.frequencyBinCount;
  // 创建一个Float32Array来存储音频数据
  const dataArray = new Float32Array(bufferLength);

  // 实时分析音频数据
  function analyzeAudio() {
    // 获取时间域数据
    analyser.getFloatTimeDomainData(dataArray);
    // 计算音量
    const valume = calculateVolume(dataArray);
    return valume;
  }
  return {analyzeAudio};
}

// 计算音频信号的均方根（RMS）值
function calculateVolume(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  return Math.sqrt(sum / dataArray.length);
}


// 监听声音
const Assistant = async () => {
  if(('webkitSpeechRecognition' in window)){
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN'; // 设置语言为中文
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // 设置AudioContext和AnalyserNode
    const { analyzeAudio } = await setupAudioAnalysis();

    // 启动语音识别
    recognition.start();
    // 语音识别开始
    recognition.onstart = () => {
      isRecording.value = true;
      isListening.value = true;
    };
    // 识别到语音结果
    recognition.onresult = async (event) => {
      // 获取用户想说的话
      transcript.value = event.results[0][0].transcript;
      // 把用户说的话传给AI
      let message = await AI(transcript.value)
      // console.log(message)
      // 把AI说的话进行朗读
      readTextFromFile(message)
    };
    // 语音识别错误
    recognition.onerror = (event) => {
      ElMessage.error('语音识别错误:', event.error);
      stopRecording();
    };
    // 语音识别结束
    recognition.onend = () => {
      const soundDetected = analyzeAudio();
      if (soundDetected > speakingThreshold && soundDetected < noiseThreshold) {
        // 如果检测到声音，重新开始语音识别
        recognition.start();
      } else if (soundDetected > noiseThreshold) {
        ElMessage.info('声音太嘈杂了,请换个地方，再次进行录音')
        stopRecording();

      }else {
        stopRecording();
      }
      stopRecording();
    };

  } else {
    ElMessage.error('您的浏览器不支持录音功能,请切换浏览器');
  }
}

//文本转语音
const readTextFromFile = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // 设置语言为中文
    utterance.pitch = 1; // 设置音调为默认值
    utterance.rate = 1; // 设置语速为默认值
    utterance.volume = 1; // 设置音量为最大值
    window.speechSynthesis.speak(utterance);
  } else {
    ElMessage.info('您的浏览器不支持语音播报功能,请切换浏览器');
  }
}

// 停止录音
function stopRecording() {
  if (recognition) {
    recognition.stop();
  }
  isRecording.value = false;
}

// 智普AI
const AI = async (content) => {
  try {
    const apiKey = '0ebc759c7f704a1cabd584560b64b2ad.l82b4mWFHcwu1otH'; // 替换为实际的 API Key
    const model = 'glm-4-plus'; // 请填写您要调用的模型名称

    const messages = [
      {"role": "user", "content": content},
    ];

    const requestData = {
      model: model,
      messages: messages
    };
    isLoading.value = true
    const response = await axios({
      method: 'POST',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', // 请将此 URL 替换为实际的 API 地址
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: requestData
    })
    return response.data.choices[0].message.content;
  }catch (err){
    ElMessage.error('服务器繁忙!请稍后再试!', error);
  }finally {
    isLoading.value = false;
  }
}
// 停止录音
const undoListen = () => {
  // 2秒后才可以停止录音
  setTimeout(()=>{
    isListening.value = !isListening.value;
    recognition = new webkitSpeechRecognition();
    recognition.stop();
  },2000)
}
// 返回
const form = () =>{
  router.push('/car')
}
// 动画信息
const animations = ref([]);
// 唱
const sing = ref([])
// 跳
const jump = ref([])
// Rap
const rap = ref([])
// 篮球
const basketball = ref([])

// 抽屉
const drawer = ref(false)
// 标签页
const activeName = ref('first')
const handleClick = async (tab, value) => {
  if (tab === 'first' && value === true){
    try {
      let response = await getAnimation();
      animations.value = response.data
      // 过滤出 sex 为 '1' 的图像
      sing.value = animations.value.filter(image => image.type === '1');
    }catch (error){
      ElMessage.error('请求错误！')
    }
  }else if (tab === 'second'){
    try {
      // 过滤出 sex 为 '2' 的图像
      jump.value = animations.value.filter(image =>image.type === '2');
    }catch (error){
      ElMessage.error('请求错误！')
    }
  }else if (tab === 'third'){
    try {
      // 过滤出 sex 为 '3' 的图像
      rap.value = animations.value.filter(image => image.type === '3')
    }catch (err){
      ElMessage.error('请求错误！')
    }
  }else {
    try {
      basketball.value = animations.value.filter(image => image.type === '4')
    }catch (err){
      ElMessage.error('请求错误！')
    }
  }
}
// 监听函数
watch([activeName,drawer], ([newActiveName,newDrawer]) => {
  let tab = newActiveName;
  let value = newDrawer;
  handleClick(tab, value);
}, { immediate: true });
</script>

<template>
<div>
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner"></div>
  </div>
  <div>
    <el-button type="info" @click="form" style="position: absolute;top: 16px;left: 16px" >返回生成页面</el-button>
  </div>
  <div class="voice-assistant" style="position: absolute;bottom: 26px;left: 26px;">
    <img v-if="isListening" src="/img/语音.png" title="语音输入" @click="listen"/>
    <img  src="/img/语音%20(1).png" title="停止语音输入"  @click="undoListen" v-else/>
  </div>
  <el-button type="primary" style="position: absolute;bottom: 16px;right: 16px; " @click="drawer = true">
    更多动画
  </el-button>

  <el-drawer v-model="drawer" title="I am the title" :with-header="false">
    <el-tabs
        v-model="activeName"
        type="card"
        class="demo-tabs"
        @tab-click="handleClick"
    >
      <el-tab-pane label="唱" name="first">
        <div class="image-grid">
          <div v-for="(image) in sing" :key="image.id" class="image-container">
            <div>
              <img
                  :alt="image.description"
                  @click="boyClick(image.id)"
              />
              <p>{{ image.name }}</p>
            </div>
          </div>
<!--          <el-button type="primary" @click="goInter">互动</el-button>-->
        </div>
      </el-tab-pane>
      <el-tab-pane label="跳" name="second">
        <div class="image-grid">
          <div v-for="(image) in jump" :key="image.id" class="image-container">
            <div>
              <img
                  :alt="image.description"
                  @click="girlClick(image.id)"
              />
              <p>{{ image.name }}</p>
            </div>
          </div>
<!--          <el-button type="primary" @click="goInter">互动</el-button>-->
        </div>
      </el-tab-pane>
      <el-tab-pane label="Rap" name="third">
        <div class="image-grid">
          <div v-for="(image) in rap" :key="image.id" class="image-container">
            <div>
              <img
                  :alt="image.description"
                  @click="boyClick(image.id)"
              />
              <p>{{ image.name }}</p>
            </div>
          </div>
<!--          <el-button type="primary" @click="goInter">互动</el-button>-->
        </div>
      </el-tab-pane>
      <el-tab-pane label="篮球" name="fourth">
        <div class="image-grid">
          <div v-for="(image) in basketball" :key="image.id" class="image-container">
            <div>
              <img
                  :alt="image.description"
                  @click="boyClick(image.id)"
              />
              <p>{{ image.name }}</p>
            </div>
          </div>
<!--          <el-button type="primary" @click="goInter">互动</el-button>-->
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</div>
</template>



<style scoped>
.voice-assistant img {
  width: 30px; /* 设置图标大小 */
  height: 30px; /* 设置图标大小 */
  cursor: pointer;
}
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.loading-spinner {
  border: 16px solid #f3f3f3;
  border-top: 16px solid #3498db;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.image-container {
  flex: 0 0 calc(33.333% - 20px); /* 每行三个图片，每个图片之间有10px的间距 */
  margin-bottom: 20px;
  text-align: center;
}

.image-container img {
  margin: 2px 2px 0 2px;
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.image-container img:hover {
  box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.5); /* 添加黑色阴影效果 */
}

.image-container p {
  margin-top: 5px;
  font-size: 14px;
  color: #333;
}
</style>