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

//登录
export function Login(data) {
    return request({
        url: '/login',
        method: 'post',
        data,
        headers:{'Content-Type': 'application/x-www-form-urlencoded'}
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