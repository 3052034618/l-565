import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store';
import { workflowEngine } from '../services/workflow';
import { interferometerService } from '../services/interferometer';
import { noiseSimulationService } from '../services/noise';
import { parameterEstimationService } from '../services/estimation';
import { reportService } from '../services/report';
import { recommendationEngine } from '../services/recommend';
import { TaskStatus, AlertLevel, SignalSourceType } from '../../shared/types';
import fs from 'fs';
import path from 'path';

const router = Router();

// 认证
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = dataStore.getUserByUsername(username);

  if (user) {
    res.json({
      success: true,
      user: { ...user, token: `mock-token-${user.id}` },
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

router.get('/auth/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const user = dataStore.getUserById(userId || 'u1');
  res.json({ user });
});

// 统计数据
router.get('/stats/dashboard', (req: Request, res: Response) => {
  const stats = dataStore.getDashboardStats();
  res.json(stats);
});

router.get('/stats/trends', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const trends = dataStore.getTrendData(days);
  res.json(trends);
});

// 任务管理
router.get('/tasks', (req: Request, res: Response) => {
  const { status, detectorConfigId, createdBy } = req.query;
  const tasks = dataStore.getTasks({
    status: status as TaskStatus | undefined,
    detectorConfigId: detectorConfigId as string | undefined,
    createdBy: createdBy as string | undefined,
  });
  res.json(tasks);
});

router.get('/tasks/:id', (req: Request, res: Response) => {
  const task = dataStore.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const result = dataStore.getResult(req.params.id);
  const approvals = dataStore.getApprovals(req.params.id);
  const alerts = dataStore.getAlerts().filter(a => a.taskId === req.params.id);
  const adjustmentLogs = dataStore.getAdjustmentLogs(req.params.id);
  const detector = dataStore.getDetectorConfigById(task.detectorConfigId);
  const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);

  res.json({
    task,
    result,
    approvals,
    alerts,
    adjustmentLogs,
    detector,
    noiseModel,
  });
});

router.post('/tasks', (req: Request, res: Response) => {
  const { name, detectorConfigId, noiseModelId, signalSource, createdBy, uploadedDetectorFile, uploadedNoiseFile } = req.body;

  if (dataStore.isQualityPaused()) {
    return res.status(403).json({
      error: '系统处于质量暂停状态，无法创建新任务，请联系首席科学家',
    });
  }

  const newTask = dataStore.addTask({
    name,
    status: TaskStatus.PENDING_VALIDATION,
    detectorConfigId,
    noiseModelId,
    signalSource,
    createdBy: createdBy || 'u1',
  });

  if (uploadedDetectorFile || uploadedNoiseFile) {
    dataStore.updateTaskUploadedFiles(newTask.id, {
      detectorFile: uploadedDetectorFile,
      noiseFile: uploadedNoiseFile,
    });
  }

  setTimeout(() => {
    workflowEngine.startTask(newTask.id);
  }, 500);

  res.status(201).json(newTask);
});

router.put('/tasks/:id/status', (req: Request, res: Response) => {
  const { status, progress, currentStep } = req.body;
  const updated = dataStore.updateTaskStatus(req.params.id, status, progress, currentStep);
  if (!updated) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(updated);
});

router.get('/tasks/:id/results', (req: Request, res: Response) => {
  const result = dataStore.getResult(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '结果不存在' });
  }
  res.json(result);
});

// 探测器构型
router.get('/detectors', (_req: Request, res: Response) => {
  const detectors = dataStore.getDetectorConfigs();
  res.json(detectors);
});

router.post('/detectors', (req: Request, res: Response) => {
  const newDetector = dataStore.addDetectorConfig(req.body);
  res.status(201).json(newDetector);
});

router.put('/detectors/:id', (req: Request, res: Response) => {
  const updated = dataStore.updateDetectorConfig(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: '探测器构型不存在' });
  }
  res.json(updated);
});

// 噪声模型
router.get('/noise-models', (_req: Request, res: Response) => {
  const models = dataStore.getNoiseModels();
  res.json(models);
});

// 预警
router.get('/alerts', (req: Request, res: Response) => {
  const { level, status } = req.query;
  const alerts = dataStore.getAlerts({
    level: level as AlertLevel | undefined,
    status: status as string | undefined,
  });
  res.json(alerts);
});

router.post('/alerts/:id/review', (req: Request, res: Response) => {
  const { reviewedBy, reviewComment, status, adjustmentType, newParams } = req.body;

  if (status === 'resolved' && adjustmentType) {
    workflowEngine.reviewAndAdjust(
      req.params.id,
      reviewedBy,
      reviewComment,
      adjustmentType,
      newParams || {}
    );
  } else {
    dataStore.reviewAlert(req.params.id, reviewedBy, reviewComment, status);
  }

  const alert = dataStore.getAlertById(req.params.id);
  res.json(alert);
});

// 审批
router.get('/approvals/pending', (req: Request, res: Response) => {
  const { level } = req.query;
  const pending = workflowEngine.getPendingApprovals
    ? []
    : dataStore.getPendingApprovals(level as 'verification' | 'confirmation' | undefined);

  const tasks = dataStore.getPendingApprovals(level as 'verification' | 'confirmation' | undefined);
  res.json(tasks);
});

router.post('/approvals/:id/verify', (req: Request, res: Response) => {
  const { approver, comment } = req.body;
  const success = workflowEngine.approveVerification(req.params.id, approver || 'u2', comment || '');
  if (!success) {
    return res.status(400).json({ error: '无法执行验证操作' });
  }
  res.json({ success: true });
});

router.post('/approvals/:id/reject-verify', (req: Request, res: Response) => {
  const { approver, comment } = req.body;
  const success = workflowEngine.rejectVerification(req.params.id, approver || 'u2', comment || '');
  if (!success) {
    return res.status(400).json({ error: '无法执行驳回操作' });
  }
  res.json({ success: true });
});

router.post('/approvals/:id/confirm', (req: Request, res: Response) => {
  const { approver, comment } = req.body;
  const success = workflowEngine.approveConfirmation(req.params.id, approver || 'u3', comment || '');
  if (!success) {
    return res.status(400).json({ error: '无法执行确认操作' });
  }
  res.json({ success: true });
});

router.post('/approvals/:id/reject-confirm', (req: Request, res: Response) => {
  const { approver, comment } = req.body;
  const success = workflowEngine.rejectConfirmation(req.params.id, approver || 'u3', comment || '');
  if (!success) {
    return res.status(400).json({ error: '无法执行驳回操作' });
  }
  res.json({ success: true });
});

router.get('/approvals/history', (req: Request, res: Response) => {
  const { taskId } = req.query;
  const approvals = dataStore.getApprovals(taskId as string | undefined);
  res.json(approvals);
});

// 报告
router.get('/report/:id', (req: Request, res: Response) => {
  const reportData = reportService.generateReportData(req.params.id);
  if (!reportData) {
    return res.status(404).json({ error: '报告数据不存在' });
  }
  res.json(reportData);
});

router.get('/report/:id/pdf', (req: Request, res: Response) => {
  const reportData = reportService.generateReportData(req.params.id);
  if (!reportData) {
    return res.status(404).json({ error: '任务不存在或没有结果数据' });
  }

  const task = reportData.task;
  const result = reportData.result;
  const detector = reportData.detector;
  const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);

  const detectorDisplayName = task.uploadedDetectorFile?.parsedDetectorConfig?.name || detector?.name || '未知探测器';
  const noiseModelDisplayName = task.uploadedNoiseFile?.parsedNoiseModel?.name || noiseModel?.name || '未知噪声模型';
  const noiseModelDisplayVersion = task.uploadedNoiseFile?.parsedNoiseModel?.version || noiseModel?.version || 'v1.0';

  res.json({
    success: true,
    downloadUrl: `/api/report/${req.params.id}/pdf/download`,
    taskName: task.name,
    taskId: task.id,
    createdAt: task.createdAt,
    detectorName: detectorDisplayName,
    noiseModelVersion: noiseModelDisplayVersion,
    signalSourceType: task.signalSource.type,
    mass1: task.signalSource.mass1,
    mass2: task.signalSource.mass2,
    spin1: task.signalSource.spin1,
    spin2: task.signalSource.spin2,
    distance: task.signalSource.distance,
    snr: result.snr,
    sensitivityCurve: result.sensitivityCurve,
    noisePowerSpectrum: result.noisePowerSpectrum,
    injectedSignal: result.injectedSignal,
    posteriorSamples: result.posteriorSamples,
  });
});

router.get('/report/:id/pdf/download', (req: Request, res: Response) => {
  const reportData = reportService.generateReportData(req.params.id);
  if (!reportData) {
    return res.status(404).json({ error: '任务不存在或没有结果数据' });
  }

  const { task, result, detector } = reportData;
  const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);

  const detectorDisplayName = task.uploadedDetectorFile?.parsedDetectorConfig?.name || detector?.name || '未知探测器';
  const noiseModelDisplayName = task.uploadedNoiseFile?.parsedNoiseModel?.name || noiseModel?.name || '未知噪声模型';
  const noiseModelDisplayVersion = task.uploadedNoiseFile?.parsedNoiseModel?.version || noiseModel?.version || 'v1.0';

  const pdfData = {
    taskName: task.name,
    taskId: task.id,
    createdAt: task.createdAt,
    detectorName: detectorDisplayName,
    noiseModelVersion: noiseModelDisplayVersion,
    signalSourceType: task.signalSource.type,
    mass1: task.signalSource.mass1,
    mass2: task.signalSource.mass2,
    spin1: task.signalSource.spin1,
    spin2: task.signalSource.spin2,
    distance: task.signalSource.distance,
    snr: result.snr,
    sensitivityCurve: result.sensitivityCurve,
    noisePowerSpectrum: result.noisePowerSpectrum,
    injectedSignal: result.injectedSignal,
    posteriorSamples: result.posteriorSamples,
  };

  const filename = `GW_Report_${task.id}.json`;
  const safeFilename = encodeURIComponent(filename);
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    format: 'pdf_report_data',
    description: '前端可直接用此数据调用 generatePDFReport() 生成PDF',
    data: pdfData,
  });
});

// 推荐
router.get('/recommend/filters', (req: Request, res: Response) => {
  const { detectorConfigId, signalType } = req.query;
  const recommendations = recommendationEngine.getRecommendations(
    detectorConfigId as string | undefined,
    signalType as SignalSourceType | undefined
  );
  res.json(recommendations);
});

router.get('/recommend/param-range', (req: Request, res: Response) => {
  const { signalType } = req.query;
  const recommendations = recommendationEngine.getRecommendations(
    undefined,
    signalType as SignalSourceType | undefined
  );
  res.json({ parameterRanges: recommendations.parameterRanges });
});

router.get('/recommend/noise-model', (req: Request, res: Response) => {
  const { detectorConfigId } = req.query;
  const modelId = recommendationEngine.suggestNoiseModel(detectorConfigId as string);
  const model = dataStore.getNoiseModelById(modelId);
  res.json({ recommendedNoiseModel: model });
});

// 导出
router.get('/export', (_req: Request, res: Response) => {
  const tasks = dataStore.getExportTasks();
  res.json(tasks);
});

router.post('/export', (req: Request, res: Response) => {
  const { detectorConfigId, noiseModelVersion, timeWindowStart, timeWindowEnd, exportType } = req.body;
  const exportTask = dataStore.createExportTask({
    detectorConfigId,
    noiseModelVersion,
    timeWindowStart,
    timeWindowEnd,
    exportType,
    downloadUrl: '',
  });
  res.status(201).json(exportTask);
});

router.get('/export/:id/download', (req: Request, res: Response) => {
  try {
    const task = dataStore.getExportTasks().find(t => t.id === req.params.id);
    if (!task || task.status !== 'completed') {
      return res.status(404).json({ error: '导出任务不存在或未完成' });
    }

    const exportData = reportService.exportResponseData(
      task.detectorConfigId,
      task.noiseModelVersion,
      task.timeWindowStart,
      task.timeWindowEnd,
      task.exportType
    );

    const safeFilename = encodeURIComponent(exportData.filename);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData.data);
  } catch (err) {
    console.error('[Export Download Error]', err);
    res.status(500).json({ success: false, error: 'Server internal error', details: (err as Error).message });
  }
});

// 模拟计算服务
router.post('/simulate/sensitivity', (req: Request, res: Response) => {
  const { detectorConfigId, noiseModelId, freqMin = 10, freqMax = 2000 } = req.body;

  const detector = dataStore.getDetectorConfigById(detectorConfigId);
  const noiseModel = dataStore.getNoiseModelById(noiseModelId);

  if (!detector || !noiseModel) {
    return res.status(400).json({ error: '无效的探测器构型或噪声模型' });
  }

  const sensitivity = interferometerService.computeSensitivityCurve(detector, noiseModel, { min: freqMin, max: freqMax });
  res.json(sensitivity);
});

router.post('/simulate/noise-components', (req: Request, res: Response) => {
  const { detectorConfigId, noiseModelId, freqMin = 10, freqMax = 2000 } = req.body;

  const detector = dataStore.getDetectorConfigById(detectorConfigId);
  const noiseModel = dataStore.getNoiseModelById(noiseModelId);

  if (!detector || !noiseModel) {
    return res.status(400).json({ error: '无效的探测器构型或噪声模型' });
  }

  const components = noiseSimulationService.generateAllNoiseComponents(detector, noiseModel, { min: freqMin, max: freqMax });
  res.json(components);
});

router.post('/simulate/waveform', (req: Request, res: Response) => {
  const { signalSource, sampleRate = 4096, duration = 8 } = req.body;
  const waveform = parameterEstimationService.generateInspiralWaveform(signalSource, sampleRate, duration);
  res.json(waveform);
});

// 质量控制
router.get('/quality/status', (_req: Request, res: Response) => {
  const isPaused = dataStore.isQualityPaused();
  res.json({ isPaused });
});

router.post('/quality/resume', (req: Request, res: Response) => {
  workflowEngine.resumeQualityControl();
  res.json({ success: true, message: '质量暂停已解除' });
});

router.get('/quality/deviation/:detectorId', (req: Request, res: Response) => {
  const result = dataStore.checkSensitivityDeviation(req.params.detectorId);
  res.json(result);
});

export default router;
