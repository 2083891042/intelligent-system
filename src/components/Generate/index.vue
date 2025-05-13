<script setup>
import { Scene, Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight, PlaneGeometry, MeshPhysicalMaterial, SpotLight, CylinderGeometry, DoubleSide, PointLight,TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import TWEEN from '@tweenjs/tween.js';
import {ref,onMounted,onUnmounted} from "vue";
import {useModelStore} from "@/store/modelStore.js";
import router from "@/router/index.js";
import Upload from '@/components/Generate/upload.vue';
const direction = ref('ltr')
// 创建角色的抽屉
const createDrawer = ref(false)
// 创建角色的名字
const createName = ref('first')
const handleClick = () => {
  console.log('click tab', createName.value)
}
let scene, camera, renderer, controls;
let gltf;
const modelStore = useModelStore();
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
let renderId = null
function render(time){
  // 动画
  renderer.render(scene, camera)
  renderId = requestAnimationFrame(render)
  TWEEN.update(time)
  controls.update()
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

function handleResize() {
  // camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
}
// 监听子组件传递的文件数据
const handleFileUploaded = (arrayBuffer) => {
  if (carModel) {
    scene.remove(carModel);
  }
  loadModelFromBinary(arrayBuffer);
};
const loadModelFromBinary = (arrayBuffer) => {
  console.log(arrayBuffer)
  // const loader = new GLTFLoader();
  // loader.load(arrayBuffer, '', (gltf) => {
  //   carModel = gltf.scene;
  //   console.log(ca)
  //   carModel.rotation.y = Math.PI;
  //   carModel.traverse(obj => {
  //     obj.castShadow = true;
  //   });
  //   scene.add(carModel);
  // }, undefined, (error) => {
  //   console.error('An error happened', error);
  //   ElMessage.error('模型加载失败:', error);
  // });
};


let carModel;
onMounted(()=>{
  init()
  render()
  gltf = modelStore.currentGltf
  window.addEventListener('resize', handleResize)
  if (gltf && gltf.scene) {
    // 克隆场景对象
    carModel = gltf.scene.clone();
    // 对克隆后的对象进行操作
    carModel.rotation.y = Math.PI;
    carModel.traverse(obj => {
      obj.castShadow = true;
    });
    scene.add(carModel);
  }
})
onUnmounted(()=>{
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
// 返回
const form = () =>{
  router.push('/car')
}
const updateHeight = () => {
  if (carModel){
    /**
     * 1.找到模型腿的名称
     * 2.循环缩放腿的y的长度
     * 3.重新渲染
     */
    // console.log('111')
    carModel.traverse((child) => {
        child.parent.scale.set(heightScale.value, heightScale.value, heightScale.value);
    });
    render()
  }
}
const textureLoader = new TextureLoader()

const hairstyles = [
  {
    id: 1,
    description: "短波波头",
    color: "Blonde",
    colorCode: "#FFFF00" // 黄色
  },
  {
    id: 2,
    description: "长卷发",
    color: "Brown",
    colorCode: "#A52A2A" // 棕色
  },
  {
    id: 3,
    description: "波波头",
    color: "Black",
    colorCode: "#000000" // 黑色
  },
  {
    id: 4,
    description: "卷发",
    color: "Red",
    colorCode: "#FF0000" // 红色
  },
  {
    id: 5,
    description: "直发",
    color: "Gray",
    colorCode: "#808080" // 灰色
  }
];

const Click = (id) => {
  //加载纹理
  const texture = textureLoader.load('/img/StuccoRoughCast001_COL_2K_METALNESS.png')
  console.log(texture)
  if (gltf.scene){
    console.log(carModel)
    carModel.traverse((child) => {
      if (child.name === 'Object_6' && child.isMesh){
        console.log(child)
        if ('map' in child.material){
          console.log('1111')
          child.material.map = texture;
          child.material.needsUpdate = true;

          renderer.render(scene,camera)
        }
        scene.add(carModel)
      }
    });
  }
}

</script>

<template>
<div>
  <div>
    <el-button type="info" @click="form" style="position: absolute;top: 26px;left: 26px" >返回首页</el-button>
  </div>
  <el-button
      type="primary"
      style="position: absolute;bottom: 26px;left: 26px;"
      @click="createDrawer = true">
    创建模型
  </el-button>
  <el-drawer
      v-model="createDrawer"
      :direction="direction"
      :with-header="false"
  >
    <el-tabs v-model="createName"
             type="card"
             @tab-click="handleClick">
      <el-tab-pane label="头发" name="first">
        <div class="image-grid">
          <div v-for="(image) in hairstyles" :key="image.id" class="image-container">
            <div @click="Click(image.id)">
<!--              <img-->
<!--                  :alt="image.description"-->
<!--              />-->
              <p>{{ image.description }}</p>
            </div>
          </div>
          <el-button type="primary">互动</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="发型" name="second">
<!--        发型的名称为Object_6-->
      </el-tab-pane>
      <el-tab-pane label="衣服" name="second">
<!--        衣服为Object_12-->
      </el-tab-pane>
      <el-tab-pane label="上传模型" name="fourth">
        <Upload @file-uploaded="handleFileUploaded" />
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</div>
</template>

<style scoped>

</style>
