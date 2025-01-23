<script setup>
import * as THREE from "three"
import {
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight, PlaneGeometry, MeshPhysicalMaterial, SpotLight, CylinderGeometry, DoubleSide, Vector2, Raycaster
} from "three"
import { Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Lamborghini from '../../src/public/Lamborghini.glb'
import GUI from 'lil-gui';
import TWEEN from '@tweenjs/tween.js';
import axios from "axios";
import icon from "./assets/语音.png"
import {ref} from "vue";

let scene, camera, renderer, controls;
let doors = []
let carStatus;
let isLoading = ref(false); // 添加 isLoading 状态
let transcript = ref(''); // 添加 transcript 变量
let isRecording = ref(false); // 添加 isRecording 状态
let recognition = null; // 语音识别实例

// 车身材质
let bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: "#6e2121",
  metalness: 1,
  roughness: 0.5,
  // 透明图层强度
  clearcoat: 1.0,
  // 透明涂层的粗糙度
  clearcoatRoughness: 0.03,
});


// 玻璃材质
let glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#793e3e",
  metalness: 0.25,
  roughness: 0,
  transmission: 1.0 //透光性.transmission属性可以让一些很薄的透明表面，例如玻璃，变得更真实一些。
});
// 轮胎材质
let tireMaterial = new THREE.MeshPhysicalMaterial({
  color:'#000000',
  metalness: 0.1,  // 轻微金属光泽
  roughness: 0.8,  // 表面较粗糙
  clearcoat: 1.0,  // 添加透明涂层以增强光泽
  clearcoatRoughness: 0.2 // 透明涂层的粗糙度
})

// 初始化场景
function initscene(){
  scene = new Scene()
}

// 初始化相机
function initCamera(){
  // fov?: number, aspect?: number, near?: number, far?: number
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(4.25, 1.4, -4.5)
}

// 初始化渲染器
function initRenderer(){
  renderer = new WebGLRenderer({
    // 增加锯齿
    antialias: true
  })
  renderer.setSize(window.innerWidth,window.innerHeight)
  // 支持阴影
  renderer.shadowMap.enabled = true
  document.body.appendChild(renderer.domElement)
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

// 绘制汽车模型
function loadCarModel(){
  isLoading.value = true
  new GLTFLoader().load(Lamborghini,function (gltf){
    const carModel = gltf.scene
    carModel.rotation.y = Math.PI

    carModel.traverse(obj => {
      if (obj.name === 'Object_103' || obj.name == 'Object_64' || obj.name == 'Object_77') {
        // 车身
        obj.material = bodyMaterial

      } else if (obj.name === 'Object_90') {
        // 玻璃
        obj.material = glassMaterial
      } else if (obj.name === 'Empty001_16' || obj.name === 'Empty002_20') {
        // 门
        doors.push(obj)
        console.log(obj)
      }
      // 产生阴影
      obj.castShadow = true
    })
    scene.add(carModel)
    isLoading.value = false
  })
}


// 绘制光源
function initLight(){
  const ambientLight= new AmbientLight('#fff',0.5)
  scene.add(ambientLight)
}
// 绘制地板
function initFloor(){
  // 形状
  const floorGeometry = new PlaneGeometry(20,20)
  // 材质
  const material = new MeshPhysicalMaterial({
    // 双面绘制
    side:DoubleSide,
    color:0x808080,
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
  const spotLight = new SpotLight(0xffffff, 0.5)
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
  // spotLight.map = bigTexture
  scene.add(spotLight);
}
// 绘制圆柱体
function initCylinder(){
  const geometry = new CylinderGeometry(10, 10, 20, 20)
  const material= new MeshPhysicalMaterial({
    color: 0x6c6c6c,
    side: DoubleSide
  })
  const cylinder = new Mesh(geometry, material)
  scene.add(cylinder)
}

// 绘制右侧面板
function initGUI(){
  let obj = {
    bodyColor:"#6e2121",
    glassColor:"#793e3e",
    tireColor:"#000000",
    carOpen,
    carClose,
    carIn,
    carOut,
    VoicePlayback,
    loadCarModel,
    Assistant,
    singing
  }
  const gui = new GUI()
  gui.addColor(obj,"bodyColor").name('车身颜色').onChange(value => {
    bodyMaterial.color.set(value)
  })
  gui.addColor(obj,"glassColor").name('玻璃颜色').onChange(value => {
    glassMaterial.color.set(value)
  })
  gui.addColor(obj,"tireColor").name('轮胎颜色').onChange(value => {
    tireMaterial.color.set(value)
  })
  gui.add(obj, "carOpen").name('打开车门')
  gui.add(obj, "carClose").name('关门车门')

  gui.add(obj, "carIn").name('车内视角')
  gui.add(obj, "carOut").name('车外视角')
  gui.add(obj, "VoicePlayback").name('语音播报')
  gui.add(obj, "loadCarModel").name('加载模型')
  gui.add(obj,"Assistant").name('语音助手')
  gui.add(obj,"singing").name('唱歌')

  // 默认关闭
  gui.close()
}
// 打开车门
function carOpen(){
  carStatus = 'open'
  for(let i = 0; i < doors.length;i++){
    setAnimationDoor( {x:0} , {x:Math.PI/3} , doors[i])
  }
}
// 关闭车门
function carClose(){
  carStatus = 'close'
  for (let i = 0;i < doors.length;i++){
    setAnimationDoor( {x:Math.PI/3} , {x:0} , doors[i])
  }
}
// 设置门的动画
function setAnimationDoor(start,end,mesh){
  // start 起始位置 end 结束位置 mesh 模型
  const Door = new TWEEN.Tween(start).to(end, 1000).easing(TWEEN.Easing.Quadratic.Out)
  Door.onUpdate((that) => {
    mesh.rotation.x = that.x
  })
  Door.start()
}

// 车内视角
function carIn(){
  setAnimationCamera({ cx: 4.25, cy: 1.4, cz: -4.5, ox: 0, oy: 0.5, oz: 0 }, { cx: -0.27, cy: 0.83, cz: 0.60, ox: 0, oy: 0.5, oz: -3 });
}
// 车外视角
function carOut(){
  setAnimationCamera({ cx: -0.27, cy: 0.83, cz: 0.6, ox: 0, oy: 0.5, oz: -3 }, { cx: 4.25, cy: 1.4, cz: -4.5, ox: 0, oy: 0.5, oz: 0 });
}
// 车内外动画
function setAnimationCamera(start,end){
  const Camera = new TWEEN.Tween(start).to(end, 3000).easing(TWEEN.Easing.Quadratic.Out)
  Camera.onUpdate((that) => {
    //  camera.postition  和 controls.target 一起使用
    camera.position.set(that.cx, that.cy, that.cz)
    controls.target.set(that.ox, that.oy, that.oz)
  })
  Camera.start()
}
// 语音助手
const Assistant = async () => {
  if(('webkitSpeechRecognition' in window)){
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN'; // 设置语言为中文
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('语音识别已开始...');
      isRecording.value = true;
    };

    recognition.onresult = async (event) => {
      // 获取用户想说的话
      transcript.value = event.results[0][0].transcript;
      // 把用户说的话传给AI
      let message = await AI(transcript.value)
      // console.log(message)
      // 把AI说的话进行朗读
      readTextFromFile(message)
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      stopRecording();
    };

    recognition.onend = () => {
      console.log('语音识别已结束');
      stopRecording();
    };

    recognition.start();
  } else {
    console.error('浏览器不支持 这个功能');
  }
}
// 智普AI
const AI = async (content) => {
  try {
    const apiKey = '0ebc759c7f704a1cabd584560b64b2ad.l82b4mWFHcwu1otH';
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
    console.log(response.data.choices[0].message.content)
    return response.data.choices[0].message.content;
  }catch (err){
    console.error('读取文件时出错:', error);
  }finally {
    isLoading.value = false;
  }
}

// 语音播报
const readTextFromFile = async (text) => {
  // console.log(text)
  isLoading.value = true
  try {
    const response = await axios.post('/tts',null,{
      params: {
        text: text,
        voice: '1031.pt',
        temperature: "0.2",
        top_p: "0.05",
        top_k: "20",
        custom_voice: "2000"
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });
    isLoading.value = false
    const file = response.data.url;

    // 创建Audio对象并播放文件
    const audio = new Audio(file);
    audio.play().then(() => {
      console.log('音频开始播放');
    }).catch(error => {
      console.error('播放音频时出错:', error);
    });

  } catch (error) {
    console.error('读取文件时出错:', error);
  }
};

// 停止录音
function stopRecording() {
  if (recognition) {
    recognition.stop();
  }
  isRecording.value = false;
}

// 切换录音状态
function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    Assistant();
  }
}


// 唱歌
const  singing = async () => {
  const response = await axios.get('/singing')
}

// VoicePlayback 函数
function VoicePlayback() {
  readTextFromFile(); // 读取文本文件并进行语言播报
}
// 绘制聚光灯
function createSpotlight(color) {
  const newObj = new THREE.SpotLight(color, 2);
  newObj.castShadow = true;
  newObj.angle = Math.PI / 6;;
  newObj.penumbra = 0.2;
  newObj.decay = 2;
  newObj.distance = 50;
  return newObj;
}

// // 绘制图片墙
// function initMessiLight(){
//   const spotLight1 = createSpotlight('#ffffff');
//   const texture = new TextureLoader().load(messi)
//
//   spotLight1.position.set(0, 3, 0);
//   spotLight1.target.position.set(-10, 3, 10)
//
//   spotLight1.map = texture
//   let lightHelper1 = new THREE.SpotLightHelper(spotLight1);
//   scene.add(spotLight1);
// }
// function initMutilColor() {
//   //创建三色光源
//   rectLight1 = new THREE.RectAreaLight(0xff0000, 50, 1, 10);
//   rectLight1.position.set(15, 10, 15);
//   rectLight1.rotation.x = -Math.PI / 2
//   rectLight1.rotation.z = -Math.PI / 4
//   scene.add(rectLight1);
//
//
//   rectLight2 = new THREE.RectAreaLight(0x00ff00, 50, 1, 10);
//   rectLight2.position.set(13, 10, 13);
//   rectLight2.rotation.x = -Math.PI / 2
//   rectLight2.rotation.z = -Math.PI / 4
//   scene.add(rectLight2);
//
//
//   rectLight3 = new THREE.RectAreaLight(0x0000ff, 50, 1, 10);
//   rectLight3.position.set(11, 10, 11);
//   rectLight3.rotation.x = -Math.PI / 2
//   rectLight3.rotation.z = -Math.PI / 4
//   scene.add(rectLight3);
//
//   scene.add(new RectAreaLightHelper(rectLight1));
//   scene.add(new RectAreaLightHelper(rectLight2));
//   scene.add(new RectAreaLightHelper(rectLight3));
//
//
//   startColorAnim()
// }
//
//
// function startColorAnim() {
//   let carTween = new TWEEN.Tween({ x: -5 }).to({ x: 25 }, 2000).easing(TWEEN.Easing.Quadratic.Out);
//   carTween.onUpdate(function (that) {
//     rectLight1.position.set(15 - that.x, 10, 15 - that.x)
//     rectLight2.position.set(13 - that.x, 10, 13 - that.x)
//     rectLight3.position.set(11 - that.x, 10, 11 - that.x)
//   });
//   carTween.onComplete(function (that) {
//     rectLight1.position.set(-15, 10, 15);
//     rectLight2.position.set(-13, 10, 13);
//     rectLight3.position.set(-11, 10, 11);
//
//     rectLight1.rotation.z = Math.PI / 4
//     rectLight2.rotation.z = Math.PI / 4
//     rectLight3.rotation.z = Math.PI / 4
//   })
//   carTween.repeat(10)
//
//
//   let carTween2 = new TWEEN.Tween({ x: -5 }).to({ x: 25 }, 2000).easing(TWEEN.Easing.Quadratic.Out);
//   carTween2.onUpdate(function (that) {
//     rectLight1.position.set(-15 + that.x, 10, 15 - that.x)
//     rectLight2.position.set(-13 + that.x, 10, 13 - that.x)
//     rectLight3.position.set(-11 + that.x, 10, 11 - that.x)
//   });
//   carTween2.onComplete(function (that) {
//     rectLight1.position.set(15, 10, 15);
//     rectLight2.position.set(13, 10, 13);
//     rectLight3.position.set(11, 10, 11);
//     rectLight1.rotation.z = - Math.PI / 4
//     rectLight2.rotation.z = - Math.PI / 4
//     rectLight3.rotation.z = - Math.PI / 4
//   })
//
//   carTween.start();
// }

function init(){
  initscene()
  initCamera()
  initRenderer()
  initOrbitControls()
  initLight()
  initFloor()
  initSpotLight()
  initCylinder()
  initGUI()
  // initMessiLight()
  // initMutilColor()
}


init()

function render(time){
  // 动画
  renderer.render(scene, camera)
  requestAnimationFrame(render)
  TWEEN.update(time)
  controls.update()
}
render()

window.addEventListener('resize', function () {
  // camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
})
window.addEventListener('click',function (event){
  let pointer = {}
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

  var vector = new Vector2(pointer.x, pointer.y)
  var raycaster = new Raycaster()
  raycaster.setFromCamera(vector, camera)
  let intersects = raycaster.intersectObjects(scene.children);

  intersects.forEach((item) => {
    if (item.object.name === 'Object_64' || item.object.name === 'Object_77') {
      if (!carStatus || carStatus === 'close') {
        carOpen()
      } else {
        carClose()
      }
      console.log(intersects)
    }
  })
})

</script>

<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner"></div>
  </div>
  <div class="voice-assistant">
    <img :src="icon" :class="{ 'recording': isRecording }" @click="toggleRecording" alt="语音" />
  </div>
</template>

<style scoped>
/* 加载中动画样式 */
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

/* 语音助手图标样式 */
.voice-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.voice-assistant img {
  width: 30px; /* 设置图标大小 */
  height: 30px; /* 设置图标大小 */
  cursor: pointer;
  position: relative;
}

/* 移动设备样式调整 */
@media (max-width: 768px) {
  .voice-assistant img {
    width: 20px;
    height: 20px;
  }
}
</style>
