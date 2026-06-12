import { useState, useEffect } from 'react';
import { Download, Filter, FileJson, Clock, CheckCircle, Loader } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const exportTypes = [
  { value: 'response_data', label: '干涉仪响应数据', description: '灵敏度曲线、噪声功率谱等' },
  { value: 'estimation_results', label: '参数估计结果', description: '后验样本、参数估计值等' },
  { value: 'all', label: '全部数据', description: '包含响应数据和估计结果' },
];

export default function DataExport() {
  const { detectors, noiseModels, exportTasks, fetchDetectors, fetchNoiseModels, fetchExportTasks, createExport } = useAppStore();

  const [detectorConfigId, setDetectorConfigId] = useState('');
  const [noiseModelVersion, setNoiseModelVersion] = useState('');
  const [timeWindowStart, setTimeWindowStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [timeWindowEnd, setTimeWindowEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [exportType, setExportType] = useState<'response_data' | 'estimation_results' | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDetectors();
    fetchNoiseModels();
    fetchExportTasks();
  }, []);

  useEffect(() => {
    if (detectors.length > 0 && !detectorConfigId) {
      setDetectorConfigId(detectors[0].id);
    }
    if (noiseModels.length > 0 && !noiseModelVersion) {
      setNoiseModelVersion(noiseModels[0].version);
    }
  }, [detectors, noiseModels]);

  const handleExport = async () => {
    setCreating(true);
    try {
      await createExport({
        detectorConfigId,
        noiseModelVersion,
        timeWindowStart,
        timeWindowEnd,
        exportType,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (taskId: string, fileName: string) => {
    setDownloadingId(taskId);
    try {
      const res = await fetch(`/api/export/${taskId}/download`);
      if (!res.ok) throw new Error('下载失败');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `export_${taskId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('下载失败，请稍后重试');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-space-100">数据导出</h1>
        <p className="text-space-400 text-sm mt-1">按探测器构型、噪声模型版本、观测时间窗口导出数据</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyber-400" />
              导出配置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">探测器构型</label>
                <select
                  value={detectorConfigId}
                  onChange={(e) => setDetectorConfigId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 focus:outline-none focus:border-cyber-400/50"
                >
                  {detectors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">噪声模型版本</label>
                <select
                  value={noiseModelVersion}
                  onChange={(e) => setNoiseModelVersion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 focus:outline-none focus:border-cyber-400/50"
                >
                  {noiseModels.map((m) => (
                    <option key={m.id} value={m.version}>
                      {m.name} ({m.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">开始日期</label>
                <input
                  type="date"
                  value={timeWindowStart}
                  onChange={(e) => setTimeWindowStart(e.target.value)}
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 focus:outline-none focus:border-cyber-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">结束日期</label>
                <input
                  type="date"
                  value={timeWindowEnd}
                  onChange={(e) => setTimeWindowEnd(e.target.value)}
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 focus:outline-none focus:border-cyber-400/50"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-space-200 mb-3">导出类型</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exportTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setExportType(type.value as typeof exportType)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      exportType === type.value
                        ? 'border-cyber-400 bg-cyber-500/10 shadow-glow-cyan'
                        : 'border-cyber-500/20 bg-space-800/30 hover:border-cyber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="w-4 h-4 text-cyber-400" />
                      <span className="font-medium text-space-100 text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-space-400">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={creating}
              className="w-full py-3 bg-gradient-to-r from-cyber-500 to-cyber-600 hover:from-cyber-400 hover:to-cyber-500 text-white font-medium rounded-lg transition-all shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  创建导出任务
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">导出统计</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-space-400">总导出次数</span>
                <span className="text-lg font-bold text-cyber-300 font-mono">{exportTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-space-400">成功导出</span>
                <span className="text-lg font-bold text-signal-green font-mono">
                  {exportTasks.filter((t) => t.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-space-400">处理中</span>
                <span className="text-lg font-bold text-signal-yellow font-mono">
                  {exportTasks.filter((t) => t.status === 'processing').length}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">导出格式说明</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-space-800/30">
                <p className="text-cyber-300 font-medium mb-1">JSON 格式</p>
                <p className="text-space-400 text-xs">标准 JSON 格式，便于程序解析和二次处理</p>
              </div>
              <div className="p-3 rounded-lg bg-space-800/30">
                <p className="text-cyber-300 font-medium mb-1">数据字段</p>
                <p className="text-space-400 text-xs">包含任务信息、参数配置、灵敏度曲线、后验样本等</p>
              </div>
              <div className="p-3 rounded-lg bg-space-800/30">
                <p className="text-cyber-300 font-medium mb-1">采样率</p>
                <p className="text-space-400 text-xs">默认 4096 Hz，支持 1024-16384 Hz 范围</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-space-100 mb-4">导出任务历史</h3>
        <div className="space-y-3">
          {exportTasks.length > 0 ? (
            exportTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.status === 'completed'
                        ? 'bg-signal-green/20'
                        : task.status === 'processing'
                        ? 'bg-signal-yellow/20'
                        : 'bg-signal-red/20'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-signal-green" />
                    ) : task.status === 'processing' ? (
                      <Loader className="w-5 h-5 text-signal-yellow animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-signal-red" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-space-100">
                      {task.exportType === 'all'
                        ? '全部数据导出'
                        : task.exportType === 'response_data'
                        ? '响应数据导出'
                        : '估计结果导出'}
                    </p>
                    <p className="text-xs text-space-400">
                      噪声模型 {task.noiseModelVersion} · {task.timeWindowStart} ~ {task.timeWindowEnd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {task.fileSize && (
                    <span className="text-sm text-space-400 font-mono">
                      {(task.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                  <span className="text-xs text-space-500">
                    {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  {task.status === 'completed' && task.downloadUrl && (
                    <button
                      onClick={() => handleDownload(task.id, `gw_export_${task.id}.json`)}
                      disabled={downloadingId === task.id}
                      className="px-3 py-1.5 bg-cyber-500/20 text-cyber-300 text-sm rounded-lg hover:bg-cyber-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {downloadingId === task.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingId === task.id ? '下载中' : '下载'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileJson className="w-10 h-10 text-space-600 mx-auto mb-3" />
              <p className="text-space-400 text-sm">暂无导出任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
