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
