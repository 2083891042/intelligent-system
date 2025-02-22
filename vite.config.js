import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  // define:{
  //   __VUE_PROD_DEVTOOLS__: false
  // },
  assetsInclude: ['**/*.glb'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:{
    host:'0.0.0.0',
    port: 5173, // 前端端口号
    proxy: {
      // '/text/from': {
      //   target: 'http://localhost:80', // 后端服务的实际地址
      //   changeOrigin: true,
      //   // rewrite: (path) => path.replace(/^\/text\/from\/list/, ''), // 重写路径，去掉 /text/from 前缀
      // },
      // 前端地址为localhost:5173
      // 通过前端代理变成了当你请求/text/from/list时，也就是localhost:5173/text/from/list会变成localhost:80/text/from/list
      // 而下面的rewrite 就是去掉/text/from/list前缀，也就是localhost:5173/text/from/list会变成localhost:80/ 然后就会跳转到登录页面
      // 后端地址为localhost:80
      '/tts':{
        target: 'http://192.168.110.202:9966', // 后端服务的实际地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/list/, ''), // 重写路径，去掉 /text/from 前缀
      },
      '/completions':{
        target: 'https://open.bigmodel.cn/api/paas/v4/chat', // 后端服务的实际地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/list/, ''), // 重写路径，去掉 /text/from 前缀
      },
    },
  }
})
