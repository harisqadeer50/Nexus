import API from './axios';

export const registerAPI = (data: object) => API.post('/api/auth/register', data);
export const loginAPI = (data: object) => API.post('/api/auth/login', data);
export const getMeAPI = () => API.get('/api/auth/me');
