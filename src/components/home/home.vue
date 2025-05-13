<script setup>
import {
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight, PlaneGeometry, MeshPhysicalMaterial, SpotLight, CylinderGeometry, DoubleSide, Vector2, Raycaster,PointLight
} from "three"
import { Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import GUI from 'lil-gui';
import TWEEN from '@tweenjs/tween.js';
import {onMounted, ref, watch, onUnmounted, toRefs, computed} from "vue";
import {useRouter, useRoute} from 'vue-router';
import {fetchImages, submit} from "@/api/api.js";
import {useModelStore} from "@/store/modelStore.js";
const modelStore = useModelStore()
import { useAuthStore } from '@/store/user.js';
let scene, camera, renderer, controls;
import Personal from './personal.vue' // 引入个人信息组件
const authStore = useAuthStore() // 获取用户登录状态
const isLoggedIn = computed(() => authStore.token !== null)

let doors = []
let carStatus;
let carModel = null;
const route = useRoute()
let isLoading = ref(false); // 添加 isLoading 状态
let transcript = ref(''); // 添加 transcript 变量
let isRecording = ref(false); // 添加 isRecording 状态
let recognition = null; // 语音识别实例
import { ElMessage,ElMessageBox,ElLoading } from 'element-plus';
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
// 从 pinia 中获取模型
const currentGltf = modelStore.currentGltf;
// 初始化模型
onMounted( async ()=>{
  init()
  render()
  isLoading.value = true;
  window.addEventListener('resize', handleResize)
  if(!currentGltf){
    try {
      const gltf = await modelStore.loadModel('girl', '/glb/psylocke_fortnite.glb')
      carModel = gltf.scene;
      carModel.rotation.y = Math.PI * 0.7;
      carModel.traverse(obj => {
        obj.castShadow = true;
      });
      scene.add(carModel);
      isLoading.value = false;
    }catch (err){
      ElMessage.error('模型加载失败:', error);
      isLoading.value = false;
    }
  }else {

    // 克隆场景对象
    carModel = currentGltf.scene.clone();

    // 对克隆后的对象进行操作
    carModel.rotation.y = Math.PI * 0.7;
    carModel.traverse(obj => {
      obj.castShadow = true;
    });
    scene.add(carModel);

    // 标记加载完成
    isLoading.value = false;
  }
})

// 清理模型
onUnmounted(() => {
  if (renderId !== null) {
    cancelAnimationFrame(renderId);
  }
  // 清理右侧面板
  if (gui) {
    gui.destroy();
    gui = null;
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

    // 移除画布
    if (renderer) {
      document.body.removeChild(renderer.domElement); // 移除画布
      renderer.dispose();
      renderer = null;
    }
  }
})
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
let gui = null;
// 绘制右侧面板
function initGUI(){
  return [
    { label: "前面视角", action: carIn },
    { label: "后面视角", action: carOut },
    { label: "生成烟花", action: goFireworks }
  ];
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
}


let renderId = null
function render(time){
  // 动画
  renderer.render(scene, camera)
  renderId = requestAnimationFrame(render)
  TWEEN.update(time)
  controls.update()
}
function handleResize() {
  // camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  if (renderer){
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}


const boyClick = async (image) =>{
 if (image === 1){
   isLoading.value = true
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
   }
   carModel = null;
   try {
     const gltf = await modelStore.loadModel('boy', '/glb/business_girl.glb')
     carModel = gltf.scene;
     // console.log(carModel);
     carModel.rotation.y = Math.PI * 0.7;
     carModel.traverse(obj => {
       obj.castShadow = true;
     });
     scene.add(carModel);
     isLoading.value = false;
   }catch (err){
     ElMessage.error('模型加载失败:', error);
     isLoading.value = false;
   }
 }
}
const girlClick = async (image) =>{
  if (image === 2){
    isLoading.value = true
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
    }
    carModel = null;
    try {
      const gltf = await modelStore.loadModel('girl', '/glb/psylocke_fortnite.glb')
      carModel = gltf.scene;
      // console.log(carModel);
      carModel.rotation.y = Math.PI * 0.7;
      carModel.traverse(obj => {
        obj.castShadow = true;
      });
      scene.add(carModel);
      isLoading.value = false;
    }catch (err){
      ElMessage.error('模型加载失败:', error);
      isLoading.value = false;
    }
  }
}

// 前往互动页面
const goInter = () => {
  router.push('/Inter');
}
// 前往创建模型页面
const goCreate = () => {
  router.push('/generate');
}
const userInfo = computed(() => authStore.userInfo);
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/personal')
  } else if (command === 'logout') {
    ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
    ).then(() => {
      authStore.logout()
      window.location.reload()
    }).catch(() => {})
  }
}
//右侧箭头
const showRightPanel = ref(false)
const guiOptions = ref(initGUI());

//表单提交
const showPublishForm = ref(false)
const form = ref({
  title: ''
})

const handlePublish = async () => {
  // 校验
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }

  // 获取用户ID
  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = JSON.parse(userInfoStr)
  const params = {
    userId: userInfo.userId,
    personalName: userInfo.nickName,
    deptId:userInfo.deptId,
    title: form.value.title
  }


  // 发起请求
  try {
    const response = await submit(params)
    if (response.code === 200) {
      console.log(response)
      ElMessage.success(response.msg)
      // 清空表单
      form.value.title = ''
      showPublishForm.value = false
    } else {
      ElMessage.error(response.msg)
    }
  } catch (error) {
    ElMessage.error('网络异常', error)
  }
}

</script>
<template>
 <div>
   <el-loading v-if="isLoading" full-screen background="rgba(0, 0, 0, 0.7)" />
   <div class="user-profile" v-if="isLoggedIn">
     <el-dropdown @command="handleCommand" class="avatar-dropdown">
      <span class="avatar-trigger">
        <el-avatar :src="userInfo.avatar" :size="40" class="avatar"/>
      </span>
       <template #dropdown>
         <el-dropdown-menu class="custom-dropdown">
           <el-dropdown-item command="profile" divided>
             <div class="menu-item">
               <span class="icon el-icon-user"></span>
               个人资料
             </div>
           </el-dropdown-item>
           <el-dropdown-item command="logout" divided>
             <div class="menu-item warning">
               <span class="icon el-icon-switch-button"></span>
               退出登录
             </div>
           </el-dropdown-item>
         </el-dropdown-menu>
       </template>
     </el-dropdown>
   </div>

  <div class="home-header">
    <router-link to="/homepage" class="bilibili-home">
      <span>首页</span>
    </router-link>
  </div>

   <el-button
       class="publish-btn"
       @click="showPublishForm = true"
       icon="edit"
   >
     发布模型
   </el-button>

   <!-- 发布表单弹窗 -->
   <el-dialog
       v-model="showPublishForm"
       title="发布模型"
       width="400px"
       :close-on-click-modal="false"
   >
     <el-form @submit.prevent="handlePublish">
       <el-form-item label="模型标题">
         <el-input
             v-model="form.title"
             placeholder="给你的模型命名吧~"
             maxlength="50"
             show-word-limit
         />
       </el-form-item>

       <div class="dialog-footer">
         <el-button @click="showPublishForm = false">取消</el-button>
         <el-button type="primary" @click="handlePublish" :disabled="!form.title.trim()">
           确认发布
         </el-button>
       </div>
     </el-form>
   </el-dialog>


   <el-button
       class="right-panel-trigger"
       @click="showRightPanel = true"
   >
     <img src="/public/img/箭头.png" alt="展开面板" />
   </el-button>

   <!-- 新增侧边面板 -->
   <el-drawer
       v-model="showRightPanel"
       direction="rtl"
       size="300px"
       :with-header="false"
       class="right-panel-drawer"
   >
     <div class="panel-content">
       <h3>视角控制</h3>
       <div class="gui-buttons">
         <el-button
             v-for="(item, index) in guiOptions"
             :key="index"
             @click="item.action"
             block        style="margin-bottom: 8px"
         >
           {{ item.label }}
         </el-button>
       </div>
    </div>
   </el-drawer>
   <el-button
       type="primary"
       style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);"
       @click="goCreate">
     新建角色
   </el-button>
   <el-button type="info" style="position: absolute;bottom: 16px;right: 16px; " @click="drawer = true">
     更多角色
   </el-button>

   <el-drawer v-model="drawer" title="I am the title" :with-header="false">
     <el-tabs
         v-model="activeName"
         type="card"
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
           <el-button type="primary" @click="goInter">互动</el-button>
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
           <el-button type="primary" @click="goInter">互动</el-button>
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
           <el-button type="primary" @click="goInter">互动</el-button>
         </div>
       </el-tab-pane>
       <el-tab-pane label="创建角色" name="fourth">
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
.publish-btn {
  width: 80px;
  position: fixed;
  right: 20px;
  top: 16px;
  z-index: 999;
  background-color: #409EFF;
  color: white;
}

.publish-btn:hover {
  background-color: #228df9;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.panel-content h3 {
  margin-top: 0;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
  color: #333;
}

.gui-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gui-buttons .el-button {
  width: 100%;
  text-align: center;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f5f7fa;
  color: #333;
  transition: all 0.2s ease;
}

.gui-buttons .el-button:hover {
  background-color: #eef1f6;
  transform: translateX(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}


.right-panel-trigger {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease-in-out;
  z-index: 999;
  border: 1px solid #e4e4e4;
}

.right-panel-trigger:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.right-panel-trigger img {
  width: 24px;
  height: 24px;
  display: block;
  margin: 12px auto;
  transition: opacity 0.2s ease;
}

.right-panel-trigger:hover img {
  opacity: 0.9;
}

.avatar-dropdown {
  position: absolute;
  display: inline-block;
  cursor: pointer;
}

.custom-dropdown {
  min-width: 100px;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  background: #fff;
  padding: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  transition: background 0.3s;
}

.menu-item.warning {
  color: #f56c6c;
}

.menu-item:hover {
  background: #f5f7fa;
}

.icon {
  font-size: 18px;
}

/* 头像容器样式 */
.avatar-trigger {
  display: inline-block;
  position: absolute;
  margin: 16px;
}

.avatar {
  transition: transform 0.3s;
}

.avatar-trigger:hover .avatar {
  transform: rotate(360deg);
}

.home-header {
  position: absolute;
  top: 0;
  left: 0;
  padding: 16px;
  z-index: 999;
}

.bilibili-home {
  display: flex;
  align-items: center;
  color: #00a1d6;
  font-weight: bold;
  text-decoration: none;
  transition: opacity 0.3s;
}

.bilibili-home:hover {
  opacity: 0.8;
}
</style>
