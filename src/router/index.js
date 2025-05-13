
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/user.js';
const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/login',
        name: '用户登录',
        component: () => import("@/components/UserManagement/index.vue"),
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: '用户注册',
        component: () => import('@/components/register/index.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/home',
        name: '用户主页',
        component: () => import("@/components/home/home.vue"),
        meta: { requiresAuth: false },
    },
    {
        path: '/fireworks',
        name: '生成烟花',
        component: () => import("@/components/fireworks.vue"),
        meta: { requiresAuth: true }  // 需要认证的路由
    },
    {
        path: '/personal',
        name: '个人信息',
        component: () => import("@/components/home/personal.vue"),
        meta: { requiresAuth: true }
    },
    {
        path: '/homepage',
        name: '首页',
        component: () => import('@/components/home/homePage.vue')
    },
    {
        path: '/generate',
        name: '创建模型',
        component: () => import("@/components/Generate/index.vue"),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'upload',
                name: '上传模型',
                component: () => import("@/components/Generate/upload.vue"),
                meta: { requiresAuth: true }  // 需要认证的路由
            }
        ]
    },
    {
        path: '/inter',
        name: '虚拟人互动',
        component: () => import("@/components/Interaction/index.vue"),
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import("@/components/error/index.vue")
    }


]


const router = createRouter({
    history: createWebHistory(),
    routes
})
// 全局前置守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth) {
        if (!authStore.token || authStore.isTokenTime()) {
            authStore.logout()
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            });
        } else {
            next();
        }
    } else {
        next();
    }
})

export default router
