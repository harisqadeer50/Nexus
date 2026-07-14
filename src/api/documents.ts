import API from './axios';

export const uploadDocumentAPI = (formData: FormData) =>
  API.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getDocumentsAPI = () => API.get('/api/documents');
export const getDocumentByIdAPI = (id: string) => API.get(`/api/documents/${id}`);
export const deleteDocumentAPI = (id: string) => API.delete(`/api/documents/${id}`);
export const signDocumentAPI = (id: string, signature: string) =>
  API.put(`/api/documents/${id}/sign`, { signature });
export const shareDocumentAPI = (id: string, userId: string) =>
  API.put(`/api/documents/${id}/share`, { userId });
