import axios from 'axios';
import type { FlowConfig, FlowStatus, FlowEvent, InteropReport, ConfigOptions } from '../types';

const DEFAULT_API_BASE = import.meta.env.PROD
  ? 'https://inji-playground-backend.onrender.com/api'
  : 'http://localhost:3000/api';

export const API_BASE = import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE;

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getConfigOptions: async (): Promise<ConfigOptions> => {
    const res = await apiClient.get<ConfigOptions>('/config/options');
    return res.data;
  },

  createFlow: async (config: FlowConfig): Promise<{ flowId: string; error?: string }> => {
    const res = await apiClient.post<{ flowId: string; error?: string }>('/flows', config);
    return res.data;
  },

  getFlow: async (flowId: string): Promise<FlowStatus> => {
    const res = await apiClient.get<FlowStatus>(`/flows/${flowId}`);
    return res.data;
  },

  getFlowEvents: async (flowId: string): Promise<{ events: FlowEvent[] }> => {
    const res = await apiClient.get<{ events: FlowEvent[] }>(`/flows/${flowId}/events`);
    return res.data;
  },

  advanceFlow: async (flowId: string): Promise<{ status: string }> => {
    const res = await apiClient.post<{ status: string }>(`/flows/${flowId}/advance`);
    return res.data;
  },

  getFlowReport: async (flowId: string): Promise<InteropReport> => {
    const res = await apiClient.get<InteropReport>(`/flows/${flowId}/report`);
    return res.data;
  },

  getReports: async (): Promise<InteropReport[]> => {
    const res = await apiClient.get<InteropReport[]>('/reports');
    return res.data;
  },

  getStats: async (): Promise<any> => {
    const res = await apiClient.get<any>('/reports/stats');
    return res.data;
  },
};
