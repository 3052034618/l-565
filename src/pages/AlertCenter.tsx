import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AlertLevelBadge, TaskStatusBadge } from '@/components/ui/StatusBadge';
import { AlertLevel, TaskStatus } from '@shared/types';

const levelOptions = [
  { value: '', label: '全部级别' },
  { value: AlertLevel.LEVEL_1, label: '一级（严重）' },
  { value: AlertLevel.LEVEL_2, label: '二级（重要）' },
  { value: AlertLevel.LEVEL_3, label: '三级（注意）' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'reviewed', label: '已复核' },
  { value: 'resolved', label: '已解决' },
];

export default function AlertCenter() {
  const { alerts, fetchAlerts, reviewAlert, user } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('');

  useEffect(() => {
    fetchAlerts({
      level: selectedLevel as AlertLevel | undefined,
      status: selectedStatus || undefined,
    });
  }, [selectedLevel, selectedStatus]);

  const handleReview = (alertId: string) => {
    if (!reviewComment.trim()) return;

    reviewAlert(alertId, {
      reviewedBy: user?.id || 'u4',
      reviewComment,
      status: adjustmentType ? 'resolved' : 'reviewed',
      adjustmentType: adjustmentType || undefined,
      newParams: adjustmentType ? { noiseModelId: 'nm2' } : undefined,
    } as any);

    setReviewComment('');
    setAdjustmentType('');
    setExpandedId(null);
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const resolvedAlerts = alerts.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">预警中心</h1>
          <p className="text-space-400 text-sm mt-1">查看和处理系统预警，进行专家复核</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-signal-orange/10 border border-signal-orange/30">
            <span className="text-signal-orange font-bold text-lg">{pendingAlerts.length}</span>
            <span className="text-signal-orange/70 text-sm ml-2">待处理预警</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-space-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[AlertLevel.LEVEL_1, AlertLevel.LEVEL_2, AlertLevel.LEVEL_3].map((level) => {
          const count = pendingAlerts.filter((a) => a.level === level).length;
          const labels: Record<AlertLevel, string> = {
            [AlertLevel.LEVEL_1]: '一级预警',
            [AlertLevel.LEVEL_2]: '二级预警',
            [AlertLevel.LEVEL_3]: '三级预警',
          };
          const colors: Record<AlertLevel, string> = {
            [AlertLevel.LEVEL_1]: 'from-signal-red/20 to-signal-red/5 border-signal-red/30',
            [AlertLevel.LEVEL_2]: 'from-signal-orange/20 to-signal-orange/5 border-signal-orange/30',
            [AlertLevel.LEVEL_3]: 'from-signal-yellow/20 to-signal-yellow/5 border-signal-yellow/30',
          };

          return (
            <div
              key={level}
              className={`p-5 rounded-xl bg-gradient-to-br ${colors[level]} border`}
            >
              <div className="flex items-center justify-between">
                <AlertTriangle
                  className={`w-8 h-8 ${
                    level === AlertLevel.LEVEL_1
                      ? 'text-signal-red'
                      : level === AlertLevel.LEVEL_2
                      ? 'text-signal-orange'
                      : 'text-signal-yellow'
                  }`}
                />
                <span className="text-3xl font-bold text-white font-display">{count}</span>
              </div>
              <p className="text-sm text-white/80 mt-3">{labels[level]}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-space-100">待处理预警</h3>

        {pendingAlerts.length > 0 ? (
          <div className="space-y-3">
            {pendingAlerts.map((alert) => {
              const isExpanded = expandedId === alert.id;
              return (
                <div
                  key={alert.id}
                  className="glass-card overflow-hidden"
                >
                  <div
                    className="p-5 cursor-pointer hover:bg-space-800/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.level === AlertLevel.LEVEL_1
                              ? 'bg-signal-red/20'
                              : alert.level === AlertLevel.LEVEL_2
                              ? 'bg-signal-orange/20'
                              : 'bg-signal-yellow/20'
                          }`}
                        >
                          <AlertTriangle
                            className={`w-5 h-5 ${
                              alert.level === AlertLevel.LEVEL_1
                                ? 'text-signal-red'
                                : alert.level === AlertLevel.LEVEL_2
                                ? 'text-signal-orange'
                                : 'text-signal-yellow'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertLevelBadge level={alert.level as AlertLevel} size="sm" />
                            <span className="text-sm text-space-400">{alert.taskName}</span>
                          </div>
                          <p className="text-sm text-space-200">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-space-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.triggeredAt).toLocaleString('zh-CN')}
                            </span>
                            <span>预警类型: {alert.type}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 text-space-400 hover:text-space-200">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-cyber-500/10 pt-4">
                      <div className="mb-4">
                        <label className="block text-sm text-space-300 mb-2">复核意见</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="请输入复核意见..."
                          rows={3}
                          className="w-full px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50 resize-none"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm text-space-300 mb-2">调整措施（可选）</label>
                        <select
                          value={adjustmentType}
                          onChange={(e) => setAdjustmentType(e.target.value)}
                          className="w-full px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
                        >
                          <option value="">仅记录复核意见，不调整</option>
                          <option value="noise_model_switch">切换噪声模型</option>
                          <option value="filter_adjustment">调整滤波器参数</option>
                          <option value="sensitivity_recalibration">重新校准灵敏度</option>
                          <option value="simplified_model">使用简化模型重新计算</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-4 py-2 text-space-400 hover:text-space-200 text-sm transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleReview(alert.id)}
                          disabled={!reviewComment.trim()}
                          className="px-4 py-2 bg-cyber-500/20 text-cyber-300 text-sm rounded-lg hover:bg-cyber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          提交复核
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-signal-green/50 mx-auto mb-4" />
            <p className="text-space-400">暂无待处理预警</p>
            <p className="text-sm text-space-500 mt-1">所有预警均已处理完毕</p>
          </div>
        )}
      </div>

      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-space-100">历史预警</h3>
          <div className="space-y-3">
            {resolvedAlerts.map((alert) => (
              <div key={alert.id} className="glass-card p-5 opacity-70">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-space-700/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-signal-green" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertLevelBadge level={alert.level as AlertLevel} size="sm" />
                      <span className="px-2 py-0.5 text-xs rounded bg-signal-green/20 text-signal-green">
                        {alert.status === 'resolved' ? '已解决' : '已复核'}
                      </span>
                    </div>
                    <p className="text-sm text-space-300">{alert.message}</p>
                    {alert.reviewComment && (
                      <div className="mt-3 p-3 rounded-lg bg-space-800/30">
                        <div className="flex items-center gap-2 text-xs text-space-400 mb-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>复核意见</span>
                        </div>
                        <p className="text-sm text-space-300">{alert.reviewComment}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-space-500">
                      <span>触发时间: {new Date(alert.triggeredAt).toLocaleString('zh-CN')}</span>
                      <span>复核人: {alert.reviewedBy || '未知'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
