import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Play,
  Settings,
  Info,
  Lightbulb,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { UploadedFileInfo } from '@shared/types';

const signalTypes = [
  { value: 'BBH', label: '双黑洞并合 (BBH)', description: '两个黑洞的引力波并合事件' },
  { value: 'BNS', label: '双中子星并合 (BNS)', description: '两个中子星的引力波并合事件' },
  { value: 'NSBH', label: '中子星-黑洞并合 (NSBH)', description: '中子星与黑洞的并合事件' },
];

export default function NewTask() {
  const navigate = useNavigate();
  const { detectors, noiseModels, fetchDetectors, fetchNoiseModels, createTask, recommendations, fetchRecommendations, qualityPaused } = useAppStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    detectorConfigId: '',
    noiseModelId: '',
    signalSource: {
      type: 'BBH' as string,
      mass1: 30,
      mass2: 20,
      spin1: 0.3,
      spin2: 0.2,
      distance: 200,
      inclination: 0.3,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [detectorFile, setDetectorFile] = useState<UploadedFileInfo | null>(null);
  const [noiseFile, setNoiseFile] = useState<UploadedFileInfo | null>(null);
  const [detectorFileError, setDetectorFileError] = useState<string | null>(null);
  const [noiseFileError, setNoiseFileError] = useState<string | null>(null);
  const detectorInputRef = useRef<HTMLInputElement>(null);
  const noiseInputRef = useRef<HTMLInputElement>(null);

  const validateDetectorFile = (parsed: any): string | null => {
    if (!parsed || typeof parsed !== 'object') return '文件内容不是有效的JSON对象';
    if (parsed.armLength === undefined) return '缺少必需字段：armLength（臂长）';
    if (typeof parsed.armLength !== 'number' || parsed.armLength <= 0) return 'armLength（臂长）必须是大于0的数字';
    if (parsed.laserPower === undefined) return '缺少必需字段：laserPower（激光功率）';
    if (typeof parsed.laserPower !== 'number' || parsed.laserPower <= 0) return 'laserPower（激光功率）必须是大于0的数字';
    if (parsed.armLength > 100000) return 'armLength（臂长）过大，不能超过100000米';
    if (parsed.laserPower > 10000) return 'laserPower（激光功率）过大，不能超过10000瓦';
    return null;
  };

  const validateNoiseFile = (parsed: any): string | null => {
    if (!parsed || typeof parsed !== 'object') return '文件内容不是有效的JSON对象';
    if (!parsed.version) return '缺少必需字段：version（版本号）';
    if (typeof parsed.version !== 'string') return 'version（版本号）必须是字符串';
    if (parsed.spectrum) {
      if (!parsed.spectrum.frequencies || !Array.isArray(parsed.spectrum.frequencies)) {
        return 'spectrum.frequencies 必须是数组';
      }
      if (!parsed.spectrum.values || !Array.isArray(parsed.spectrum.values)) {
        return 'spectrum.values 必须是数组';
      }
      if (parsed.spectrum.frequencies.length !== parsed.spectrum.values.length) {
        return 'spectrum.frequencies 和 spectrum.values 长度不一致';
      }
      if (parsed.spectrum.values.some((v: any) => typeof v !== 'number' || v <= 0)) {
        return 'spectrum.values 必须全部为正数';
      }
    }
    return null;
  };

  const handleDetectorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetectorFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (parseErr) {
          setDetectorFileError('JSON格式解析失败，请检查文件格式');
          setDetectorFile(null);
          return;
        }

        const err = validateDetectorFile(parsed);
        if (err) {
          setDetectorFileError(err);
          setDetectorFile(null);
          return;
        }

        const fileInfo: UploadedFileInfo = {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          content,
          parsedDetectorConfig: {
            name: parsed.name || parsed.configName || undefined,
            armLength: parsed.armLength,
            laserPower: parsed.laserPower,
            wavelength: parsed.wavelength,
            mirrorMass: parsed.mirrorMass,
            suspensionType: parsed.suspensionType,
            configuration: parsed.configuration,
          },
        };
        setDetectorFile(fileInfo);

        if (detectors.length > 0) {
          const arm = parsed.armLength;
          const matchIdx = arm >= 8000 ? 1 : arm >= 3000 ? 2 : 0;
          const match = detectors[matchIdx];
          if (match) {
            setFormData((prev) => ({ ...prev, detectorConfigId: match.id }));
          }
        }
      } catch (err) {
        setDetectorFileError('文件读取失败，请重试');
        setDetectorFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleNoiseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNoiseFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (parseErr) {
          setNoiseFileError('JSON格式解析失败，请检查文件格式');
          setNoiseFile(null);
          return;
        }

        const err = validateNoiseFile(parsed);
        if (err) {
          setNoiseFileError(err);
          setNoiseFile(null);
          return;
        }

        let spectrum: { frequencies: number[]; values: number[] } | undefined;
        if (parsed.spectrum && parsed.spectrum.frequencies) {
          spectrum = parsed.spectrum;
        } else if (parsed.totalNoise && parsed.totalNoise.frequencies) {
          spectrum = parsed.totalNoise;
        }

        const fileInfo: UploadedFileInfo = {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          content,
          parsedNoiseModel: {
            name: parsed.name || undefined,
            version: parsed.version || undefined,
            spectrum,
          },
        };
        setNoiseFile(fileInfo);

        if (parsed.version && noiseModels.length > 0) {
          const match = noiseModels.find((m) => m.version === parsed.version);
          if (match) {
            setFormData((prev) => ({ ...prev, noiseModelId: match.id }));
          }
        }
      } catch (err) {
        setNoiseFileError('文件读取失败，请重试');
        setNoiseFile(null);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchDetectors();
    fetchNoiseModels();
  }, []);

  useEffect(() => {
    if (formData.detectorConfigId) {
      fetchRecommendations(formData.detectorConfigId, formData.signalSource.type as any);
    }
  }, [formData.detectorConfigId, formData.signalSource.type]);

  useEffect(() => {
    if (detectors.length > 0 && !formData.detectorConfigId) {
      setFormData((prev) => ({ ...prev, detectorConfigId: detectors[0].id }));
    }
    if (noiseModels.length > 0 && !formData.noiseModelId) {
      setFormData((prev) => ({ ...prev, noiseModelId: noiseModels[0].id }));
    }
  }, [detectors, noiseModels]);

  const handleSubmit = async () => {
    if (qualityPaused) return;
    if (detectorFileError || noiseFileError) {
      alert('上传文件存在校验错误，请修正后再提交');
      return;
    }
    setSubmitting(true);
    try {
      const taskData = {
        name: formData.name,
        detectorConfigId: formData.detectorConfigId,
        noiseModelId: formData.noiseModelId,
        signalSource: formData.signalSource,
        uploadedDetectorFile: detectorFile,
        uploadedNoiseFile: noiseFile,
      };
      const result = await createTask(taskData as any);
      if (result) {
        navigate(`/tasks/${result.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name && formData.detectorConfigId && formData.noiseModelId;
    if (step === 2) return formData.signalSource.type;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-lg text-space-400 hover:text-space-200 hover:bg-space-800/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">新建分析任务</h1>
          <p className="text-space-400 text-sm mt-1">配置探测器参数和信号源，启动引力波分析</p>
        </div>
      </div>

      {qualityPaused && (
        <div className="p-4 rounded-lg bg-signal-orange/10 border border-signal-orange/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-signal-orange/20 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-signal-orange" />
          </div>
          <div>
            <p className="text-sm font-medium text-signal-orange">系统处于质量暂停状态</p>
            <p className="text-xs text-signal-orange/70">
              暂时无法创建新任务，请联系首席科学家解除暂停。
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-center mb-8">
          {['基本信息', '信号源配置', '确认提交'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={stepNum} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isCompleted
                        ? 'bg-signal-green text-white'
                        : isActive
                        ? 'bg-cyber-500 text-white shadow-glow-cyan'
                        : 'bg-space-700 text-space-400'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isActive ? 'text-cyber-300 font-medium' : 'text-space-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-20 h-0.5 mx-4 mb-6 ${
                      isCompleted ? 'bg-signal-green' : 'bg-space-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                任务名称 <span className="text-signal-red">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：GW150914 双黑洞模拟分析"
                className="w-full px-4 py-3 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50 focus:ring-2 focus:ring-cyber-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                探测器构型 <span className="text-signal-red">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {detectors.map((detector) => (
                  <div
                    key={detector.id}
                    onClick={() => setFormData({ ...formData, detectorConfigId: detector.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.detectorConfigId === detector.id
                        ? 'border-cyber-400 bg-cyber-500/10 shadow-glow-cyan'
                        : 'border-cyber-500/20 bg-space-800/30 hover:border-cyber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-cyber-400" />
                      <span className="font-medium text-space-100 text-sm">{detector.name}</span>
                    </div>
                    <div className="text-xs text-space-400 space-y-1">
                      <p>臂长: {detector.armLength} m</p>
                      <p>激光功率: {detector.laserPower} W</p>
                      <p>镜片质量: {detector.mirrorMass} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                噪声模型 <span className="text-signal-red">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {noiseModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setFormData({ ...formData, noiseModelId: model.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.noiseModelId === model.id
                        ? 'border-cyber-400 bg-cyber-500/10 shadow-glow-cyan'
                        : 'border-cyber-500/20 bg-space-800/30 hover:border-cyber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-space-100 text-sm">{model.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyber-500/20 text-cyber-300 font-mono">
                        {model.version}
                      </span>
                    </div>
                    <p className="text-xs text-space-400">包含地震、热、散粒、辐射压四种噪声分量</p>
                  </div>
                ))}
              </div>
              {recommendations?.filterTemplates && (
                <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-300 font-medium">智能推荐</p>
                    <p className="text-xs text-purple-400/70 mt-0.5">
                      基于历史数据分析，推荐使用 {recommendations.filterTemplates[0]?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">
                  上传探测器设计参数 (可选)
                </label>
                <input
                  ref={detectorInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleDetectorFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => detectorInputRef.current?.click()}
                  className="border-2 border-dashed border-cyber-500/20 rounded-xl p-6 text-center hover:border-cyber-500/40 transition-colors cursor-pointer"
                >
                  {detectorFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-signal-green/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-signal-green" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-space-100">{detectorFile.fileName}</p>
                        <p className="text-xs text-space-400">
                          {(detectorFile.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetectorFile(null);
                          if (detectorInputRef.current) detectorInputRef.current.value = '';
                        }}
                        className="p-1 rounded hover:bg-space-700/50 text-space-400 hover:text-space-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-10 h-10 text-space-500 mx-auto mb-3" />
                      <p className="text-sm text-space-300 mb-1">点击上传探测器参数</p>
                      <p className="text-xs text-space-500">支持 .json 格式</p>
                    </>
                  )}
                </div>
                {detectorFileError && (
                  <div className="mt-2 p-2 rounded-lg bg-signal-red/10 border border-signal-red/30">
                    <p className="text-xs text-signal-red font-medium">
                      <span className="font-bold">探测器文件不合法：</span>
                      {detectorFileError}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">
                  上传噪声模型文件 (可选)
                </label>
                <input
                  ref={noiseInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleNoiseFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => noiseInputRef.current?.click()}
                  className="border-2 border-dashed border-cyber-500/20 rounded-xl p-6 text-center hover:border-cyber-500/40 transition-colors cursor-pointer"
                >
                  {noiseFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-signal-green/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-signal-green" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-space-100">{noiseFile.fileName}</p>
                        <p className="text-xs text-space-400">
                          {(noiseFile.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoiseFile(null);
                          if (noiseInputRef.current) noiseInputRef.current.value = '';
                        }}
                        className="p-1 rounded hover:bg-space-700/50 text-space-400 hover:text-space-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-10 h-10 text-space-500 mx-auto mb-3" />
                      <p className="text-sm text-space-300 mb-1">点击上传噪声模型</p>
                      <p className="text-xs text-space-500">支持 .json 格式</p>
                    </>
                  )}
                </div>
                {noiseFileError && (
                  <div className="mt-2 p-2 rounded-lg bg-signal-red/10 border border-signal-red/30">
                    <p className="text-xs text-signal-red font-medium">
                      <span className="font-bold">噪声文件不合法：</span>
                      {noiseFileError}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-space-200 mb-3">
                信号源类型 <span className="text-signal-red">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {signalTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        signalSource: { ...formData.signalSource, type: type.value },
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.signalSource.type === type.value
                        ? 'border-cyber-400 bg-cyber-500/10 shadow-glow-cyan'
                        : 'border-cyber-500/20 bg-space-800/30 hover:border-cyber-500/40'
                    }`}
                  >
                    <span className="font-medium text-space-100 text-sm block mb-1">{type.label}</span>
                    <p className="text-xs text-space-400">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">质量 1 (M☉)</label>
                <input
                  type="number"
                  value={formData.signalSource.mass1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, mass1: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">质量 2 (M☉)</label>
                <input
                  type="number"
                  value={formData.signalSource.mass2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, mass2: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">自旋 1</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.signalSource.spin1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, spin1: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">自旋 2</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.signalSource.spin2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, spin2: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">距离 (Mpc)</label>
                <input
                  type="number"
                  value={formData.signalSource.distance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, distance: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-space-200 mb-2">倾角 (rad)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.signalSource.inclination}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signalSource: { ...formData.signalSource, inclination: Number(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 font-mono focus:outline-none focus:border-cyber-400/50"
                />
              </div>
            </div>

            {recommendations?.parameterRanges && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-300 font-medium mb-2">推荐参数范围</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {recommendations.parameterRanges.slice(0, 4).map((range) => (
                        <div key={range.parameter} className="text-purple-400/80">
                          <span className="text-purple-300">{range.parameter}:</span>
                          <span className="font-mono ml-1">
                            {range.min} - {range.max}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cyber-500/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-cyber-300" />
              </div>
              <h3 className="text-xl font-semibold text-space-100 mb-2">确认提交</h3>
              <p className="text-sm text-space-400">请确认以下配置信息，无误后提交任务</p>
            </div>

            <div className="glass-card p-6 mb-6">
              <h4 className="text-sm font-medium text-space-400 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-space-500">任务名称：</span>
                  <span className="text-space-100">{formData.name}</span>
                </div>
                <div>
                  <span className="text-space-500">探测器：</span>
                  <span className="text-space-100">
                    {detectors.find((d) => d.id === formData.detectorConfigId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-space-500">噪声模型：</span>
                  <span className="text-space-100">
                    {noiseModels.find((n) => n.id === formData.noiseModelId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-space-500">信号源类型：</span>
                  <span className="text-cyber-300">{formData.signalSource.type}</span>
                </div>
              </div>

              <div className="border-t border-cyber-500/10 my-4" />

              <h4 className="text-sm font-medium text-space-400 mb-3">信号源参数</h4>
              <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">质量 1</p>
                  <p className="text-cyber-300">{formData.signalSource.mass1} M☉</p>
                </div>
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">质量 2</p>
                  <p className="text-cyber-300">{formData.signalSource.mass2} M☉</p>
                </div>
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">距离</p>
                  <p className="text-cyber-300">{formData.signalSource.distance} Mpc</p>
                </div>
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">自旋 1</p>
                  <p className="text-cyber-300">{formData.signalSource.spin1}</p>
                </div>
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">自旋 2</p>
                  <p className="text-cyber-300">{formData.signalSource.spin2}</p>
                </div>
                <div className="p-2 rounded bg-space-800/30">
                  <p className="text-space-500 text-xs">倾角</p>
                  <p className="text-cyber-300">{formData.signalSource.inclination} rad</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-cyber-500/10 border border-cyber-500/20 text-sm text-cyber-200">
              <p className="font-medium mb-1">预计计算耗时</p>
              <p>
                基于当前配置，预计需要约 <span className="font-mono font-bold">120 秒</span> 完成分析。
                任务将在后台运行，您可以随时离开此页面。
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-cyber-500/10">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2.5 text-space-400 hover:text-space-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一步
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 bg-cyber-500/20 text-cyber-300 rounded-lg hover:bg-cyber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || qualityPaused}
              className="px-8 py-2.5 bg-gradient-to-r from-cyber-500 to-cyber-600 text-white font-medium rounded-lg shadow-glow-cyan hover:from-cyber-400 hover:to-cyber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <span className="animate-pulse">提交中...</span>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  启动分析
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
