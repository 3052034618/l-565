import { dataStore } from './store';
import { TaskStatus, AlertLevel, AnalysisTask } from '../../shared/types';
import { interferometerService } from './interferometer';
import { noiseSimulationService } from './noise';
import { parameterEstimationService } from './estimation';

const SNR_THRESHOLD = 8.0;
const SENSITIVITY_DEVIATION_THRESHOLD = 10;
const NOISE_STATIONARITY_PVALUE = 0.05;

class WorkflowEngine {
  private activeTasks: Map<string, NodeJS.Timeout> = new Map();

  async startTask(taskId: string): Promise<AnalysisTask | undefined> {
    const task = dataStore.getTaskById(taskId);
    if (!task) return undefined;

    if (dataStore.isQualityPaused()) {
      this.triggerAlert(
        taskId,
        AlertLevel.LEVEL_2,
        'sensitivity_deviation',
        '系统处于质量暂停状态，新任务无法启动，请联系首席科学家'
      );
      return undefined;
    }

    this.runTaskPipeline(taskId);
    return dataStore.getTaskById(taskId);
  }

  private async runTaskPipeline(taskId: string): Promise<void> {
    try {
      dataStore.updateTaskStatus(taskId, TaskStatus.MODEL_BUILDING, 10, '构建干涉仪响应模型');
      await this.delay(1500);
      await this.buildModel(taskId);
      this.updateProgress(taskId, 20, '模型构建完成，初始化光子计数统计');

      dataStore.updateTaskStatus(taskId, TaskStatus.NOISE_SIMULATION, 30, '执行噪声模拟');
      await this.delay(2000);
      const noiseResult = await this.simulateNoise(taskId);

      if (!noiseResult.isStationary) {
        this.triggerAlert(
          taskId,
          AlertLevel.LEVEL_1,
          'non_stationary_noise',
          `噪声模型检测到非平稳性特征，方差比为 ${noiseResult.varianceRatio.toFixed(3)}，p值为 ${noiseResult.pValue.toFixed(4)}`
        );
        dataStore.updateTaskStatus(taskId, TaskStatus.FALLBACK, 35, '噪声非平稳，等待专家复核');
        return;
      }
      this.updateProgress(taskId, 50, '噪声模拟完成');

      dataStore.updateTaskStatus(taskId, TaskStatus.SIGNAL_INJECTION, 55, '注入信号波形');
      await this.delay(1500);
      await this.injectSignal(taskId);
      this.updateProgress(taskId, 60, '信号注入完成');

      dataStore.updateTaskStatus(taskId, TaskStatus.PARAMETER_ESTIMATION, 65, '运行参数估计 (MCMC)');
      await this.delay(3000);
      const estimationResult = await this.runEstimation(taskId);

      if (estimationResult.snr < SNR_THRESHOLD) {
        this.triggerAlert(
          taskId,
          AlertLevel.LEVEL_2,
          'low_snr',
          `信噪比为 ${estimationResult.snr.toFixed(2)}，低于检测阈值 ${SNR_THRESHOLD}，可能影响参数估计精度`
        );
      }

      this.updateProgress(taskId, 100, '参数估计完成');
      dataStore.updateTaskStatus(taskId, TaskStatus.COMPLETED, 100, '分析完成，等待验证');

      const task = dataStore.getTaskById(taskId);
      if (task) {
        const deviationCheck = dataStore.checkSensitivityDeviation(task.detectorConfigId);
        if (deviationCheck.exceedsThreshold) {
          dataStore.setQualityPaused(true);
          this.triggerAlert(
            taskId,
            AlertLevel.LEVEL_1,
            'sensitivity_deviation',
            `同一探测器构型连续三次模拟的灵敏度假定偏差为 ${deviationCheck.deviation.toFixed(2)}%，超过10%阈值，系统已暂停新任务`
          );
        }
      }

      setTimeout(() => {
        dataStore.updateTaskStatus(taskId, TaskStatus.PENDING_VERIFICATION, 100, '待数据验证员验证');
      }, 500);

    } catch (error) {
      dataStore.updateTaskStatus(taskId, TaskStatus.ERROR, 0, '任务执行出错');
    }
  }

  private updateProgress(taskId: string, progress: number, step: string): void {
    const task = dataStore.getTaskById(taskId);
    if (task) {
      dataStore.updateTaskStatus(taskId, task.status, progress, step);
    }
  }

  private async buildModel(taskId: string): Promise<void> {
    const task = dataStore.getTaskById(taskId);
    if (!task) return;

    const detector = dataStore.getDetectorConfigById(task.detectorConfigId);
    if (!detector) return;

    const response = interferometerService.buildInterferometerResponse(detector);
    const photonStats = interferometerService.computePhotonCountStats(detector);

    console.log(`[Task ${taskId}] 干涉仪模型构建完成：`);
    console.log(`  - 臂长: ${response.armLength}m`);
    console.log(`  - 精细度: ${response.finesse}`);
    console.log(`  - 光子计数噪声: ${photonStats.photonNoise.toExponential(2)}`);
  }

  private async simulateNoise(taskId: string): Promise<{ isStationary: boolean; varianceRatio: number; pValue: number }> {
    const task = dataStore.getTaskById(taskId);
    if (!task) return { isStationary: true, varianceRatio: 0, pValue: 1 };

    const detector = dataStore.getDetectorConfigById(task.detectorConfigId);
    const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);
    if (!detector || !noiseModel) return { isStationary: true, varianceRatio: 0, pValue: 1 };

    const sensitivity = interferometerService.computeSensitivityCurve(detector, noiseModel, { min: 10, max: 2000 });
    const timeDomainNoise = noiseSimulationService.generateTimeDomainNoise(sensitivity, 8, 4096);
    const stationarity = noiseSimulationService.checkNoiseStationarity(timeDomainNoise);

    const result = dataStore.getResult(taskId);
    if (result) {
      result.sensitivityCurve = sensitivity;
      result.noisePowerSpectrum = {
        frequencies: sensitivity.frequencies,
        values: sensitivity.values.map(v => v * v),
      };
      result.combinedData = timeDomainNoise;
    }

    return stationarity;
  }

  private async injectSignal(taskId: string): Promise<void> {
    const task = dataStore.getTaskById(taskId);
    if (!task) return;

    const signal = parameterEstimationService.generateInspiralWaveform(
      task.signalSource,
      4096,
      8
    );

    const result = dataStore.getResult(taskId);
    if (result) {
      result.injectedSignal = signal;
      const combined = result.combinedData;
      if (combined && combined.values.length === signal.values.length) {
        combined.values = combined.values.map((v, i) => v + signal.values[i]);
      }
    }
  }

  private async runEstimation(taskId: string) {
    const task = dataStore.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const detector = dataStore.getDetectorConfigById(task.detectorConfigId);
    const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);
    if (!detector || !noiseModel) throw new Error('Config not found');

    const sensitivity = interferometerService.computeSensitivityCurve(detector, noiseModel, { min: 10, max: 2000 });
    const result = parameterEstimationService.runFullAnalysis(task.signalSource, detector, sensitivity);
    result.taskId = taskId;

    dataStore.setResult(taskId, result);
    return result;
  }

  triggerAlert(
    taskId: string,
    level: AlertLevel,
    type: 'low_snr' | 'non_stationary_noise' | 'sensitivity_deviation',
    message: string
  ): void {
    const task = dataStore.getTaskById(taskId);
    dataStore.addAlert({
      taskId,
      taskName: task?.name,
      level,
      type,
      message,
    });
  }

  reviewAndAdjust(
    alertId: string,
    reviewedBy: string,
    comment: string,
    adjustmentType: string,
    newParams: Record<string, unknown>
  ): boolean {
    const alert = dataStore.getAlertById(alertId);
    if (!alert) return false;

    dataStore.reviewAlert(alertId, reviewedBy, comment, 'resolved');

    dataStore.addAdjustmentLog({
      taskId: alert.taskId,
      alertId,
      adjustmentType,
      previousParams: {},
      newParams,
      adjustedBy: reviewedBy,
      description: comment,
    });

    const task = dataStore.getTaskById(alert.taskId);
    if (task && task.status === TaskStatus.FALLBACK) {
      dataStore.updateTaskStatus(alert.taskId, TaskStatus.NOISE_SIMULATION, 30, '模型调整后重新计算');
      this.runTaskPipeline(alert.taskId);
    }

    return true;
  }

  approveVerification(taskId: string, approver: string, comment: string): boolean {
    const task = dataStore.getTaskById(taskId);
    if (!task || task.status !== TaskStatus.PENDING_VERIFICATION) return false;

    dataStore.addApproval({
      taskId,
      level: 'verification',
      approver,
      decision: 'approved',
      comment,
    });

    dataStore.updateTaskStatus(taskId, TaskStatus.PENDING_CONFIRMATION, 100, '待项目负责人确认');
    return true;
  }

  rejectVerification(taskId: string, approver: string, comment: string): boolean {
    const task = dataStore.getTaskById(taskId);
    if (!task || task.status !== TaskStatus.PENDING_VERIFICATION) return false;

    dataStore.addApproval({
      taskId,
      level: 'verification',
      approver,
      decision: 'rejected',
      comment,
    });

    dataStore.updateTaskStatus(taskId, TaskStatus.FALLBACK, 80, '验证驳回，退回调整');
    return true;
  }

  approveConfirmation(taskId: string, approver: string, comment: string): boolean {
    const task = dataStore.getTaskById(taskId);
    if (!task || task.status !== TaskStatus.PENDING_CONFIRMATION) return false;

    dataStore.addApproval({
      taskId,
      level: 'confirmation',
      approver,
      decision: 'approved',
      comment,
    });

    dataStore.updateTaskStatus(taskId, TaskStatus.APPROVED, 100, '已通过审批，推送至公告系统');
    this.pushToAnnouncementSystem(taskId);
    return true;
  }

  rejectConfirmation(taskId: string, approver: string, comment: string): boolean {
    const task = dataStore.getTaskById(taskId);
    if (!task || task.status !== TaskStatus.PENDING_CONFIRMATION) return false;

    dataStore.addApproval({
      taskId,
      level: 'confirmation',
      approver,
      decision: 'rejected',
      comment,
    });

    dataStore.updateTaskStatus(taskId, TaskStatus.FALLBACK, 85, '确认驳回，退回调整');
    return true;
  }

  private pushToAnnouncementSystem(taskId: string): void {
    const task = dataStore.getTaskById(taskId);
    console.log(`[公告系统] 任务 ${task?.name || taskId} 已推送到天文事件公告系统`);
  }

  resumeQualityControl(): void {
    dataStore.setQualityPaused(false);
    console.log('[系统] 质量暂停已解除，新任务可以提交');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cancelTask(taskId: string): boolean {
    const timeout = this.activeTasks.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTasks.delete(taskId);
    }
    return true;
  }
}

export const workflowEngine = new WorkflowEngine();
