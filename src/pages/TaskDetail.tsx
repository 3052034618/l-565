import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Play,
  RotateCcw,
  FileCheck,
  XCircle,
  File,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  SensitivityChart,
  NoiseComponentsChart,
  WaveformChart,
  PosteriorHistogram,
  CornerPlot,
} from '@/components/charts/GWCharts';
import { TaskStatusBadge, AlertLevelBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/StatCard';
import { TaskStatus, AlertLevel } from '@shared/types';
import { generatePDFReport } from '@/utils/pdfReport';

const statusSteps = [
  { key: TaskStatus.PENDING_VALIDATION, label: '待校验', icon: '⏳' },
  { key: TaskStatus.MODEL_BUILDING, label: '模型构建', icon: '🔬' },
  { key: TaskStatus.NOISE_SIMULATION, label: '噪声模拟', icon: '📊' },
  { key: TaskStatus.SIGNAL_INJECTION, label: '信号注入', icon: '📡' },
  { key: TaskStatus.PARAMETER_ESTIMATION, label: '参数估计', icon: '📈' },
  { key: TaskStatus.COMPLETED, label: '分析完成', icon: '✅' },
];

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTask,
    currentResult,
    taskAlerts,
    taskApprovals,
    taskAdjustmentLogs,
    currentDetector,
    currentNoiseModel,
    fetchTaskDetail,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'sensitivity' | 'noise' | 'waveform' | 'posterior' | 'approvals' | 'alerts'>('overview');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const detectorDisplayName = currentTask?.uploadedDetectorFile?.parsedDetectorConfig?.name || currentDetector?.name || '-';
  const noiseModelDisplayName = currentTask?.uploadedNoiseFile?.parsedNoiseModel?.name || currentNoiseModel?.name || '-';
  const noiseModelDisplayVersion = currentTask?.uploadedNoiseFile?.parsedNoiseModel?.version || currentNoiseModel?.version || '-';

  const handleGeneratePDF = async () => {
    if (!currentTask || !currentResult) return;

    setGeneratingPDF(true);
    try {
      const res = await fetch(`/api/report/${currentTask.id}/pdf`);
      if (!res.ok) throw new Error('获取报告数据失败');
      const reportData = await res.json();

      generatePDFReport({
        taskName: reportData.taskName,
        taskId: reportData.taskId,
        createdAt: reportData.createdAt,
        detectorName: reportData.detectorName,
        noiseModelVersion: reportData.noiseModelVersion,
        signalSourceType: reportData.signalSourceType,
        mass1: reportData.mass1,
        mass2: reportData.mass2,
        spin1: reportData.spin1,
        spin2: reportData.spin2,
        distance: reportData.distance,
        snr: reportData.snr,
        sensitivityFrequencies: reportData.sensitivityCurve.frequencies,
        sensitivityValues: reportData.sensitivityCurve.values,
        noiseFrequencies: reportData.noisePowerSpectrum.frequencies,
        noiseValues: reportData.noisePowerSpectrum.values,
        waveformTimes: reportData.injectedSignal.times,
        waveformValues: reportData.injectedSignal.values,
        mass1Posterior: reportData.posteriorSamples.mass1,
        mass2Posterior: reportData.posteriorSamples.mass2,
        spin1Posterior: reportData.posteriorSamples.spin1,
        spin2Posterior: reportData.posteriorSamples.spin2,
        distancePosterior: reportData.posteriorSamples.distance,
        mass1True: reportData.mass1,
        mass2True: reportData.mass2,
        spin1True: reportData.spin1,
        spin2True: reportData.spin2,
        distanceTrue: reportData.distance,
      });
    } catch (err) {
      console.error('PDF生成失败:', err);
      alert('报告生成失败，请稍后重试');
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTaskDetail(id);
      const interval = setInterval(() => {
        fetchTaskDetail(id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-space-400">加载中...</div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === currentTask.status);
  const isRunning = currentStepIndex >= 0 && currentStepIndex < 5;
  const hasResults = currentResult && currentTask.progress >= 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 rounded-lg text-space-400 hover:text-space-200 hover:bg-space-800/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-space-100">
                {currentTask.name}
              </h1>
              <TaskStatusBadge status={currentTask.status as TaskStatus} />
            </div>
            <p className="text-space-400 text-sm mt-1">
              任务ID: {currentTask.id} · 创建于{' '}
              {new Date(currentTask.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <button className="px-3 py-1.5 bg-space-800/50 text-space-300 text-sm rounded-lg hover:bg-space-700/50 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          )}
          {currentTask.status === TaskStatus.PENDING_VALIDATION && (
            <button className="px-4 py-2 bg-gradient-to-r from-cyber-500 to-cyber-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-glow-cyan">
              <Play className="w-4 h-4" />
              启动分析
            </button>
          )}
          {hasResults && (
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-cyber-500/20 text-cyber-300 text-sm font-medium rounded-lg hover:bg-cyber-500/30 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {generatingPDF ? '生成中...' : '生成报告'}
            </button>
          )}
          {hasResults && (
            <button className="px-4 py-2 bg-signal-green/20 text-signal-green text-sm font-medium rounded-lg hover:bg-signal-green/30 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              导出数据
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-space-400 mb-4">任务进度</h3>
        <div className="relative">
          <div className="flex justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 w-full h-0.5 ${
                        isCompleted ? 'bg-cyber-400' : 'bg-space-700'
                      }`}
                    />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm relative z-10 ${
                      isCompleted
                        ? 'bg-cyber-500 text-white'
                        : isCurrent
                        ? 'bg-cyber-500/30 text-cyber-300 border-2 border-cyber-400 animate-pulse'
                        : 'bg-space-800 text-space-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.icon}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isCurrent
                        ? 'text-cyber-300 font-medium'
                        : isCompleted
                        ? 'text-space-300'
                        : 'text-space-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6">
          <ProgressBar
            value={currentTask.progress}
            label={currentTask.currentStep}
            color={isRunning ? 'cyan' : 'green'}
          />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-space-800/50 rounded-lg w-fit">
        {[
          { key: 'overview', label: '概览', icon: Activity },
          { key: 'sensitivity', label: '灵敏度', icon: Activity },
          { key: 'noise', label: '噪声谱', icon: Activity },
          { key: 'waveform', label: '波形', icon: Activity },
          { key: 'posterior', label: '后验分布', icon: Activity },
          { key: 'approvals', label: '审批记录', icon: CheckCircle },
          { key: 'alerts', label: `预警 (${taskAlerts.filter(a => a.status === 'pending').length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                activeTab === tab.key
                  ? 'bg-cyber-500/20 text-cyber-300'
                  : 'text-space-400 hover:text-space-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-space-100 mb-4">参数配置</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">探测器构型</p>
                  <p className="text-sm font-medium text-space-100">{detectorDisplayName}</p>
                </div>
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">噪声模型</p>
                  <p className="text-sm font-medium text-space-100">{noiseModelDisplayName} ({noiseModelDisplayVersion})</p>
                </div>
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">信号源类型</p>
                  <p className="text-sm font-medium text-space-100">{currentTask.signalSource.type}</p>
                </div>
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">质量 1</p>
                  <p className="text-sm font-medium text-space-100 font-mono">
                    {currentTask.signalSource.mass1} M☉
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">质量 2</p>
                  <p className="text-sm font-medium text-space-100 font-mono">
                    {currentTask.signalSource.mass2} M☉
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-space-800/30">
                  <p className="text-xs text-space-400 mb-1">距离</p>
                  <p className="text-sm font-medium text-space-100 font-mono">
                    {currentTask.signalSource.distance} Mpc
                  </p>
                </div>
              </div>
            </div>

            {(currentTask.uploadedDetectorFile || currentTask.uploadedNoiseFile) && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-space-100 mb-4">上传文件信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTask.uploadedDetectorFile && (
                    <div className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-cyber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-space-100 truncate">
                            {currentTask.uploadedDetectorFile.fileName}
                          </p>
                          <p className="text-xs text-space-400 mt-1">
                            {(currentTask.uploadedDetectorFile.fileSize / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-cyber-400 mt-1">
                            探测器构型: {detectorDisplayName}
                          </p>
                          {currentTask.uploadedDetectorFile?.parsedDetectorConfig?.armLength !== undefined && (
                            <p className="text-xs text-space-400 mt-1">
                              臂长: {currentTask.uploadedDetectorFile.parsedDetectorConfig.armLength} m
                              {currentTask.uploadedDetectorFile.parsedDetectorConfig.laserPower !== undefined && (
                                <> · 激光功率: {currentTask.uploadedDetectorFile.parsedDetectorConfig.laserPower} W</>
                              )}
                            </p>
                          )}
                          <p className="text-xs text-space-500 mt-1">
                            上传于 {new Date(currentTask.uploadedDetectorFile.uploadedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentTask.uploadedNoiseFile && (
                    <div className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-signal-purple/20 flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-signal-purple" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-space-100 truncate">
                            {currentTask.uploadedNoiseFile.fileName}
                          </p>
                          <p className="text-xs text-space-400 mt-1">
                            {(currentTask.uploadedNoiseFile.fileSize / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-signal-purple mt-1">
                            噪声版本: {noiseModelDisplayName} ({noiseModelDisplayVersion})
                          </p>
                          {currentTask.uploadedNoiseFile?.parsedNoiseModel?.spectrum && (
                            <p className="text-xs text-space-400 mt-1">
                              含自定义谱数据: {currentTask.uploadedNoiseFile.parsedNoiseModel.spectrum.frequencies.length} 个频点
                            </p>
                          )}
                          <p className="text-xs text-space-500 mt-1">
                            上传于 {new Date(currentTask.uploadedNoiseFile.uploadedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentResult && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-space-100 mb-4">灵敏度曲线</h3>
                <SensitivityChart sensitivityCurve={currentResult.sensitivityCurve} height={250} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-space-100 mb-4">统计信息</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-space-400">预计耗时</span>
                  <span className="text-sm font-medium text-space-100 font-mono">
                    {currentTask.estimatedTime || 120} 秒
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-space-400">已用时间</span>
                  <span className="text-sm font-medium text-cyber-300 font-mono">
                    {currentTask.elapsedTime || 0} 秒
                  </span>
                </div>
                {currentResult && (
                  <>
                    <div className="border-t border-cyber-500/10 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-space-400">信噪比 (SNR)</span>
                        <span
                          className={`text-sm font-bold font-mono ${
                            currentResult.snr >= 8 ? 'text-signal-green' : 'text-signal-orange'
                          }`}
                        >
                          {currentResult.snr.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-space-400">对数似然</span>
                        <span className="text-sm font-medium text-space-100 font-mono">
                          {currentResult.logLikelihood.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {taskAlerts.filter(a => a.status === 'pending').length > 0 && (
              <div className="glass-card p-6 border-signal-orange/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-signal-orange" />
                  <h3 className="text-lg font-semibold text-space-100">活跃预警</h3>
                </div>
                <div className="space-y-3">
                  {taskAlerts
                    .filter((a) => a.status === 'pending')
                    .slice(0, 3)
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg bg-space-800/50 border-l-2 border-signal-orange"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertLevelBadge level={alert.level as AlertLevel} size="sm" />
                        </div>
                        <p className="text-sm text-space-200 line-clamp-2">{alert.message}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {taskAdjustmentLogs.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-space-100 mb-4">调整日志</h3>
                <div className="space-y-3">
                  {taskAdjustmentLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-space-800/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-cyber-400">{log.adjustmentType}</span>
                        <span className="text-xs text-space-500">
                          {new Date(log.adjustedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-space-300">{log.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sensitivity' && currentResult && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-space-100 mb-4">灵敏度曲线</h3>
          <SensitivityChart sensitivityCurve={currentResult.sensitivityCurve} height={400} />
        </div>
      )}

      {activeTab === 'noise' && currentResult && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-space-100 mb-4">噪声功率谱分量</h3>
          {currentNoiseModel && currentDetector && (
            <NoiseComponentsChart
              frequencies={currentResult.sensitivityCurve.frequencies}
              seismic={currentResult.noisePowerSpectrum.values.map(v => v * 0.3)}
              thermal={currentResult.noisePowerSpectrum.values.map(v => v * 0.2)}
              shot={currentResult.noisePowerSpectrum.values.map(v => v * 0.4)}
              radiationPressure={currentResult.noisePowerSpectrum.values.map(v => v * 0.1)}
              total={currentResult.noisePowerSpectrum.values}
              height={400}
            />
          )}
        </div>
      )}

      {activeTab === 'waveform' && currentResult && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">注入信号波形</h3>
            <WaveformChart
              times={currentResult.injectedSignal.times}
              signal={currentResult.injectedSignal.values}
              height={300}
            />
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">含噪声数据</h3>
            <WaveformChart
              times={currentResult.combinedData.times}
              signal={currentResult.injectedSignal.values}
              combined={currentResult.combinedData.values}
              height={300}
            />
          </div>
        </div>
      )}

      {activeTab === 'posterior' && currentResult && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">参数后验分布</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-space-800/30">
                <p className="text-sm text-space-400 mb-2">质量 1 (M☉)</p>
                <PosteriorHistogram
                  samples={currentResult.posteriorSamples.mass1}
                  parameterName="质量1"
                  unit="M☉"
                  height={120}
                  color="#00d4ff"
                />
                <p className="text-sm font-mono text-signal-green mt-2">
                  {currentResult.mass1.median.toFixed(2)}
                  <span className="text-space-500 text-xs ml-1">
                    +{currentResult.mass1.upper68.toFixed(2)} / -{currentResult.mass1.lower68.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-space-800/30">
                <p className="text-sm text-space-400 mb-2">质量 2 (M☉)</p>
                <PosteriorHistogram
                  samples={currentResult.posteriorSamples.mass2}
                  parameterName="质量2"
                  unit="M☉"
                  height={120}
                  color="#00ff88"
                />
                <p className="text-sm font-mono text-signal-green mt-2">
                  {currentResult.mass2.median.toFixed(2)}
                  <span className="text-space-500 text-xs ml-1">
                    +{currentResult.mass2.upper68.toFixed(2)} / -{currentResult.mass2.lower68.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-space-800/30">
                <p className="text-sm text-space-400 mb-2">自旋 1</p>
                <PosteriorHistogram
                  samples={currentResult.posteriorSamples.spin1}
                  parameterName="自旋1"
                  height={120}
                  color="#ffcc00"
                />
                <p className="text-sm font-mono text-signal-green mt-2">
                  {currentResult.spin1.median.toFixed(3)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-space-800/30">
                <p className="text-sm text-space-400 mb-2">自旋 2</p>
                <PosteriorHistogram
                  samples={currentResult.posteriorSamples.spin2}
                  parameterName="自旋2"
                  height={120}
                  color="#ff6b35"
                />
                <p className="text-sm font-mono text-signal-green mt-2">
                  {currentResult.spin2.median.toFixed(3)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-space-800/30">
                <p className="text-sm text-space-400 mb-2">距离 (Mpc)</p>
                <PosteriorHistogram
                  samples={currentResult.posteriorSamples.distance}
                  parameterName="距离"
                  unit="Mpc"
                  height={120}
                  color="#b388ff"
                />
                <p className="text-sm font-mono text-signal-green mt-2">
                  {currentResult.distance.median.toFixed(1)}
                  <span className="text-space-500 text-xs ml-1">
                    +{currentResult.distance.upper68.toFixed(1)} / -{currentResult.distance.lower68.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">参数联合分布 (角图)</h3>
            <CornerPlot samples={currentResult.posteriorSamples} height={500} />
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">审批记录</h3>
            {taskApprovals.length > 0 ? (
              <div className="space-y-4">
                {taskApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      approval.decision === 'approved'
                        ? 'bg-signal-green/5 border-signal-green/30'
                        : 'bg-signal-red/5 border-signal-red/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            approval.decision === 'approved'
                              ? 'bg-signal-green/20 text-signal-green'
                              : 'bg-signal-red/20 text-signal-red'
                          }`}
                        >
                          {approval.decision === 'approved' ? '通过' : '驳回'}
                        </span>
                        <span className="text-sm text-space-300">
                          {approval.level === 'verification' ? '数据验证' : '项目确认'}
                        </span>
                      </div>
                      <span className="text-xs text-space-500">
                        {new Date(approval.approvedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-space-400">审批人: {approval.approver}</p>
                    {approval.comment && (
                      <p className="text-sm text-space-300 mt-2">意见: {approval.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-space-600 mx-auto mb-3" />
                <p className="text-space-400">暂无审批记录</p>
              </div>
            )}
          </div>

          {currentTask.announcementPush && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-space-100 mb-4">公告系统推送结果</h3>
              <div className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/20">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      currentTask.announcementPush.status === 'success'
                        ? 'bg-signal-green/20'
                        : 'bg-signal-red/20'
                    }`}
                  >
                    {currentTask.announcementPush.status === 'success' ? (
                      <FileCheck className="w-6 h-6 text-signal-green" />
                    ) : (
                      <XCircle className="w-6 h-6 text-signal-red" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          currentTask.announcementPush.status === 'success'
                            ? 'bg-signal-green/20 text-signal-green'
                            : 'bg-signal-red/20 text-signal-red'
                        }`}
                      >
                        {currentTask.announcementPush.status === 'success' ? '推送成功' : '推送失败'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-space-400">事件ID:</span>
                        <span className="text-space-200 font-mono">
                          {currentTask.announcementPush.eventId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-space-400">推送时间:</span>
                        <span className="text-space-200">
                          {new Date(currentTask.announcementPush.pushedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {currentTask.announcementPush.errorMessage && (
                        <div className="flex items-start gap-2">
                          <span className="text-space-400">错误信息:</span>
                          <span className="text-signal-red">
                            {currentTask.announcementPush.errorMessage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-space-100 mb-4">预警记录</h3>
          {taskAlerts.length > 0 ? (
            <div className="space-y-4">
              {taskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.level === AlertLevel.LEVEL_1
                      ? 'bg-signal-red/5 border-signal-red/30'
                      : alert.level === AlertLevel.LEVEL_2
                      ? 'bg-signal-orange/5 border-signal-orange/30'
                      : 'bg-signal-yellow/5 border-signal-yellow/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertLevelBadge level={alert.level as AlertLevel} size="sm" />
                    <span className="text-xs text-space-500">
                      {new Date(alert.triggeredAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-space-200 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        alert.status === 'pending'
                          ? 'bg-signal-orange/20 text-signal-orange'
                          : 'bg-signal-green/20 text-signal-green'
                      }`}
                    >
                      {alert.status === 'pending' ? '待处理' : alert.status === 'reviewed' ? '已复核' : '已解决'}
                    </span>
                    {alert.reviewComment && (
                      <span className="text-xs text-space-400">复核意见: {alert.reviewComment}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-signal-green/50 mx-auto mb-3" />
              <p className="text-space-400">暂无预警记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
