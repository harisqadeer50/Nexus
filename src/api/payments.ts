import API from './axios';

export const depositAPI = (data: object) => API.post('/api/payments/deposit', data);
export const withdrawAPI = (data: object) => API.post('/api/payments/withdraw', data);
export const transferAPI = (data: object) => API.post('/api/payments/transfer', data);
export const getTransactionsAPI = () => API.get('/api/payments/transactions');
export const getBalanceAPI = () => API.get('/api/payments/balance');
