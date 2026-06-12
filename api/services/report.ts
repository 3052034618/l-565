import { dataStore } from './store';
import { EstimationResult, AnalysisTask, DetectorConfig } from '../../shared/types';
import PDFDocument from 'pdfkit';

class ReportService {
  generateReportData(taskId: string): {
    task: AnalysisTask;
    result: EstimationResult;
    detector: DetectorConfig | undefined;
    noiseDisplayName: string;
    noiseDisplayVersion: string;
    detectorDisplayName: string;
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
    const noiseModel = dataStore.getNoiseModelById(task.noiseModelId);

    const detectorDisplayName = task.uploadedDetectorFile?.parsedDetectorConfig?.name || detector?.name || '未知探测器';
    const noiseDisplayName = task.uploadedNoiseFile?.parsedNoiseModel?.name || noiseModel?.name || '未知噪声模型';
    const noiseDisplayVersion = task.uploadedNoiseFile?.parsedNoiseModel?.version || noiseModel?.version || 'v1.0';

    const m1 = result.mass1.median;
    const m2 = result.mass2.median;
    const totalMass = m1 + m2;
    const chirpMass = Math.pow((m1 * m2), 3 / 5) / Math.pow(totalMass, 1 / 5);

    const effectiveSpin = (result.spin1.median * m1 + result.spin2.median * m2) / totalMass;

    return {
      task,
      result,
      detector,
      noiseDisplayName,
      noiseDisplayVersion,
      detectorDisplayName,
      summary: {
        snr: result.snr,
        logLikelihood: result.logLikelihood,
        totalMass,
        chirpMass,
        effectiveSpin,
      },
    };
  }

  generatePDFReport(taskId: string): Promise<{ success: boolean; message: string; buffer?: Buffer; filename?: string }> {
    const reportData = this.generateReportData(taskId);
    if (!reportData) {
      return Promise.resolve({ success: false, message: '任务或结果不存在' });
    }

    const { task, result, detector, summary, detectorDisplayName, noiseDisplayName, noiseDisplayVersion } = reportData;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `引力波分析报告 - ${task.name}`,
        Author: '引力波探测器干涉仪分析平台',
        Subject: '引力波分析报告',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const CYAN = '#00d4ff';
    const DARK_BG = '#0a1628';
    const LIGHT_TEXT = '#ffffff';
    const GRAY_TEXT = '#a0b4c8';

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK_BG);

    doc.fillColor(LIGHT_TEXT).fontSize(28).text('引力波分析报告', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor(CYAN).fontSize(14).text('Gravitational Wave Analysis Report', { align: 'center' });
    doc.moveDown(2);

    doc.fillColor(GRAY_TEXT).fontSize(11).text(`任务名称: ${task.name}`, { align: 'center' });
    doc.text(`任务ID: ${task.id}`, { align: 'center' });
    doc.text(`生成时间: ${new Date().toISOString()}`, { align: 'center' });

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK_BG);
    doc.fillColor(CYAN).fontSize(18).text('一、任务概述');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    const summaryItems = [
      { label: '任务名称', value: task.name },
      { label: '任务ID', value: task.id },
      { label: '创建时间', value: new Date(task.createdAt).toLocaleString('zh-CN') },
      { label: '创建者', value: task.createdBy || 'N/A' },
      { label: '任务状态', value: task.status },
      { label: '探测器', value: detectorDisplayName },
      { label: '噪声模型', value: `${noiseDisplayName} (${noiseDisplayVersion})` },
    ];

    summaryItems.forEach(item => {
      doc.fillColor(GRAY_TEXT).text(`${item.label}: `, { continued: true });
      doc.fillColor(LIGHT_TEXT).text(item.value);
    });

    doc.moveDown(2);
    doc.fillColor(CYAN).fontSize(18).text('二、关键参数摘要');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    const keyParams = [
      { label: '信噪比 (SNR)', value: summary.snr.toFixed(2) },
      { label: '对数似然', value: summary.logLikelihood.toFixed(2) },
      { label: '总质量 (M☉)', value: summary.totalMass.toFixed(2) },
      { label: '啁啾质量 (M☉)', value: summary.chirpMass.toFixed(4) },
      { label: '有效自旋', value: summary.effectiveSpin.toFixed(4) },
      { label: '距离 (Mpc)', value: `${result.distance.median.toFixed(2)} +${(result.distance.upper68 - result.distance.median).toFixed(2)} / -${(result.distance.median - result.distance.lower68).toFixed(2)}` },
    ];

    keyParams.forEach(item => {
      doc.fillColor(GRAY_TEXT).text(`${item.label}: `, { continued: true });
      doc.fillColor(CYAN).text(item.value);
    });

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK_BG);
    doc.fillColor(CYAN).fontSize(18).text('三、探测器参数');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    const armLength = task.uploadedDetectorFile?.parsedDetectorConfig?.armLength ?? detector?.armLength ?? 0;
    const laserPower = task.uploadedDetectorFile?.parsedDetectorConfig?.laserPower ?? detector?.laserPower ?? 0;

    const detectorParams = [
      { label: '探测器名称', value: detectorDisplayName },
      { label: '臂长', value: `${armLength} m` },
      { label: '激光功率', value: `${laserPower} W` },
      { label: '激光波长', value: `${detector?.wavelength || 1064} nm` },
      { label: '镜面质量', value: `${detector?.mirrorMass || 40} kg` },
      { label: '悬挂类型', value: detector?.suspensionType || '石英纤维' },
      { label: '构型', value: detector?.configuration || '双干涉仪' },
    ];

    detectorParams.forEach(item => {
      doc.fillColor(GRAY_TEXT).text(`${item.label}: `, { continued: true });
      doc.fillColor(LIGHT_TEXT).text(item.value);
    });

    doc.moveDown(2);
    doc.fillColor(CYAN).fontSize(18).text('四、噪声模型');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    doc.fillColor(GRAY_TEXT).text('噪声模型: ', { continued: true });
    doc.fillColor(LIGHT_TEXT).text(noiseDisplayName);
    doc.fillColor(GRAY_TEXT).text('模型版本: ', { continued: true });
    doc.fillColor(CYAN).text(noiseDisplayVersion);

    if (task.uploadedNoiseFile) {
      doc.fillColor(GRAY_TEXT).text('数据来源: ', { continued: true });
      doc.fillColor(LIGHT_TEXT).text('用户上传文件');
    }

    doc.moveDown(1);
    doc.fillColor(GRAY_TEXT).text('频率范围: ', { continued: true });
    doc.fillColor(LIGHT_TEXT).text(`${result.sensitivityCurve.frequencies[0].toFixed(1)} - ${result.sensitivityCurve.frequencies[result.sensitivityCurve.frequencies.length - 1].toFixed(0)} Hz`);
    doc.fillColor(GRAY_TEXT).text('采样点数: ', { continued: true });
    doc.fillColor(LIGHT_TEXT).text(result.sensitivityCurve.frequencies.length.toString());

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK_BG);
    doc.fillColor(CYAN).fontSize(18).text('五、信号源参数');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    const signalParams = [
      { label: '信号类型', value: task.signalSource.type },
      { label: '质量 1 (M☉)', value: task.signalSource.mass1?.toString() || 'N/A' },
      { label: '质量 2 (M☉)', value: task.signalSource.mass2?.toString() || 'N/A' },
      { label: '自旋 1', value: task.signalSource.spin1?.toString() || 'N/A' },
      { label: '自旋 2', value: task.signalSource.spin2?.toString() || 'N/A' },
      { label: '距离 (Mpc)', value: task.signalSource.distance?.toString() || 'N/A' },
      { label: '倾角 (°)', value: task.signalSource.inclination?.toString() || 'N/A' },
    ];

    signalParams.forEach(item => {
      doc.fillColor(GRAY_TEXT).text(`${item.label}: `, { continued: true });
      doc.fillColor(LIGHT_TEXT).text(item.value);
    });

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK_BG);
    doc.fillColor(CYAN).fontSize(18).text('六、参数估计结果');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    doc.text('以下为 MCMC 参数估计的中位数及误差：');
    doc.moveDown(1);

    const estParams = [
      { label: '质量 1 (M☉)', value: result.mass1.median, lower: result.mass1.lower68, upper: result.mass1.upper68 },
      { label: '质量 2 (M☉)', value: result.mass2.median, lower: result.mass2.lower68, upper: result.mass2.upper68 },
      { label: '自旋 1', value: result.spin1.median, lower: result.spin1.lower68, upper: result.spin1.upper68 },
      { label: '自旋 2', value: result.spin2.median, lower: result.spin2.lower68, upper: result.spin2.upper68 },
      { label: '光度距离 (Mpc)', value: result.distance.median, lower: result.distance.lower68, upper: result.distance.upper68 },
    ];

    estParams.forEach(item => {
      const errPlus = (item.upper - item.value).toFixed(4);
      const errMinus = (item.value - item.lower).toFixed(4);
      doc.fillColor(GRAY_TEXT).text(`${item.label}: `, { continued: true });
      doc.fillColor(LIGHT_TEXT).text(`${item.value.toFixed(4)} +${errPlus} / -${errMinus}`);
    });

    doc.moveDown(2);
    doc.fillColor(CYAN).fontSize(18).text('七、结论');
    doc.moveDown(1);
    doc.fillColor(LIGHT_TEXT).fontSize(11);

    const snrLevel = summary.snr >= 20 ? '高置信度' : summary.snr >= 10 ? '中等置信度' : '低置信度';
    doc.text(`本次分析检测到引力波信号，信噪比为 ${summary.snr.toFixed(2)}，属于${snrLevel}检测。`);
    doc.moveDown(0.5);
    doc.text(`源为双致密星并合系统，总质量约 ${summary.totalMass.toFixed(2)} M☉，啁啾质量约 ${summary.chirpMass.toFixed(4)} M☉。`);
    doc.moveDown(0.5);
    doc.text(`距离估计约 ${result.distance.median.toFixed(2)} Mpc (68% 置信区间: ${result.distance.lower68.toFixed(2)} - ${result.distance.upper68.toFixed(2)} Mpc)。`);

    doc.moveDown(3);
    doc.fillColor(GRAY_TEXT).fontSize(9).text('—— 引力波探测器干涉仪分析平台 ——', { align: 'center' });

    doc.end();

    return new Promise<{ success: boolean; message: string; buffer?: Buffer; filename?: string }>((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const safeName = task.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
        resolve({
          success: true,
          message: 'PDF报告生成成功',
          buffer,
          filename: `GW_Report_${safeName}_${task.id}.pdf`,
        });
      });
    });
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
    const allTasks = dataStore.getTasks({ detectorConfigId });
    const noiseModels = dataStore.getNoiseModels();
    
    const tasks = allTasks.filter((t) => {
      const taskDate = new Date(t.createdAt);
      const dateInRange = taskDate >= new Date(timeWindowStart) && taskDate <= new Date(timeWindowEnd + 'T23:59:59');
      
      const uploadedVersion = t.uploadedNoiseFile?.parsedNoiseModel?.version;
      const baseNoiseModel = noiseModels.find(m => m.id === t.noiseModelId);
      const taskVersion = uploadedVersion || baseNoiseModel?.version || '';
      const noiseMatch = taskVersion === noiseModelVersion || noiseModelVersion === 'all';
      
      return dateInRange && noiseMatch;
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
        const detector = dataStore.getDetectorConfigById(t.detectorConfigId);
        const noiseModel = dataStore.getNoiseModelById(t.noiseModelId);
        const uploadedDetectorConfig = t.uploadedDetectorFile?.parsedDetectorConfig;
        const uploadedNoiseModel = t.uploadedNoiseFile?.parsedNoiseModel;

        const detectorName = uploadedDetectorConfig?.name || detector?.name || '';
        const noiseModelName = uploadedNoiseModel?.name || noiseModel?.name || '';
        const noiseModelVersionOut = uploadedNoiseModel?.version || noiseModel?.version || '';

        return {
          taskId: t.id,
          taskName: t.name,
          status: t.status,
          createdAt: t.createdAt,
          signalSource: t.signalSource,
          detector: {
            id: t.detectorConfigId,
            name: detectorName,
            armLength: uploadedDetectorConfig?.armLength ?? detector?.armLength,
            laserPower: uploadedDetectorConfig?.laserPower ?? detector?.laserPower,
            fromUpload: !!uploadedDetectorConfig,
          },
          noiseModel: {
            id: t.noiseModelId,
            name: noiseModelName,
            version: noiseModelVersionOut,
            fromUpload: !!uploadedNoiseModel,
          },
          uploadedFiles: {
            detectorFile: t.uploadedDetectorFile ? {
              fileName: t.uploadedDetectorFile.fileName,
              uploadedAt: t.uploadedDetectorFile.uploadedAt,
            } : null,
            noiseFile: t.uploadedNoiseFile ? {
              fileName: t.uploadedNoiseFile.fileName,
              uploadedAt: t.uploadedNoiseFile.uploadedAt,
            } : null,
          },
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
