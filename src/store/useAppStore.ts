import { create } from 'zustand';
import {
  User,
  DashboardStats,
  TrendData,
  AnalysisTask,
  DetectorConfig,
  NoiseModel,
  Alert,
  EstimationResult,
  ApprovalRecord,
  Recommendation,
  ExportTask,
  TaskStatus,
  AlertLevel,
  AdjustmentLog,
} from '@shared/types';

interface AppState {
  user: User | null;
  dashboardStats: DashboardStats | null;
  trendData: TrendData | null;
  tasks: AnalysisTask[];
  currentTask: AnalysisTask | null;
  currentResult: EstimationResult | null;
  taskApprovals: ApprovalRecord[];
  taskAlerts: Alert[];
  taskAdjustmentLogs: AdjustmentLog[];
  currentDetector: DetectorConfig | null;
  currentNoiseModel: NoiseModel | null;
  detectors: DetectorConfig[];
  noiseModels: NoiseModel[];
  alerts: Alert[];
  pendingApprovals: AnalysisTask[];
  recommendations: Recommendation | null;
  exportTasks: ExportTask[];
  qualityPaused: boolean;
  loading: Record<string, boolean>;

  setUser: (user: User | null) => void;
  fetchDashboardStats: () => Promise<void>;
  fetchTrendData: (days?: number) => Promise<void>;
  fetchTasks: (filters?: { status?: TaskStatus; detectorConfigId?: string }) => Promise<void>;
  fetchTaskDetail: (id: string) => Promise<void>;
  createTask: (data: {
    name: string;
    detectorConfigId: string;
    noiseModelId: string;
    signalSource: {
      type: string;
      mass1: number;
      mass2: number;
      spin1: number;
      spin2: number;
      distance: number;
      inclination: number;
    };
  }) => Promise<AnalysisTask | null>;
  fetchDetectors: () => Promise<void>;
  fetchNoiseModels: () => Promise<void>;
  fetchAlerts: (filters?: { level?: AlertLevel; status?: string }) => Promise<void>;
  reviewAlert: (id: string, data: {
    reviewedBy: string;
    reviewComment: string;
    status: string;
    adjustmentType?: string;
    newParams?: Record<string, unknown>;
  }) => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  approveVerification: (taskId: string, comment: string) => Promise<boolean>;
  rejectVerification: (taskId: string, comment: string) => Promise<boolean>;
  approveConfirmation: (taskId: string, comment: string) => Promise<boolean>;
  rejectConfirmation: (taskId: string, comment: string) => Promise<boolean>;
  fetchRecommendations: (detectorConfigId?: string, signalType?: string) => Promise<void>;
  fetchExportTasks: () => Promise<void>;
  createExport: (data: {
    detectorConfigId: string;
    noiseModelVersion: string;
    timeWindowStart: string;
    timeWindowEnd: string;
    exportType: 'response_data' | 'estimation_results' | 'all';
  }) => Promise<ExportTask | null>;
  fetchQualityStatus: () => Promise<void>;
  resumeQuality: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
}

const fetchApi = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  dashboardStats: null,
  trendData: null,
  tasks: [],
  currentTask: null,
  currentResult: null,
  taskApprovals: [],
  taskAlerts: [],
  taskAdjustmentLogs: [],
  currentDetector: null,
  currentNoiseModel: null,
  detectors: [],
  noiseModels: [],
  alerts: [],
  pendingApprovals: [],
  recommendations: null,
  exportTasks: [],
  qualityPaused: false,
  loading: {},

  setUser: (user) => set({ user }),

  login: async (username, password) => {
    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.success) {
        set({ user: data.user });
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchDashboardStats: async () => {
    set({ loading: { ...get().loading, dashboard: true } });
    try {
      const data = await fetchApi('/api/stats/dashboard');
      set({ dashboardStats: data, loading: { ...get().loading, dashboard: false } });
    } catch {
      set({ loading: { ...get().loading, dashboard: false } });
    }
  },

  fetchTrendData: async (days = 30) => {
    set({ loading: { ...get().loading, trends: true } });
    try {
      const data = await fetchApi(`/api/stats/trends?days=${days}`);
      set({ trendData: data, loading: { ...get().loading, trends: false } });
    } catch {
      set({ loading: { ...get().loading, trends: false } });
    }
  },

  fetchTasks: async (filters) => {
    set({ loading: { ...get().loading, tasks: true } });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.detectorConfigId) params.set('detectorConfigId', filters.detectorConfigId);
      const data = await fetchApi(`/api/tasks?${params.toString()}`);
      set({ tasks: data, loading: { ...get().loading, tasks: false } });
    } catch {
      set({ loading: { ...get().loading, tasks: false } });
    }
  },

  fetchTaskDetail: async (id) => {
    set({ loading: { ...get().loading, taskDetail: true } });
    try {
      const data = await fetchApi(`/api/tasks/${id}`);
      set({
        currentTask: data.task,
        currentResult: data.result,
        taskApprovals: data.approvals || [],
        taskAlerts: data.alerts || [],
        taskAdjustmentLogs: data.adjustmentLogs || [],
        currentDetector: data.detector,
        currentNoiseModel: data.noiseModel,
        loading: { ...get().loading, taskDetail: false },
      });
    } catch {
      set({ loading: { ...get().loading, taskDetail: false } });
    }
  },

  createTask: async (data) => {
    try {
      const result = await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...data, createdBy: get().user?.id || 'u1' }),
      });
      get().fetchTasks();
      return result;
    } catch {
      return null;
    }
  },

  fetchDetectors: async () => {
    try {
      const data = await fetchApi('/api/detectors');
      set({ detectors: data });
    } catch {
      // ignore
    }
  },

  fetchNoiseModels: async () => {
    try {
      const data = await fetchApi('/api/noise-models');
      set({ noiseModels: data });
    } catch {
      // ignore
    }
  },

  fetchAlerts: async (filters) => {
    set({ loading: { ...get().loading, alerts: true } });
    try {
      const params = new URLSearchParams();
      if (filters?.level) params.set('level', filters.level);
      if (filters?.status) params.set('status', filters.status);
      const data = await fetchApi(`/api/alerts?${params.toString()}`);
      set({ alerts: data, loading: { ...get().loading, alerts: false } });
    } catch {
      set({ loading: { ...get().loading, alerts: false } });
    }
  },

  reviewAlert: async (id, data) => {
    try {
      await fetchApi(`/api/alerts/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      get().fetchAlerts();
    } catch {
      // ignore
    }
  },

  fetchPendingApprovals: async () => {
    try {
      const data = await fetchApi('/api/approvals/pending');
      set({ pendingApprovals: data });
    } catch {
      // ignore
    }
  },

  approveVerification: async (taskId, comment) => {
    try {
      await fetchApi(`/api/approvals/${taskId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approver: get().user?.id || 'u2', comment }),
      });
      get().fetchPendingApprovals();
      get().fetchTaskDetail(taskId);
      return true;
    } catch {
      return false;
    }
  },

  rejectVerification: async (taskId, comment) => {
    try {
      await fetchApi(`/api/approvals/${taskId}/reject-verify`, {
        method: 'POST',
        body: JSON.stringify({ approver: get().user?.id || 'u2', comment }),
      });
      get().fetchPendingApprovals();
      return true;
    } catch {
      return false;
    }
  },

  approveConfirmation: async (taskId, comment) => {
    try {
      await fetchApi(`/api/approvals/${taskId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ approver: get().user?.id || 'u3', comment }),
      });
      get().fetchPendingApprovals();
      get().fetchTaskDetail(taskId);
      return true;
    } catch {
      return false;
    }
  },

  rejectConfirmation: async (taskId, comment) => {
    try {
      await fetchApi(`/api/approvals/${taskId}/reject-confirm`, {
        method: 'POST',
        body: JSON.stringify({ approver: get().user?.id || 'u3', comment }),
      });
      get().fetchPendingApprovals();
      return true;
    } catch {
      return false;
    }
  },

  fetchRecommendations: async (detectorConfigId, signalType) => {
    try {
      const params = new URLSearchParams();
      if (detectorConfigId) params.set('detectorConfigId', detectorConfigId);
      if (signalType) params.set('signalType', signalType);
      const data = await fetchApi(`/api/recommend/filters?${params.toString()}`);
      set({ recommendations: data });
    } catch {
      // ignore
    }
  },

  fetchExportTasks: async () => {
    try {
      const data = await fetchApi('/api/export');
      set({ exportTasks: data });
    } catch {
      // ignore
    }
  },

  createExport: async (data) => {
    try {
      const result = await fetchApi('/api/export', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      get().fetchExportTasks();
      return result;
    } catch {
      return null;
    }
  },

  fetchQualityStatus: async () => {
    try {
      const data = await fetchApi('/api/quality/status');
      set({ qualityPaused: data.isPaused });
    } catch {
      // ignore
    }
  },

  resumeQuality: async () => {
    try {
      await fetchApi('/api/quality/resume', { method: 'POST' });
      set({ qualityPaused: false });
    } catch {
      // ignore
    }
  },
}));
