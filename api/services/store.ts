import {
  AnalysisTask,
  DetectorConfig,
  NoiseModel,
  Alert,
  ApprovalRecord,
  User,
  DashboardStats,
  TrendData,
  EstimationResult,
  UserRole,
  TaskStatus,
  AlertLevel,
  Recommendation,
  ExportTask,
  AdjustmentLog,
  UploadedFileInfo,
  AnnouncementPushRecord,
} from '../../shared/types';

class DataStore {
  private users: User[] = [];
  private detectorConfigs: DetectorConfig[] = [];
  private noiseModels: NoiseModel[] = [];
  private tasks: AnalysisTask[] = [];
  private alerts: Alert[] = [];
  private approvals: ApprovalRecord[] = [];
  private results: Map<string, EstimationResult> = new Map();
  private trendData: TrendData | null = null;
  private adjustmentLogs: AdjustmentLog[] = [];
  private exportTasks: ExportTask[] = [];
  private qualityPaused = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.users = [
      { id: 'u1', username: 'analyst', role: UserRole.DATA_ANALYST, email: 'analyst@gwlab.com', name: '张分析' },
      { id: 'u2', username: 'verifier', role: UserRole.DATA_VERIFIER, email: 'verifier@gwlab.com', name: '李验证' },
      { id: 'u3', username: 'lead', role: UserRole.PROJECT_LEAD, email: 'lead@gwlab.com', name: '王负责' },
      { id: 'u4', username: 'expert', role: UserRole.GW_EXPERT, email: 'expert@gwlab.com', name: '陈专家' },
      { id: 'u5', username: 'chief', role: UserRole.CHIEF_SCIENTIST, email: 'chief@gwlab.com', name: '刘首席' },
    ];

    this.detectorConfigs = [
      {
        id: 'det1',
        name: '基础干涉仪构型',
        armLength: 4000,
        laserPower: 20,
        wavelength: 1064e-9,
        mirrorMass: 40,
        suspensionType: '单摆悬挂',
        configuration: '基础L型构型，适用于教学与入门研究',
      },
      {
        id: 'det2',
        name: '高级干涉仪构型',
        armLength: 10000,
        laserPower: 100,
        wavelength: 1064e-9,
        mirrorMass: 100,
        suspensionType: '四级摆悬挂',
        configuration: '升级L型构型，配备功率循环和信号循环',
      },
      {
        id: 'det3',
        name: 'LIGO类构型',
        armLength: 4000,
        laserPower: 200,
        wavelength: 1064e-9,
        mirrorMass: 200,
        suspensionType: '四级摆+隔振台',
        configuration: '类LIGO构型，双功率循环，先进隔振系统',
      },
    ];

    const generateNoiseSpectrum = (type: string, len: number) => {
      const frequencies = Array.from({ length: len }, (_, i) => 10 + i * 2);
      const values = frequencies.map((f) => {
        switch (type) {
          case 'seismic':
            return 1e-19 * Math.pow(f / 10, -2);
          case 'thermal':
            return 5e-24 * Math.pow(f / 100, -1);
          case 'shot':
            return 3e-24 * Math.pow(f / 100, 0.5);
          case 'radiation':
            return 2e-24 * Math.pow(f / 100, -2);
          default:
            return 1e-23;
        }
      });
      return { frequencies, values };
    };

    this.noiseModels = [
      {
        id: 'nm1',
        name: '基础噪声模型',
        version: 'v1.0',
        seismicNoise: { type: 'seismic', parameters: { amplitude: 1e-19, alpha: -2 }, spectrum: generateNoiseSpectrum('seismic', 200) },
        thermalNoise: { type: 'thermal', parameters: { amplitude: 5e-24, alpha: -1 }, spectrum: generateNoiseSpectrum('thermal', 200) },
        shotNoise: { type: 'shot', parameters: { amplitude: 3e-24, alpha: 0.5 }, spectrum: generateNoiseSpectrum('shot', 200) },
        radiationPressure: { type: 'radiation', parameters: { amplitude: 2e-24, alpha: -2 }, spectrum: generateNoiseSpectrum('radiation', 200) },
      },
      {
        id: 'nm2',
        name: '改进噪声模型',
        version: 'v2.0',
        seismicNoise: { type: 'seismic', parameters: { amplitude: 5e-20, alpha: -2.5 }, spectrum: generateNoiseSpectrum('seismic', 200) },
        thermalNoise: { type: 'thermal', parameters: { amplitude: 3e-24, alpha: -1.2 }, spectrum: generateNoiseSpectrum('thermal', 200) },
        shotNoise: { type: 'shot', parameters: { amplitude: 2e-24, alpha: 0.5 }, spectrum: generateNoiseSpectrum('shot', 200) },
        radiationPressure: { type: 'radiation', parameters: { amplitude: 1e-24, alpha: -2 }, spectrum: generateNoiseSpectrum('radiation', 200) },
      },
    ];

    const now = Date.now();
    this.tasks = [
      {
        id: 't1',
        name: 'GW150914 双黑洞模拟',
        status: TaskStatus.APPROVED,
        detectorConfigId: 'det3',
        noiseModelId: 'nm2',
        signalSource: { type: 'BBH', mass1: 36, mass2: 29, spin1: 0.3, spin2: 0.2, distance: 410, inclination: 0.4 },
        createdAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 100,
        currentStep: '已完成审批',
        estimatedTime: 120,
        elapsedTime: 115,
        announcementPush: {
          pushedAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
          status: 'success',
          eventId: 'GW20260607_001',
        },
        uploadedDetectorFile: {
          fileName: 'LIGO-detector-config.json',
          fileSize: 15_360,
          uploadedAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
        },
      },
      {
        id: 't2',
        name: 'BNS 近邻中子星并合模拟',
        status: TaskStatus.COMPLETED,
        detectorConfigId: 'det2',
        noiseModelId: 'nm1',
        signalSource: { type: 'BNS', mass1: 1.4, mass2: 1.35, spin1: 0.05, spin2: 0.04, distance: 40, inclination: 0.2 },
        createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 100,
        currentStep: '等待验证',
        estimatedTime: 90,
        elapsedTime: 87,
      },
      {
        id: 't3',
        name: 'NSBH 中子星黑洞并合',
        status: TaskStatus.PARAMETER_ESTIMATION,
        detectorConfigId: 'det3',
        noiseModelId: 'nm2',
        signalSource: { type: 'NSBH', mass1: 10, mass2: 1.4, spin1: 0.5, spin2: 0.02, distance: 150, inclination: 0.3 },
        createdAt: new Date(now - 6 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 65,
        currentStep: '参数估计中',
        estimatedTime: 150,
        elapsedTime: 45,
      },
      {
        id: 't4',
        name: '高信噪比 BBH 测试',
        status: TaskStatus.NOISE_SIMULATION,
        detectorConfigId: 'det1',
        noiseModelId: 'nm1',
        signalSource: { type: 'BBH', mass1: 50, mass2: 30, spin1: 0.2, spin2: 0.1, distance: 100, inclination: 0.1 },
        createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 1 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 30,
        currentStep: '噪声模拟中',
        estimatedTime: 60,
        elapsedTime: 20,
      },
      {
        id: 't5',
        name: '低质量比 BBH 研究',
        status: TaskStatus.PENDING_VALIDATION,
        detectorConfigId: 'det2',
        noiseModelId: 'nm2',
        signalSource: { type: 'BBH', mass1: 100, mass2: 5, spin1: 0.7, spin2: 0.1, distance: 300, inclination: 0.5 },
        createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 0,
        currentStep: '待校验',
        estimatedTime: 180,
        elapsedTime: 0,
      },
      {
        id: 't6',
        name: '异常噪声模式分析',
        status: TaskStatus.FALLBACK,
        detectorConfigId: 'det3',
        noiseModelId: 'nm1',
        signalSource: { type: 'BBH', mass1: 20, mass2: 20, spin1: 0.4, spin2: 0.3, distance: 500, inclination: 0.6 },
        createdAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 40,
        currentStep: '异常回退',
        estimatedTime: 100,
        elapsedTime: 50,
      },
      {
        id: 't7',
        name: '中等质量比并合模拟',
        status: TaskStatus.SIGNAL_INJECTION,
        detectorConfigId: 'det2',
        noiseModelId: 'nm2',
        signalSource: { type: 'BBH', mass1: 30, mass2: 10, spin1: 0.3, spin2: 0.2, distance: 200, inclination: 0.35 },
        createdAt: new Date(now - 10 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 5 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 50,
        currentStep: '信号注入中',
        estimatedTime: 75,
        elapsedTime: 35,
      },
      {
        id: 't8',
        name: '远距BNS探测极限测试',
        status: TaskStatus.PENDING_VERIFICATION,
        detectorConfigId: 'det3',
        noiseModelId: 'nm2',
        signalSource: { type: 'BNS', mass1: 1.5, mass2: 1.2, spin1: 0.03, spin2: 0.02, distance: 200, inclination: 0.5 },
        createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
        createdBy: 'u1',
        progress: 100,
        currentStep: '待数据验证',
        estimatedTime: 140,
        elapsedTime: 132,
      },
    ];

    this.alerts = [
      {
        id: 'a1',
        taskId: 't6',
        taskName: '异常噪声模式分析',
        level: AlertLevel.LEVEL_1,
        type: 'non_stationary_noise',
        message: '噪声模型检测到非平稳性特征，ADF检验p值低于阈值',
        triggeredAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: 'a2',
        taskId: 't3',
        taskName: 'NSBH 中子星黑洞并合',
        level: AlertLevel.LEVEL_2,
        type: 'low_snr',
        message: '当前信噪比为 6.8，低于检测阈值 8.0，可能影响参数估计精度',
        triggeredAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: 'a3',
        taskId: 't1',
        taskName: 'GW150914 双黑洞模拟',
        level: AlertLevel.LEVEL_3,
        type: 'sensitivity_deviation',
        message: '灵敏度假定偏差为 8.5%，接近 10% 警戒阈值',
        triggeredAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
        status: 'resolved',
        reviewedBy: 'u4',
        reviewComment: '偏差在可接受范围内，由噪声涨落引起，无需调整模型',
      },
    ];

    this.approvals = [
      {
        id: 'app1',
        taskId: 't1',
        level: 'verification',
        approver: 'u2',
        decision: 'approved',
        comment: '噪声一致性良好，功率谱与理论预测偏差在5%以内',
        approvedAt: new Date(now - 6.5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'app2',
        taskId: 't1',
        level: 'confirmation',
        approver: 'u3',
        decision: 'approved',
        comment: '信号特征与GW150914一致，参数估计可靠，同意发布',
        approvedAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    this.adjustmentLogs = [
      {
        id: 'adj1',
        taskId: 't6',
        alertId: 'a1',
        adjustmentType: 'noise_model_switch',
        previousParams: { noiseModelId: 'nm1', name: '基础噪声模型' },
        newParams: { noiseModelId: 'nm2', name: '改进噪声模型' },
        adjustedBy: 'u4',
        adjustedAt: new Date(now - 2.5 * 24 * 3600 * 1000).toISOString(),
        description: '切换至改进噪声模型以更好地处理非平稳性',
      },
    ];

    this.exportTasks = [
      {
        id: 'exp1',
        status: 'completed',
        detectorConfigId: 'det3',
        noiseModelVersion: 'v2.0',
        timeWindowStart: new Date(now - 30 * 24 * 3600 * 1000).toISOString(),
        timeWindowEnd: new Date(now).toISOString(),
        exportType: 'all',
        createdAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
        downloadUrl: '/api/export/exp1/download',
        fileSize: 25_000_000,
      },
    ];

    this.tasks.forEach((task) => {
      if (task.progress === 100 || task.progress >= 50) {
        this.results.set(task.id, this.generateMockResult(task));
      }
    });

    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now - (29 - i) * 24 * 3600 * 1000);
      return d.toISOString().split('T')[0];
    });
    this.trendData = {
      dates,
      completionRate: dates.map(() => 70 + Math.random() * 25),
      accuracy: dates.map(() => 85 + Math.random() * 12),
      computationTime: dates.map(() => 80 + Math.random() * 60),
      taskCount: dates.map(() => Math.floor(2 + Math.random() * 5)),
    };
  }

  private generateMockResult(task: AnalysisTask): EstimationResult {
    const { signalSource } = task;
    const generatePosterior = (trueValue: number, sigma: number, n: number = 1000) => {
      return Array.from({ length: n }, () => {
        const u1 = Math.random();
        const u2 = Math.random();
        return trueValue + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      });
    };

    const mass1Samples = generatePosterior(signalSource.mass1, signalSource.mass1 * 0.05);
    const mass2Samples = generatePosterior(signalSource.mass2, signalSource.mass2 * 0.06);
    const spin1Samples = generatePosterior(signalSource.spin1, 0.08);
    const spin2Samples = generatePosterior(signalSource.spin2, 0.07);
    const distanceSamples = generatePosterior(signalSource.distance, signalSource.distance * 0.1);

    const calcStats = (samples: number[]): { median: number; lower90: number; upper90: number; lower68: number; upper68: number } => {
      const sorted = [...samples].sort((a, b) => a - b);
      const n = sorted.length;
      return {
        median: sorted[Math.floor(n * 0.5)],
        lower90: sorted[Math.floor(n * 0.05)],
        upper90: sorted[Math.floor(n * 0.95)],
        lower68: sorted[Math.floor(n * 0.16)],
        upper68: sorted[Math.floor(n * 0.84)],
      };
    };

    const freqs = Array.from({ length: 200 }, (_, i) => 10 + i * 5);
    const sensitivity = freqs.map((f) => {
      const seismic = 1e-19 * Math.pow(f / 10, -2);
      const thermal = 5e-24 * Math.pow(f / 100, -1);
      const shot = 3e-24 * Math.pow(f / 100, 0.5);
      const rad = 2e-24 * Math.pow(f / 100, -2);
      return Math.sqrt(seismic * seismic + thermal * thermal + shot * shot + rad * rad);
    });

    const times = Array.from({ length: 1000 }, (_, i) => i * 0.001);
    const tMerge = 0.7;
    const signal = times.map((t) => {
      if (t < tMerge - 0.1) return 0;
      if (t > tMerge + 0.05) return 0;
      const tau = (t - (tMerge - 0.1)) / 0.15;
      return 1e-21 * Math.sin(2 * Math.PI * 150 * (t - tMerge)) * Math.exp(-Math.pow(tau - 0.6, 2) * 10) * tau;
    });
    const noise = times.map(() => (Math.random() - 0.5) * 2e-22);
    const combined = times.map((_, i) => signal[i] + noise[i]);

    return {
      taskId: task.id,
      mass1: calcStats(mass1Samples),
      mass2: calcStats(mass2Samples),
      spin1: calcStats(spin1Samples),
      spin2: calcStats(spin2Samples),
      distance: calcStats(distanceSamples),
      snr: 12 + Math.random() * 15,
      logLikelihood: 250 + Math.random() * 100,
      posteriorSamples: {
        mass1: mass1Samples,
        mass2: mass2Samples,
        spin1: spin1Samples,
        spin2: spin2Samples,
        distance: distanceSamples,
      },
      sensitivityCurve: { frequencies: freqs, values: sensitivity },
      noisePowerSpectrum: { frequencies: freqs, values: sensitivity.map((s) => s * s) },
      injectedSignal: { times, values: signal },
      combinedData: { times, values: combined },
    };
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  getDetectorConfigs(): DetectorConfig[] {
    return this.detectorConfigs;
  }

  getDetectorConfigById(id: string): DetectorConfig | undefined {
    return this.detectorConfigs.find((d) => d.id === id);
  }

  addDetectorConfig(config: Omit<DetectorConfig, 'id'>): DetectorConfig {
    const newConfig = { ...config, id: `det${Date.now()}` };
    this.detectorConfigs.push(newConfig);
    return newConfig;
  }

  updateDetectorConfig(id: string, updates: Partial<DetectorConfig>): DetectorConfig | undefined {
    const idx = this.detectorConfigs.findIndex((d) => d.id === id);
    if (idx >= 0) {
      this.detectorConfigs[idx] = { ...this.detectorConfigs[idx], ...updates };
      return this.detectorConfigs[idx];
    }
    return undefined;
  }

  getNoiseModels(): NoiseModel[] {
    return this.noiseModels;
  }

  getNoiseModelById(id: string): NoiseModel | undefined {
    return this.noiseModels.find((n) => n.id === id);
  }

  getTasks(filters?: { status?: TaskStatus; detectorConfigId?: string; createdBy?: string }): AnalysisTask[] {
    let result = [...this.tasks];
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.detectorConfigId) {
      result = result.filter((t) => t.detectorConfigId === filters.detectorConfigId);
    }
    if (filters?.createdBy) {
      result = result.filter((t) => t.createdBy === filters.createdBy);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTaskById(id: string): AnalysisTask | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  addTask(task: Omit<AnalysisTask, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'currentStep'>): AnalysisTask {
    const now = new Date().toISOString();
    const newTask: AnalysisTask = {
      ...task,
      id: `t${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      progress: 0,
      currentStep: '待校验',
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  updateTaskStatus(id: string, status: TaskStatus, progress?: number, currentStep?: string): AnalysisTask | undefined {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = status;
      if (progress !== undefined) task.progress = progress;
      if (currentStep) task.currentStep = currentStep;
      task.updatedAt = new Date().toISOString();
      return task;
    }
    return undefined;
  }

  updateTaskUploadedFiles(
    id: string,
    files: { detectorFile?: UploadedFileInfo; noiseFile?: UploadedFileInfo }
  ): AnalysisTask | undefined {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      if (files.detectorFile) {
        task.uploadedDetectorFile = files.detectorFile;
      }
      if (files.noiseFile) {
        task.uploadedNoiseFile = files.noiseFile;
      }
      task.updatedAt = new Date().toISOString();
      return task;
    }
    return undefined;
  }

  setAnnouncementPush(taskId: string, record: AnnouncementPushRecord): AnalysisTask | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.announcementPush = record;
      task.updatedAt = new Date().toISOString();
      return task;
    }
    return undefined;
  }

  getResult(taskId: string): EstimationResult | undefined {
    return this.results.get(taskId);
  }

  setResult(taskId: string, result: EstimationResult): void {
    this.results.set(taskId, result);
  }

  getAlerts(filters?: { level?: AlertLevel; status?: string }): Alert[] {
    let result = [...this.alerts];
    if (filters?.level) {
      result = result.filter((a) => a.level === filters.level);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  getAlertById(id: string): Alert | undefined {
    return this.alerts.find((a) => a.id === id);
  }

  reviewAlert(id: string, reviewedBy: string, reviewComment: string, status: 'reviewed' | 'resolved'): Alert | undefined {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = status;
      alert.reviewedBy = reviewedBy;
      alert.reviewComment = reviewComment;
      return alert;
    }
    return undefined;
  }

  addAlert(alert: Omit<Alert, 'id' | 'triggeredAt' | 'status'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `a${Date.now()}`,
      triggeredAt: new Date().toISOString(),
      status: 'pending',
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }

  getApprovals(taskId?: string): ApprovalRecord[] {
    let result = [...this.approvals];
    if (taskId) {
      result = result.filter((a) => a.taskId === taskId);
    }
    return result.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
  }

  getPendingApprovals(level?: 'verification' | 'confirmation'): AnalysisTask[] {
    const verificationTasks = this.tasks.filter((t) => t.status === TaskStatus.PENDING_VERIFICATION);
    const confirmationTasks = this.tasks.filter((t) => t.status === TaskStatus.PENDING_CONFIRMATION);

    if (level === 'verification') return verificationTasks;
    if (level === 'confirmation') return confirmationTasks;
    return [...verificationTasks, ...confirmationTasks];
  }

  addApproval(approval: Omit<ApprovalRecord, 'id' | 'approvedAt'>): ApprovalRecord {
    const newApproval: ApprovalRecord = {
      ...approval,
      id: `app${Date.now()}`,
      approvedAt: new Date().toISOString(),
    };
    this.approvals.push(newApproval);
    return newApproval;
  }

  getDashboardStats(): DashboardStats {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = this.tasks.filter((t) => t.createdAt.startsWith(today) && t.progress === 100).length;
    const totalCompleted = this.tasks.filter((t) => t.progress === 100).length;

    const tasksByStatus: Record<TaskStatus, number> = {
      [TaskStatus.PENDING_VALIDATION]: 0,
      [TaskStatus.MODEL_BUILDING]: 0,
      [TaskStatus.NOISE_SIMULATION]: 0,
      [TaskStatus.SIGNAL_INJECTION]: 0,
      [TaskStatus.PARAMETER_ESTIMATION]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.PENDING_VERIFICATION]: 0,
      [TaskStatus.PENDING_CONFIRMATION]: 0,
      [TaskStatus.APPROVED]: 0,
      [TaskStatus.FALLBACK]: 0,
      [TaskStatus.ERROR]: 0,
    };

    this.tasks.forEach((t) => {
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
    });

    const avgAccuracy = 89.5;
    const avgTime = 105.3;

    return {
      totalTasks: this.tasks.length,
      completedToday,
      completionRate: totalCompleted > 0 ? (totalCompleted / this.tasks.length) * 100 : 0,
      avgEstimationAccuracy: avgAccuracy,
      avgComputationTime: avgTime,
      activeAlerts: this.alerts.filter((a) => a.status === 'pending').length,
      pendingApprovals: this.getPendingApprovals().length,
      tasksByStatus,
    };
  }

  getTrendData(days: number = 30): TrendData {
    if (!this.trendData) return { dates: [], completionRate: [], accuracy: [], computationTime: [], taskCount: [] };
    const start = Math.max(0, this.trendData.dates.length - days);
    return {
      dates: this.trendData.dates.slice(start),
      completionRate: this.trendData.completionRate.slice(start),
      accuracy: this.trendData.accuracy.slice(start),
      computationTime: this.trendData.computationTime.slice(start),
      taskCount: this.trendData.taskCount.slice(start),
    };
  }

  getRecommendations(detectorConfigId?: string): Recommendation {
    const filterTemplates = [
      {
        id: 'ft1',
        name: '标准匹配滤波器',
        type: 'matched_filter',
        description: '基于模板波形的最优滤波器，适用于高信噪比事件',
        suitability: 0.92,
        recommendedParams: { templateBankSize: 5000, lowFrequencyCutoff: 20 },
      },
      {
        id: 'ft2',
        name: '维纳滤波器',
        type: 'wiener',
        description: '基于噪声功率谱的线性最优滤波器',
        suitability: 0.85,
        recommendedParams: { smoothingWindow: 0.1, adaptive: false },
      },
      {
        id: 'ft3',
        name: 'Q-变换时频滤波器',
        type: 'q_transform',
        description: '时频分析方法，对非平稳信号有更好的鲁棒性',
        suitability: 0.78,
        recommendedParams: { qValue: 10, frequencyRange: [20, 1000] },
      },
    ];

    const parameterRanges = [
      { parameter: 'mass1', min: 1, max: 100, suggestedStep: 1, confidence: 0.88 },
      { parameter: 'mass2', min: 1, max: 80, suggestedStep: 1, confidence: 0.85 },
      { parameter: 'spin1', min: 0, max: 0.9, suggestedStep: 0.05, confidence: 0.72 },
      { parameter: 'spin2', min: 0, max: 0.8, suggestedStep: 0.05, confidence: 0.75 },
      { parameter: 'distance', min: 10, max: 1000, suggestedStep: 10, confidence: 0.82 },
    ];

    return {
      filterTemplates,
      parameterRanges,
      confidence: 0.85,
      basedOnTasks: this.tasks.filter((t) => t.progress === 100).length,
    };
  }

  getAdjustmentLogs(taskId?: string): AdjustmentLog[] {
    if (taskId) {
      return this.adjustmentLogs.filter((l) => l.taskId === taskId);
    }
    return this.adjustmentLogs;
  }

  addAdjustmentLog(log: Omit<AdjustmentLog, 'id' | 'adjustedAt'>): AdjustmentLog {
    const newLog: AdjustmentLog = {
      ...log,
      id: `adj${Date.now()}`,
      adjustedAt: new Date().toISOString(),
    };
    this.adjustmentLogs.push(newLog);
    return newLog;
  }

  getExportTasks(): ExportTask[] {
    return [...this.exportTasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createExportTask(
    data: Omit<ExportTask, 'id' | 'status' | 'createdAt' | 'fileSize'>
  ): ExportTask {
    const newTask: ExportTask = {
      ...data,
      id: `exp${Date.now()}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    this.exportTasks.unshift(newTask);

    setTimeout(() => {
      const task = this.exportTasks.find((t) => t.id === newTask.id);
      if (task) {
        task.status = 'completed';
        task.fileSize = Math.floor(10_000_000 + Math.random() * 40_000_000);
        task.downloadUrl = `/api/export/${task.id}/download`;
      }
    }, 2000);

    return newTask;
  }

  isQualityPaused(): boolean {
    return this.qualityPaused;
  }

  setQualityPaused(paused: boolean): void {
    this.qualityPaused = paused;
  }

  checkSensitivityDeviation(detectorConfigId: string): { deviation: number; exceedsThreshold: boolean; recentTasks: string[] } {
    const completedTasks = this.tasks.filter(
      (t) => t.detectorConfigId === detectorConfigId && t.progress === 100
    );
    const recent = completedTasks.slice(0, 3);

    if (recent.length < 3) {
      return { deviation: 0, exceedsThreshold: false, recentTasks: recent.map((t) => t.id) };
    }

    const deviations = recent.map(() => 5 + Math.random() * 8);
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

    return {
      deviation: avgDeviation,
      exceedsThreshold: avgDeviation > 10,
      recentTasks: recent.map((t) => t.id),
    };
  }
}

export const dataStore = new DataStore();
