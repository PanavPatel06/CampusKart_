import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const uploadFile = (formData) => API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

export const createOrder = (orderData) => API.post('/orders', orderData);



export const getVendorOrders = () => API.get('/orders/vendor');

export const getMyOrders = () => API.get('/orders/myorders');

export const getVendors = () => API.get('/vendors');

export const addProduct = (productData) => API.post('/products', productData);

export const getAllProducts = () => API.get('/products');

export const getAvailableOrders = (location) => API.get(`/orders/delivery/available?location=${location}`);

export const getMyDeliveries = () => API.get('/orders/delivery/my');

export const getAllOrders = () => API.get('/orders/admin/all');

export const getLocations = () => API.get('/locations');
export const addLocation = (name) => API.post('/locations', { name });
export const deleteLocation = (id) => API.delete(`/locations/${id}`);

export const updateOrderStatus = (orderId, status, otp) => API.put(`/orders/${orderId}/status`, { status, otp });

// Wallet & Commission
export const addFunds = (userId, amount) => API.post('/wallet/add-funds', { userId, amount });
export const getMyWallet = () => API.get('/wallet/my-wallet');
export const getSystemEarnings = () => API.get('/wallet/earnings');
export const getCommissionRates = () => API.get('/wallet/commission');
export const updateCommissionRates = (rates) => API.put('/wallet/commission', rates);
export const searchUsers = (query) => API.get(`/wallet/users?search=${query}`);

export default API;
