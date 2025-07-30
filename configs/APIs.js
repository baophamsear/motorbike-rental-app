import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';


export const endpoints = {

}

export default axios.create({
    baseURL: BASE_URL
});

// Axios instance cho các yêu cầu có xác thực (có token)
export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',  // Đảm bảo gửi dữ liệu ở định dạng JSON
        }
    });
};