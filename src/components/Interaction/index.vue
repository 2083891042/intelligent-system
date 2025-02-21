<script setup>

import {useModelStore} from "@/store/modelStore.js";
import {onMounted, toRefs} from "vue";
const modelStore = useModelStore();
let gltf = null;
let carModel = null;



onMounted(()=>{
  gltf = modelStore.currentGltf;
  carModel = toRefs(gltf.scene);
})



</script>

<template>
</template>



<style scoped>

</style>