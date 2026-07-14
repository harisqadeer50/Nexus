import API from './axios';

export const getUserByIdAPI = (id: string) => API.get(`/api/users/${id}`);
export const getAllEntrepreneursAPI = () => API.get('/api/users/entrepreneurs');
export const getAllInvestorsAPI = () => API.get('/api/users/investors');
export const updateProfileAPI = (data: object) => API.put('/api/users/profile', data);