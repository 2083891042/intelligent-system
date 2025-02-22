<script setup>

import {useModelStore} from "@/store/modelStore.js";
import {onMounted, ref, toRefs,watch} from "vue";
import {ElMessage} from "element-plus";
import {getAnimation} from "@/api/api.js"
const modelStore = useModelStore();
let gltf = null;
let carModel = null;


onMounted(()=>{
  gltf = modelStore.currentGltf;
  if (gltf){
    carModel = toRefs(gltf.scene);
  }
})
let transcript = ref(''); // 添加 transcript 变量
let isLoading = ref(false); // 添加 isLoading 状态
let recognition = null; // 语音识别实例
let isRecording = ref(false); // 添加 isRecording 状态
import axios from "axios";
import router from "@/router/index.js";
import {fetchImages} from "@/api/api.js";
const isListening = ref(true);
// 按住说话
const listen = () =>{
  isListening.value = !isListening.value
  // const stream = getMicrophoneStream()
  // if (stream){
  //   ElMessage.error('请打开麦克风说话');
  // }
  if (isRecording.value) {
    stopRecording();
  } else {
    Assistant();
  }
  // //  TODO:语音图标变成蓝色
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
    // // 根据音量判断是否在说话
    // if (volume > speakingThreshold && volume < noiseThreshold) {
    //   // 使用阈值0.05
    // } else if (volume > noiseThreshold) {
    //   ElMessage.info('声音太大了，请小点声音');
    // }else {
    //   ElMessage.info('没有听见你说话');
    //   return;
    // }
  }
  return {analyzeAudio};

  // // 启动定时器，每隔五秒开始监听一次
  // setInterval(() => {
  //   analyzeAudio(); // 开始监听
  // }, 5000);
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
    };
    // 识别到语音结果
    recognition.onresult = async (event) => {
      // 获取用户想说的话
      transcript.value = event.results[0][0].transcript;
      console.log(transcript.value)
      // 把用户说的话传给AI
      let message = await AI(transcript.value)
      console.log(message)
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
      console.log('语音识别已结束');
      const soundDetected = analyzeAudio();
      if (soundDetected > speakingThreshold && soundDetected < noiseThreshold) {
        // 如果检测到声音，重新开始语音识别
        recognition.start();
      } else if (soundDetected > noiseThreshold) {
        stopRecording();
        ElMessage.info('声音太嘈杂了')
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
  router.push('/Car')
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
    <img v-if="isListening" src="@/assets/语音.png" title="语音输入" @click="listen"/>
    <img  src="@/assets/语音%20(1).png" title="停止语音输入"  @click="undoListen" v-else/>
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