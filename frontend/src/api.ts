import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export const startRide = () => api.post('/control/start');
export const pauseRide = () => api.post('/control/pause');
export const resumeRide = () => api.post('/control/resume');
export const stopRide = () => api.post('/control/stop');

export const getHistory = () => api.get('/history').then(r => r.data);
export const getRide = (id: number) => api.get(`/rides/${id}`).then(r => r.data);

export const uploadGPX = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post('/import/gpx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}
