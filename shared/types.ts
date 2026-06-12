export enum TaskStatus {
  PENDING_VALIDATION = 'pending_validation',
  MODEL_BUILDING = 'model_building',
  NOISE_SIMULATION = 'noise_simulation',
  SIGNAL_INJECTION = 'signal_injection',
  PARAMETER_ESTIMATION = 'parameter_estimation',
  COMPLETED = 'completed',
  PENDING_VERIFICATION = 'pending_verification',
  PENDING_CONFIRMATION = 'pending_confirmation',
  APPROVED = 'approved',
  FALLBACK = 'fallback',
  ERROR = 'error'
}

export enum AlertLevel {
  LEVEL_1 = 'level1',
  LEVEL_2 = 'level2',
  LEVEL_3 = 'level3'
}

export enum UserRole {
  DATA_ANALYST = 'data_analyst',
  DATA_VERIFIER = 'data_verifier',
  PROJECT_LEAD = 'project_lead',
  GW_EXPERT = 'gw_expert',
  CHIEF_SCIENTIST = 'chief_scientist'
}

export type SignalSourceType = 'BBH' | 'BNS' | 'NSBH';

export interface DetectorConfig {
  id: string;
  name: string;
  armLength: number;
  laserPower: number;
  wavelength: number;
  mirrorMass: number;
  suspensionType: string;
  configuration: string;
}

export interface NoiseComponent {
  type: string;
  parameters: Record<string, number>;
  spectrum: FrequencySeries;
}

export interface NoiseModel {
  id: string;
  name: string;
  version: string;
  seismicNoise: NoiseComponent;
  thermalNoise: NoiseComponent;
  shotNoise: NoiseComponent;
  radiationPressure: NoiseComponent;
}

export interface FrequencySeries {
  frequencies: number[];
  values: number[];
}

export interface SignalSource {
  type: SignalSourceType;
  mass1: number;
  mass2: number;
  spin1: number;
  spin2: number;
  distance: number;
  inclination: number;
}

export interface ParameterEstimate {
  median: number;
  lower90: number;
  upper90: number;
  lower68: number;
  upper68: number;
}

export interface PosteriorSamples {
  mass1: number[];
  mass2: number[];
  spin1: number[];
  spin2: number[];
  distance: number[];
}

export interface EstimationResult {
  taskId: string;
  mass1: ParameterEstimate;
  mass2: ParameterEstimate;
  spin1: ParameterEstimate;
  spin2: ParameterEstimate;
  distance: ParameterEstimate;
  snr: number;
  logLikelihood: number;
  posteriorSamples: PosteriorSamples;
  sensitivityCurve: FrequencySeries;
  noisePowerSpectrum: FrequencySeries;
  injectedSignal: TimeSeries;
  combinedData: TimeSeries;
}

export interface TimeSeries {
  times: number[];
  values: number[];
}

export interface AnalysisTask {
  id: string;
  name: string;
  status: TaskStatus;
  detectorConfigId: string;
  noiseModelId: string;
  signalSource: SignalSource;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  progress: number;
  currentStep: string;
  estimatedTime?: number;
  elapsedTime?: number;
  uploadedDetectorFile?: UploadedFileInfo;
  uploadedNoiseFile?: UploadedFileInfo;
  announcementPush?: AnnouncementPushRecord;
}

export interface UploadedFileInfo {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  content?: string;
}

export interface AnnouncementPushRecord {
  pushedAt: string;
  status: 'success' | 'failed';
  eventId: string;
  errorMessage?: string;
}

export interface Alert {
  id: string;
  taskId: string;
  taskName?: string;
  level: AlertLevel;
  type: 'low_snr' | 'non_stationary_noise' | 'sensitivity_deviation';
  message: string;
  triggeredAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reviewedBy?: string;
  reviewComment?: string;
  adjustmentLog?: AdjustmentLog;
}

export interface AdjustmentLog {
  id: string;
  taskId: string;
  alertId: string;
  adjustmentType: string;
  previousParams: Record<string, unknown>;
  newParams: Record<string, unknown>;
  adjustedBy: string;
  adjustedAt: string;
  description: string;
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 'verification' | 'confirmation';
  approver: string;
  decision: 'approved' | 'rejected';
  comment: string;
  approvedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email: string;
  name: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedToday: number;
  completionRate: number;
  avgEstimationAccuracy: number;
  avgComputationTime: number;
  activeAlerts: number;
  pendingApprovals: number;
  tasksByStatus: Record<TaskStatus, number>;
}

export interface TrendData {
  dates: string[];
  completionRate: number[];
  accuracy: number[];
  computationTime: number[];
  taskCount: number[];
}

export interface Recommendation {
  filterTemplates: FilterTemplate[];
  parameterRanges: ParameterRange[];
  confidence: number;
  basedOnTasks: number;
}

export interface FilterTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  suitability: number;
  recommendedParams: Record<string, number>;
}

export interface ParameterRange {
  parameter: string;
  min: number;
  max: number;
  suggestedStep: number;
  confidence: number;
}

export interface ExportTask {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  detectorConfigId: string;
  noiseModelVersion: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  exportType: 'response_data' | 'estimation_results' | 'all';
  createdAt: string;
  downloadUrl?: string;
  fileSize?: number;
}
