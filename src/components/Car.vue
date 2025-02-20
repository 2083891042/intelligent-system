<script setup>
import * as THREE from "three"
import {
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight, PlaneGeometry, MeshPhysicalMaterial, SpotLight, CylinderGeometry, DoubleSide, Vector2, Raycaster,PointLight
} from "three"
import { Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Lamborghini from '../assets/glb/Lamborghini.00aaaf55.glb'
import girl from "../assets/glb/chinese girl.glb"
import girl1 from "../assets/glb/business_girl.glb"
import girl2 from "../assets/glb/psylocke_-fortnite.glb"
import girl3 from "../assets/glb/scifi_girl_v.01.glb"
import girl4 from "../assets/glb/sexy_toon_girl_model_2_tina_6.glb"
import GUI from 'lil-gui';
import TWEEN from '@tweenjs/tween.js';
import icon from "../assets/语音.png"
import {ref,watch} from "vue";
import { useRouter } from 'vue-router';
import {fetchImages} from "@/api/api.js";

let carModel = null;
let scene, camera, renderer, controls;
let doors = []
let carStatus;
let isLoading = ref(false); // 添加 isLoading 状态
let transcript = ref(''); // 添加 transcript 变量
let isRecording = ref(false); // 添加 isRecording 状态
let recognition = null; // 语音识别实例
import { ElMessage } from 'element-plus';
// 图片信息
let images = ref([]);
// 男生信息
const boyImages = ref([])
// 女生信息
const girlImages = ref([])
// 动物信息
const animals = ref([])
// 抽屉
const drawer = ref(false)
// 标签页
const activeName = ref('first')
const handleClick = async (tab, value) => {
  if (tab === 'first' && value === true){
    try {
      let response = await fetchImages();
      images.value = response.data
      // 过滤出 sex 为 '1' 的图像
      boyImages.value = images.value.filter(image => image.sex === '1');
    }catch (error){
      ElMessage.error('请求错误！')
    }
  }else if (tab === 'second'){
    // 过滤出 sex 为 '2' 的图像
    girlImages.value = images.value.filter(image =>image.sex === '0');
  }else if (tab === 'third'){
    // 过滤出 sex 为 '3' 的图像
    animals.value = images.value.filter(image => image.sex === '2')
  }
}

// 监听函数
watch([activeName,drawer], ([newActiveName,newDrawer]) => {
  let tab = newActiveName;
  let value = newDrawer;
  handleClick(tab, value);
}, { immediate: true });

const router = useRouter();
// 车身材质
let bodyMaterial = new THREE.MeshPhysicalMaterial({
  // map:boyImages,
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
  new GLTFLoader().load(girl,function (gltf){
    carModel = gltf.scene
    carModel.rotation.y = Math.PI * 0.7
    // carModel.castShadow = true
    carModel.traverse(obj => {
      // console.log(typeof (obj.name))
      if (obj.name === "Sub_0_a2:lambert16SG1_0") {
        console.log(obj.name)
        // 车身
        obj.material = bodyMaterial

      } else if (obj.name === 'Object_90') {
        // 玻璃
        obj.material = glassMaterial
      } else if (obj.name === 'Empty001_16' || obj.name === 'Empty002_20') {
        // 门
        doors.push(obj)
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
  // spotLight.map = bigTexture
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
let gui = null;
// 绘制右侧面板
function initGUI(){
  let obj = {
    bodyColor:"#ffffff",
    glassColor:"#793e3e",
    tireColor:"#000000",
    carOpen,
    carClose,
    carIn,
    carOut,
    loadCarModel,
    goFireworks
  }
  gui = new GUI()
  if(gui){
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
    gui.add(obj, "loadCarModel").name('加载模型')
    gui.add(obj,"goFireworks").name('生成烟花')
  }else {
    gui.add(obj, "loadCarModel").name('加载模型')
    gui.add(obj,"goFireworks").name('生成烟花')
  }
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
  setAnimationCamera({ cx: 4.25, cy: 1.4, cz: -4.5, ox: 0, oy: 0.5, oz: 0 }, { cx: -0.27, cy: 1.83, cz: 1.60, ox: 0, oy: 0.5, oz: -3 });
}
// 车外视角
function carOut(){
  setAnimationCamera({ cx: -0.27, cy: 1.83, cz: 1.60, ox: 0, oy: 0.5, oz: -3 }, { cx: 4.25, cy: 1.4, cz: -4.5, ox: 0, oy: 0.5, oz: 0 });
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

// 跳转到烟花页面
function goFireworks() {
  router.push('/fireworks');
  if(gui){
    gui.destroy();
  }
}

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

const boyClick = (image) =>{
  console.log(image)
  // console.log(typeof image)
 if (image === 1){
   isLoading.value = true
   new GLTFLoader().load(girl1,function (gltf){
     carModel = gltf.scene;
     carModel.rotation.y = Math.PI * 0.7
     carModel.traverse(obj => {
       // console.log(obj)
       if (obj.name === 'Object_103' || obj.name == 'Object_64' || obj.name == 'Object_77') {
         // 车身
         obj.material = bodyMaterial

       } else if (obj.name === 'Object_90') {
         // 玻璃
         obj.material = glassMaterial
       } else if (obj.name === 'Empty001_16' || obj.name === 'Empty002_20') {
         // 门
         doors.push(obj)
       }
       // 产生阴影
       obj.castShadow = true
     })
     scene.add(carModel)
     isLoading.value = false
   })
 }
}
const girlClick = (image) =>{
  if (image.id === '1'){
    isLoading.value = true
    new GLTFLoader().load(girl,function (gltf){
      carModel = gltf.scene
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
        }
        // 产生阴影
        obj.castShadow = true
      })
      scene.add(carModel)
      isLoading.value = false
    })
  }
}
</script>

<template>
 <div>
   <div v-if="isLoading" class="loading-overlay">
     <div class="loading-spinner"></div>
   </div>
   <div class="voice-assistant">
     <img :src="icon" :class="{ 'recording': isRecording }" @click="toggleRecording" alt="语音" />
   </div>
   <el-button type="info" style="position: absolute;bottom: 16px;right: 16px; " @click="drawer = true">
     更多角色
   </el-button>

   <el-drawer v-model="drawer" title="I am the title" :with-header="false">
     <el-tabs
         v-model="activeName"
         type="card"
         class="demo-tabs"
         @tab-click="handleClick"
     >
       <el-tab-pane label="男生" name="first">
         <div class="image-grid">
           <div v-for="(image) in boyImages" :key="image.id" class="image-container">
              <div>
                <img
                    :alt="image.alt"
                    @click="boyClick(image.id)"
                />
                <p>{{ image.name }}</p>
              </div>
           </div>
         </div>
       </el-tab-pane>
       <el-tab-pane label="女生" name="second">
         <div class="image-grid">
           <div v-for="(image) in girlImages" :key="image.id" class="image-container">
             <div>
               <img
                   :alt="image.alt"
                   @click="girlClick(image.id)"
               />
               <p>{{ image.name }}</p>
             </div>
           </div>
         </div>
       </el-tab-pane>
       <el-tab-pane label="动物" name="third">
         <div class="image-grid">
           <div v-for="(image) in animals" :key="image.id" class="image-container">
             <div>
               <img
                   :alt="image.alt"
                   @click="boyClick(image.id)"
               />
               <p>{{ image.name }}</p>
             </div>
           </div>
         </div>
       </el-tab-pane>
       <el-tab-pane label="创建角色" name="fourth">
       </el-tab-pane>
     </el-tabs>
   </el-drawer>
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
