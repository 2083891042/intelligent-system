// api.js
import request from './request';

// 获取图片数据
export function fetchImages() {
    return request({
        url: '/text/from/getImages', // 相对路径
        method: 'get',
    });
}

// 提交图片数据
export function getAnimation() {
    return request({
        url: '/text/from/getAnimation', // 相对路径
        method: 'get',
    });
}


//上传
export function upload(data) {
    return request({
        url: '/text/from/upload',
        method: 'post',
        data,
        headers:{'Content-Type': 'multipart/form-data'}
    });
}

// 验证码登录
export function loginByCaptcha (data){
    return request({
        url: '/user/applyUser/loginByCaptcha',
        method: 'post',
        data,
    });
}

// 账号密码登录
export function login(data){
    return request({
        url: '/user/applyUser/login',
        method: 'post',
        data,
    });
}

// 获取验证码
export function sendCaptcha(username){
    return request({
        url: '/user/applyUser/sendCaptcha',
        method: 'get',
        params: {username}
    });
}

//注册
export function register(data){
    return request({
        url: '/user/applyUser/register',
        method: 'post',
        data,
    });
}

//提交
export function submit(data){
    return request({
        url: '/model/modelConfig',
        method: 'post',
        data:data,
        headers: {
            'Content-Type': 'application/json',
        }
    })
}

// 获取部门列表
export function getDeptList(query) {
    return request({
        url: '/system/dept/list',
        method: 'get',
        params: query
    })
}
// 修改个人信息
export function editApplyUser(data) {
    return request({
        url: '/user/applyUser',
        method: 'put',
        data,
    });
}
