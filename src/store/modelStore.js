import { defineStore } from 'pinia';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ElMessage } from 'element-plus';
export const useModelStore = defineStore('model', {
    state: () => ({
        models: {},
        currentModelName:'', // 当前模型名称,
        currentGltf:null //当前模型的Gltf对象
    }),
    actions: {
        async loadModel(modelName,modelPath) {
            const loader = new GLTFLoader();
            try {
                const gltf = await new Promise((resolve, reject) => {
                    loader.load(
                        modelPath, // 替换为你的模型路径
                        (gltf) => resolve(gltf), // 加载成功
                        (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`), // 进度
                        (error) => reject(error) // 加载失败
                    );
                });
                this.models[modelName] = gltf.scene;
                this.currentModelName = modelName
                this.currentGltf = gltf
                return gltf;
            } catch (error) {
                ElMessage.error('加载模型失败')
            }
        },
        async loadAllModels() {
            await Promise.all([
                this.loadModel('car', '/assets/glb/chineseGirl.glb'),
                this.loadModel('house', '/assets/glb/business_girl.glb'),
                // 添加更多模型
            ]);
        },
    },
});



