import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Microwave,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Play,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type SettingsTab = 'detectors' | 'thresholds' | 'quality';

export default function Settings() {
  const { detectors, fetchDetectors, qualityPaused, fetchQualityStatus, resumeQuality } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('detectors');
  const [thresholds, setThresholds] = useState({
    snrThreshold: 8.0,
    sensitivityDeviation: 10,
    stationarityPValue: 0.05,
    alertLevel1: 5.0,
    alertLevel2: 6.5,
    alertLevel3: 8.0,
  });

  useEffect(() => {
    fetchDetectors();
    fetchQualityStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-space-100">系统配置</h1>
        <p className="text-space-400 text-sm mt-1">管理探测器构型、系统阈值和质量控制参数</p>
      </div>

      <div className="flex gap-1 p-1 bg-space-800/50 rounded-lg w-fit">
        {[
          { key: 'detectors', label: '探测器构型', icon: Microwave },
          { key: 'thresholds', label: '阈值配置', icon: AlertTriangle },
          { key: 'quality', label: '质量控制', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SettingsTab)}
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

      {activeTab === 'detectors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-space-100">探测器构型列表</h3>
            <button className="px-4 py-2 bg-cyber-500/20 text-cyber-300 text-sm rounded-lg hover:bg-cyber-500/30 flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              新增构型
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectors.map((detector) => (
              <div
                key={detector.id}
                className="glass-card p-5 group relative"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button className="p-1.5 rounded bg-space-800/50 text-space-400 hover:text-cyber-300 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded bg-space-800/50 text-space-400 hover:text-signal-red transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500/30 to-cyber-600/10 flex items-center justify-center mb-4">
                  <Microwave className="w-6 h-6 text-cyber-300" />
                </div>

                <h4 className="font-semibold text-space-100 mb-2">{detector.name}</h4>
                <p className="text-xs text-space-400 mb-4">{detector.configuration}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-space-500">臂长</span>
                    <span className="text-space-200 font-mono">{detector.armLength} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-space-500">激光功率</span>
                    <span className="text-space-200 font-mono">{detector.laserPower} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-space-500">镜片质量</span>
                    <span className="text-space-200 font-mono">{detector.mirrorMass} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-space-500">悬挂类型</span>
                    <span className="text-space-200">{detector.suspensionType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="glass-card p-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-space-100 mb-6">阈值配置</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                信噪比检测阈值
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={thresholds.snrThreshold}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, snrThreshold: Number(e.target.value) })
                  }
                  className="flex-1 accent-cyber-500"
                />
                <span className="text-cyber-300 font-mono w-12 text-right">
                  {thresholds.snrThreshold.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-space-500 mt-1">
                信噪比低于此值时触发低信噪比预警
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                灵敏度假定偏差阈值 (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={thresholds.sensitivityDeviation}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      sensitivityDeviation: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-cyber-500"
                />
                <span className="text-cyber-300 font-mono w-12 text-right">
                  {thresholds.sensitivityDeviation}%
                </span>
              </div>
              <p className="text-xs text-space-500 mt-1">
                连续三次偏差超过此值时暂停新任务并通知首席科学家
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-space-200 mb-2">
                噪声平稳性检验 p 值阈值
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                  value={thresholds.stationarityPValue}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      stationarityPValue: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-cyber-500"
                />
                <span className="text-cyber-300 font-mono w-16 text-right">
                  {thresholds.stationarityPValue.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-space-500 mt-1">
                ADF 检验 p 值低于此值时认为噪声非平稳
              </p>
            </div>

            <div className="border-t border-cyber-500/10 pt-6">
              <label className="block text-sm font-medium text-space-200 mb-4">
                预警级别阈值 (信噪比)
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm text-signal-red">一级预警</span>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={thresholds.alertLevel1}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        alertLevel1: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-signal-red"
                  />
                  <span className="text-signal-red font-mono w-12 text-right">
                    {thresholds.alertLevel1.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm text-signal-orange">二级预警</span>
                  <input
                    type="range"
                    min="3"
                    max="18"
                    step="0.5"
                    value={thresholds.alertLevel2}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        alertLevel2: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-signal-orange"
                  />
                  <span className="text-signal-orange font-mono w-12 text-right">
                    {thresholds.alertLevel2.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm text-signal-yellow">三级预警</span>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.5"
                    value={thresholds.alertLevel3}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        alertLevel3: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-signal-yellow"
                  />
                  <span className="text-signal-yellow font-mono w-12 text-right">
                    {thresholds.alertLevel3.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-cyber-500 to-cyber-600 text-white font-medium rounded-lg hover:from-cyber-400 hover:to-cyber-500 transition-all shadow-glow-cyan flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div
            className={`glass-card p-6 border-2 ${
              qualityPaused
                ? 'border-signal-orange/50 bg-signal-orange/5'
                : 'border-signal-green/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    qualityPaused
                      ? 'bg-signal-orange/20'
                      : 'bg-signal-green/20'
                  }`}
                >
                  <Shield
                    className={`w-7 h-7 ${
                      qualityPaused ? 'text-signal-orange' : 'text-signal-green'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-space-100">质量控制系统状态</h3>
                  <p
                    className={`text-sm ${
                      qualityPaused ? 'text-signal-orange' : 'text-signal-green'
                    }`}
                  >
                    {qualityPaused ? '已暂停 - 新任务提交被阻止' : '运行中 - 正常接收新任务'}
                  </p>
                </div>
              </div>

              {qualityPaused && (
                <button
                  onClick={resumeQuality}
                  className="px-5 py-2.5 bg-signal-green/20 text-signal-green rounded-lg hover:bg-signal-green/30 flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  解除暂停
                </button>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">质量监控规则</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-space-800/30 border-l-4 border-cyber-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-space-100">灵敏度假定偏差检测</p>
                    <p className="text-sm text-space-400 mt-1">
                      对同一探测器构型的连续三次模拟结果进行偏差检测
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-cyber-500/20 text-cyber-300">
                    已启用
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-space-800/30 border-l-4 border-signal-orange">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-space-100">自动暂停机制</p>
                    <p className="text-sm text-space-400 mt-1">
                      连续三次偏差超过阈值时，自动暂停新任务提交并通知首席科学家
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-signal-orange/20 text-signal-orange">
                    已启用
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-space-800/30 border-l-4 border-signal-yellow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-space-100">噪声平稳性检验</p>
                    <p className="text-sm text-space-400 mt-1">
                      使用 ADF 检验和方差比检验评估噪声的平稳性
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-signal-yellow/20 text-signal-yellow">
                    已启用
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-space-100 mb-4">通知设置</h3>
            <div className="space-y-3">
              {[
                {
                  label: '一级预警 - 立即推送首席科学家',
                  enabled: true,
                  color: 'text-signal-red',
                },
                {
                  label: '二级预警 - 推送引力波专家和项目负责人',
                  enabled: true,
                  color: 'text-signal-orange',
                },
                {
                  label: '三级预警 - 仅记录，不主动推送',
                  enabled: true,
                  color: 'text-signal-yellow',
                },
                {
                  label: '任务完成通知',
                  enabled: false,
                  color: 'text-cyber-300',
                },
                {
                  label: '审批待办提醒',
                  enabled: true,
                  color: 'text-cyber-300',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-space-800/30"
                >
                  <span className={`text-sm ${item.color}`}>{item.label}</span>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      item.enabled ? 'bg-signal-green/30' : 'bg-space-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        item.enabled ? 'left-6' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
