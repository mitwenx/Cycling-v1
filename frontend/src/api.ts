import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export const startRide = () => api.post('/control/start');
export const pauseRide = () => api.post('/control/pause');
export const resumeRide = () => api.post('/control/resume');
export const stopRide = () => api.post('/control/stop');

export const getHistory = () => api.get('/history').then(r => r.data);
export const getRide = (id: number) => api.get(`/rides/${id}`).then(r => r.data);

export const saveRoute = (data: { name: string; distance_km: number; elevation_m: number; points: number[][] }) => 
    api.post('/routes', data).then(r => r.data);
export const getRoutes = () => api.get('/routes').then(r => r.data);
export const deleteRoute = (id: number) => api.delete(`/routes/${id}`).then(r => r.data);

export const uploadGPX = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post('/import/gpx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

export const getStatistics = () => api.get('/statistics').then(r => r.data);
export const exportText = (rideIds: number[]) => api.post('/export/text', { ride_ids: rideIds }, { responseType: 'blob' }).then(r => r.data);
