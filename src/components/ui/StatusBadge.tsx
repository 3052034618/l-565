import { TaskStatus, AlertLevel } from '@shared/types';

const taskStatusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  [TaskStatus.PENDING_VALIDATION]: { label: '待校验', color: 'text-space-300', bgColor: 'bg-space-700/50' },
  [TaskStatus.MODEL_BUILDING]: { label: '模型构建中', color: 'text-cyber-300', bgColor: 'bg-cyber-500/20' },
  [TaskStatus.NOISE_SIMULATION]: { label: '噪声模拟中', color: 'text-cyber-300', bgColor: 'bg-cyber-500/20' },
  [TaskStatus.SIGNAL_INJECTION]: { label: '信号注入中', color: 'text-cyber-300', bgColor: 'bg-cyber-500/20' },
  [TaskStatus.PARAMETER_ESTIMATION]: { label: '参数估计中', color: 'text-cyber-300', bgColor: 'bg-cyber-500/20' },
  [TaskStatus.COMPLETED]: { label: '分析完成', color: 'text-space-200', bgColor: 'bg-space-700/50' },
  [TaskStatus.PENDING_VERIFICATION]: { label: '待验证', color: 'text-signal-yellow', bgColor: 'bg-signal-yellow/20' },
  [TaskStatus.PENDING_CONFIRMATION]: { label: '待确认', color: 'text-signal-yellow', bgColor: 'bg-signal-yellow/20' },
  [TaskStatus.APPROVED]: { label: '已通过', color: 'text-signal-green', bgColor: 'bg-signal-green/20' },
  [TaskStatus.FALLBACK]: { label: '异常回退', color: 'text-signal-orange', bgColor: 'bg-signal-orange/20' },
  [TaskStatus.ERROR]: { label: '错误', color: 'text-signal-red', bgColor: 'bg-signal-red/20' },
};

const alertLevelConfig: Record<AlertLevel, { label: string; color: string; bgColor: string; dotColor: string }> = {
  [AlertLevel.LEVEL_1]: { label: '一级（严重）', color: 'text-signal-red', bgColor: 'bg-signal-red/20', dotColor: 'bg-signal-red' },
  [AlertLevel.LEVEL_2]: { label: '二级（重要）', color: 'text-signal-orange', bgColor: 'bg-signal-orange/20', dotColor: 'bg-signal-orange' },
  [AlertLevel.LEVEL_3]: { label: '三级（注意）', color: 'text-signal-yellow', bgColor: 'bg-signal-yellow/20', dotColor: 'bg-signal-yellow' },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export function TaskStatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = taskStatusConfig[status] || taskStatusConfig[TaskStatus.PENDING_VALIDATION];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.color} ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
      <span className={`status-dot ${config.color.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
}

interface AlertLevelBadgeProps {
  level: AlertLevel;
  size?: 'sm' | 'md';
}

export function AlertLevelBadge({ level, size = 'md' }: AlertLevelBadgeProps) {
  const config = alertLevelConfig[level];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.color} ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
      <span className={`status-dot ${config.dotColor} shadow-sm`} />
      {config.label}
    </span>
  );
}

interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusDot({ status, size = 'md' }: StatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    success: 'bg-signal-green shadow-glow-green',
    warning: 'bg-signal-orange shadow-glow-orange',
    error: 'bg-signal-red shadow-glow-red',
    info: 'bg-cyber-400 shadow-glow-cyan',
    pending: 'bg-space-400',
  };

  return (
    <span className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full inline-block`} />
  );
}
