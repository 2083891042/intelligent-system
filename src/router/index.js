
import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {
        path: '/',
        name: '汽车模型',
        component: import("@/components/Car.vue")
    },
    {
        path: '/Car',
        name: '汽车模型',
        component: ()=>import("@/components/Car.vue"),
        // meta: { requiresAuth: true }
    },
    {
        path:'/fireworks',
        name:'生成烟花',
        component: ()=>import("@/components/fireworks.vue"),
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

export default router
