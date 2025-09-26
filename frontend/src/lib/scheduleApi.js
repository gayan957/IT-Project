import api from '../lib/api';
import { useEffect, useState } from 'react';

export function useUserSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/schedules')
      .then(res => setSchedules(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { schedules, loading, error };
}

export async function createUserSchedule(data) {
  const res = await api.post('/api/schedules', data);
  return res.data;
}

export async function getUserSchedules() {
  const res = await api.get('/api/schedules');
  return res.data;
}

export async function updateScheduleStatus(id, status) {
  const res = await api.patch(`/api/schedules/${id}/status`, { status });
  return res.data;
}

export async function updateSchedule(id, data) {
  const res = await api.put(`/api/schedules/${id}`, data);
  return res.data;
}

export async function deleteSchedule(id) {
  const res = await api.delete(`/api/schedules/${id}`);
  return res.data;
}

export async function collectSchedule(collectionData) {
  const res = await api.post('/api/agent-schedules/collect', collectionData);
  return res.data;
}

export async function getScheduleForCollection(scheduleId) {
  const res = await api.get(`/api/agent-schedules/schedule/${scheduleId}`);
  return res.data;
}

export async function getSchedulesForMap() {
  const res = await api.get('/api/agent-schedules/map');
  return res.data;
}

export const scheduleApi = {
  createUserSchedule,
  getUserSchedules,
  updateScheduleStatus,
  updateSchedule,
  deleteSchedule,
  collectSchedule,
  getScheduleForCollection,
  getSchedulesForMap
};
