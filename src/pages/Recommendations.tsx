import { useEffect, useState } from 'react';
import {
  Lightbulb,
  Target,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Recommendations() {
  const { recommendations, detectors, fetchRecommendations, fetchDetectors } = useAppStore();
  const [selectedDetector, setSelectedDetector] = useState('');
  const [signalType, setSignalType] = useState('BBH');

  useEffect(() => {
    fetchDetectors();
  }, []);

  useEffect(() => {
    if (detectors.length > 0 && !selectedDetector) {
      setSelectedDetector(detectors[0].id);
    }
  }, [detectors]);

  useEffect(() => {
    if (selectedDetector) {
      fetchRecommendations(selectedDetector, signalType as any);
    }
  }, [selectedDetector, signalType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">智能推荐</h1>
          <p className="text-space-400 text-sm mt-1">
            基于历史分析结果，自动推荐最优滤波器模板和参数扫描范围
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">
            基于 {recommendations?.basedOnTasks || 0} 个历史任务分析
          </span>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-space-400 mb-1 block">探测器构型</label>
            <select
              value={selectedDetector}
              onChange={(e) => setSelectedDetector(e.target.value)}
              className="px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
            >
              {detectors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-space-400 mb-1 block">信号源类型</label>
            <select
              value={signalType}
              onChange={(e) => setSignalType(e.target.value)}
              className="px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
            >
              <option value="BBH">双黑洞并合 (BBH)</option>
              <option value="BNS">双中子星并合 (BNS)</option>
              <option value="NSBH">中子星-黑洞 (NSBH)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-space-100">推荐滤波器模板</h3>
              <p className="text-sm text-space-400">按适用度排序</p>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations?.filterTemplates.map((template, index) => (
              <div
                key={template.id}
                className={`p-4 rounded-xl border transition-all ${
                  index === 0
                    ? 'border-purple-400/50 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                    : 'border-cyber-500/10 bg-space-800/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium">
                        最优推荐
                      </span>
                    )}
                    <span className="font-medium text-space-100">{template.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-display text-purple-300">
                      {(template.suitability * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-space-500">适用度</p>
                  </div>
                </div>

                <p className="text-sm text-space-400 mb-3">{template.description}</p>

                <div className="p-3 rounded-lg bg-space-900/50">
                  <p className="text-xs text-space-500 mb-2">推荐参数</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(template.recommendedParams).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-space-400">{key}:</span>
                        <span className="text-cyber-300 font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {index === 0 && (
                  <button className="w-full mt-3 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-lg hover:bg-purple-500/30 flex items-center justify-center gap-2 transition-colors">
                    <Check className="w-4 h-4" />
                    使用此模板
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-500/30 to-cyber-600/20 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-cyber-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-space-100">推荐参数扫描范围</h3>
                <p className="text-sm text-space-400">
                  置信度: {(recommendations?.confidence || 0) * 100}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {recommendations?.parameterRanges.map((range) => (
                <div key={range.parameter} className="p-4 rounded-lg bg-space-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-space-100">{range.parameter}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        range.confidence > 0.85
                          ? 'bg-signal-green/20 text-signal-green'
                          : range.confidence > 0.7
                          ? 'bg-signal-yellow/20 text-signal-yellow'
                          : 'bg-space-700 text-space-400'
                      }`}
                    >
                      {(range.confidence * 100).toFixed(0)}% 置信
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-space-700 rounded-full relative overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full"
                        style={{
                          left: `${((Number(range.min) / (Number(range.max) * 1.2)) * 100)}%`,
                          width: `${(((Number(range.max) - Number(range.min)) / (Number(range.max) * 1.2)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-2 text-xs font-mono">
                    <span className="text-space-400">{range.min}</span>
                    <span className="text-cyber-300">步长: {range.suggestedStep}</span>
                    <span className="text-space-400">{range.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-signal-green/30 to-signal-green/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-signal-green" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-space-100">优化建议</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-space-800/30 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-signal-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-space-200">增大激光功率可提升高频灵敏度</p>
                  <p className="text-xs text-space-500 mt-1">
                    建议将激光功率从 20W 提升至 100W，可将高频灵敏度提升约 2.2 倍
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-space-800/30 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-signal-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-space-200">优化噪声模型可降低低频干扰</p>
                  <p className="text-xs text-space-500 mt-1">
                    使用 v2.0 改进噪声模型，预计可将低频噪声降低约 30%
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-space-800/30 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-signal-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-space-200">增加 MCMC 样本数提高估计精度</p>
                  <p className="text-xs text-space-500 mt-1">
                    将样本数从 3000 增加到 10000，精度可提升约 15%，但耗时增加 2.5 倍
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
