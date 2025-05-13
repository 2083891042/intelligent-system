import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token'),
        userInfo: JSON.parse(localStorage.getItem('userInfo')), // 初始化用户信息,
        tokenTime: localStorage.getItem('tokenTime') ? parseInt(localStorage.getItem('tokenTime')) : null
  }),
    actions: {
        login(token) {
            this.token = token; // 存储到 state
            localStorage.setItem('token', token); // 同步到 localStorage
            //设置token时间
            this.tokenTime = new Date().getTime() + 24 * 60 * 60 * 1000;
            localStorage.setItem('tokenTime', this.tokenTime);
        },
        UserInfo(userInfo) {
            this.userInfo = userInfo
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        },
        logout() {
            this.token = null;
            this.userInfo = null;
            this.tokenTime = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('tokenTime');
        },
        isTokenTime(){
            if (!this.tokenTime) return true;
            return new Date().getTime() > this.tokenTime;
        }
    }
});

