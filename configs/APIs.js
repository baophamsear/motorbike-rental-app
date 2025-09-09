import axios from 'axios';

// const BASE_URL = 'https://motorbike-rental-23.onrender.com/api';
const BASE_URL = 'http://localhost:8080/api';


export const endpoints = {
    'login' : '/auth/login',
    'register': '/auth/register',
    'send-code': '/auth/send-code',
    'verify-code': '/auth/verify-code',
    'brands': '/brands',
    'locations': '/locations',
    'motorbikes': '/bikes',
    'myMotor': '/bikes/my',
    'myContracts': '/contracts/mine',
    'updateContract': (id) => `/contracts/${id}/update`,
    'activeContracts': '/contracts/active',
    'createRental': '/rentals',
    'createVNPay': '/vnpay/create-payment',
    'createMomo': '/momo/create-payment',
    'momoCallback': '/momo/callback',
    'getMyRental': '/rentals/my',
    'updateActiveRental': (id) => `/rentals/${id}`,
    'getNearbyBikes': '/contracts/nearby',
    'getPendingRentals': '/rentals/pending',
    'getConfirmedRentals': '/rentals/confirmed',
    'getActiveRentals': '/rentals/active',
    'getCompletedRentals': '/rentals/completed',
    'getAllRentals': '/rentals/all',
    'updateStatusRental': (id) => `/rentals/${id}/status`,
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
            // 'Content-Type': 'application/json',  // Đảm bảo gửi dữ liệu ở định dạng JSON
        }
    });
};

export const authApis2 = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',  // Đảm bảo gửi dữ liệu ở định dạng JSON
        }
    });
};