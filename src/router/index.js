
import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {
        path: '/',
        name: '汽车模型',
        component: ()=>import("@/components/Car.vue")
    },
    {
        path: '/Car',
        name: '虚拟人生成',
        component: ()=>import("@/components/Car.vue")
    },
    {
        path:'/fireworks',
        name:'生成烟花',
        component: ()=>import("@/components/fireworks.vue"),
    },
    {
        path:'/Inter',
        name:'虚拟人互动',
        component: ()=>import("@/components/Interaction/index.vue"),
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import("@/components/Car.vue")
    }


]


const router = createRouter({
    history: createWebHistory(),
    routes
})
// // 导航守卫
// router.beforeEach((to, from, next) => {
//     if (to.name === '虚拟人生成') {
//         if (!to.meta.visited) {
//             to.meta.visited = true;
//             console.log('First entry to the Car page');
//         } else {
//             console.log('Returning to the Car page');
//         }
//     }
//     // console.log(to.meta.visited)
//     next();
// })
export default router
