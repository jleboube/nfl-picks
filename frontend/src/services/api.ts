import axios from 'axios';
import { User, Game, Pick, LeaderboardEntry } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const gamesAPI = {
  getWeeklyGames: async (week: number): Promise<Game[]> => {
    const response = await api.get(`/games/week/${week}`);
    return response.data;
  },
  
  getCurrentWeek: async (): Promise<number> => {
    const response = await api.get('/games/current-week');
    return response.data.week;
  },
};

export const picksAPI = {
  getUserPicks: async (week: number): Promise<Pick[]> => {
    const response = await api.get(`/picks/week/${week}`);
    return response.data;
  },
  
  submitPicks: async (picks: Omit<Pick, 'id' | 'userId' | 'submittedAt' | 'isCorrect'>[]): Promise<void> => {
    await api.post('/picks', { picks });
  },
  
  getPicksDeadline: async (): Promise<{ deadline: string; isOpen: boolean }> => {
    const response = await api.get('/picks/deadline');
    return response.data;
  },
};

export const leaderboardAPI = {
  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
  
  getWeeklyLeaderboard: async (week: number): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/leaderboard/week/${week}`);
    return response.data;
  },
};