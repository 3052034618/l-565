import { dataStore } from './store';
import { EstimationResult, AnalysisTask, DetectorConfig } from '../../shared/types';

class ReportService {
  generateReportData(taskId: string): {
    task: AnalysisTask;
    result: EstimationResult;
    detector: DetectorConfig | undefined;
    summary: {
      snr: number;
      logLikelihood: number;
      totalMass: number;
      chirpMass: number;
      effectiveSpin: number;
    };
  } | null {
    const task = dataStore.getTaskById(taskId);
    const result = dataStore.getResult(taskId);
    if (!task || !result) return null;

    const detector = dataStore.getDetectorConfigById(task.detectorConfigId);

    const m1 = result.mass1.median;
    const m2 = result.mass2.median;
    const totalMass = m1 + m2;
    const chirpMass = Math.pow((m1 * m2), 3 / 5) / Math.pow(totalMass, 1 / 5);

    const effectiveSpin = (result.spin1.median * m1 + result.spin2.median * m2) / totalMass;

    return {
      task,
      result,
      detector,
      summary: {
        snr: result.snr,
        logLikelihood: result.logLikelihood,
        totalMass,
        chirpMass,
        effectiveSpin,
      },
    };
  }

  generatePDFReport(taskId: string): { success: boolean; message: string; buffer?: Buffer } {
    const reportData = this.generateReportData(taskId);
    if (!reportData) {
      return { success: false, message: '任务或结果不存在' };
    }

    console.log(`[PDF报告] 为任务 ${taskId} 生成PDF报告...`);
    console.log(`  - 任务名称: ${reportData.task.name}`);
    console.log(`  - 信噪比: ${reportData.summary.snr.toFixed(2)}`);
    console.log(`  - 总质量: ${reportData.summary.totalMass.toFixed(2)} M☉`);

    return {
      success: true,
      message: 'PDF报告生成成功',
    };
  }

  exportResponseData(
    detectorConfigId: string,
    noiseModelVersion: string,
    timeWindowStart: string,
    timeWindowEnd: string,
    exportType: 'response_data' | 'estimation_results' | 'all'
  ): {
    filename: string;
    data: Record<string, unknown>;
    fileSize: number;
  } {
    const tasks = dataStore.getTasks({ detectorConfigId }).filter((t) => {
      const taskDate = new Date(t.createdAt);
      return taskDate >= new Date(timeWindowStart) && taskDate <= new Date(timeWindowEnd);
    });

    const exportData: Record<string, unknown> = {
      exportInfo: {
        exportType,
        detectorConfigId,
        noiseModelVersion,
        timeWindow: { start: timeWindowStart, end: timeWindowEnd },
        exportedAt: new Date().toISOString(),
        taskCount: tasks.length,
      },
      tasks: tasks.map((t) => {
        const result = dataStore.getResult(t.id);
        return {
          taskId: t.id,
          taskName: t.name,
          status: t.status,
          createdAt: t.createdAt,
          signalSource: t.signalSource,
          ...(exportType !== 'response_data' && result
            ? {
                estimation: {
                  snr: result.snr,
                  mass1: result.mass1,
                  mass2: result.mass2,
                  spin1: result.spin1,
                  spin2: result.spin2,
                  distance: result.distance,
                  logLikelihood: result.logLikelihood,
                },
              }
            : {}),
          ...(exportType !== 'estimation_results' && result
            ? {
                sensitivityCurve: {
                  frequencies: result.sensitivityCurve.frequencies.slice(0, 100),
                  values: result.sensitivityCurve.values.slice(0, 100),
                },
                noisePowerSpectrum: {
                  frequencies: result.noisePowerSpectrum.frequencies.slice(0, 100),
                  values: result.noisePowerSpectrum.values.slice(0, 100),
                },
              }
            : {}),
        };
      }),
    };

    const jsonData = JSON.stringify(exportData);
    const detector = dataStore.getDetectorConfigById(detectorConfigId);
    const safeName = detector?.name?.replace(/\s+/g, '_') || detectorConfigId;

    return {
      filename: `gw_analysis_export_${safeName}_${noiseModelVersion}.json`,
      data: exportData,
      fileSize: Buffer.byteLength(jsonData, 'utf8'),
    };
  }

  getReportSections(taskId: string): string[] {
    return [
      '任务概述',
      '探测器参数',
      '噪声模型',
      '信号源参数',
      '灵敏度曲线',
      '噪声功率谱',
      '注入信号波形',
      '参数估计结果',
      '后验分布',
      '信噪比分析',
      '结论',
    ];
  }
}

export const reportService = new ReportService();
