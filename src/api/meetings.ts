import API from './axios';

export const scheduleMeetingAPI = (data: object) => API.post('/api/meetings', data);
export const getMeetingsAPI = () => API.get('/api/meetings');
export const getMeetingByIdAPI = (id: string) => API.get(`/api/meetings/${id}`);
export const acceptMeetingAPI = (id: string) => API.put(`/api/meetings/${id}/accept`);
export const rejectMeetingAPI = (id: string) => API.put(`/api/meetings/${id}/reject`);
export const cancelMeetingAPI = (id: string) => API.delete(`/api/meetings/${id}`);
