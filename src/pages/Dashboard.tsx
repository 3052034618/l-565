import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Target,
  Clock,
  AlertTriangle,
  ListTodo,
  CheckSquare,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/GWCharts';
import { TaskStatusBadge } from '@/components/ui/StatusBadge';
import { TaskStatus } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    dashboardStats,
    trendData,
    tasks,
    alerts,
    fetchDashboardStats,
    fetchTrendData,
    fetchTasks,
    fetchAlerts,
  } = useAppStore();

  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    fetchDashboardStats();
    fetchTrendData(timeRange === '7d' ? 7 : 30);
    fetchTasks();
    fetchAlerts({ status: 'pending' });
  }, [timeRange]);

  const recentTasks = tasks.slice(0, 5);
  const activeAlerts = alerts.filter((a) => a.status === 'pending').slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">综合看板</h1>
          <p className="text-space-400 text-sm mt-1">引力波分析任务与系统状态总览</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tasks/new')}
            className="px-4 py-2 bg-gradient-to-r from-cyber-500 to-cyber-600 hover:from-cyber-400 hover:to-cyber-500 text-white text-sm font-medium rounded-lg transition-all shadow-glow-cyan flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            新建任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="任务完成率"
          value={dashboardStats?.completionRate.toFixed(1) || '0'}
          unit="%"
          icon={<Target className="w-6 h-6" />}
          trend={2.3}
          trendLabel="较上周"
          color="green"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          title="平均估计精度"
          value={dashboardStats?.avgEstimationAccuracy.toFixed(1) || '0'}
          unit="%"
          icon={<Activity className="w-6 h-6" />}
          trend={1.2}
          trendLabel="较上周"
          color="cyan"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          title="平均计算耗时"
          value={dashboardStats?.avgComputationTime.toFixed(0) || '0'}
          unit="秒"
          icon={<Clock className="w-6 h-6" />}
          trend={-5.4}
          trendLabel="较上周"
          color="cyan"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          title="待处理预警"
          value={dashboardStats?.activeAlerts || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="orange"
          onClick={() => navigate('/alerts')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-space-100">性能趋势</h3>
              <p className="text-sm text-space-400">任务完成率与估计精度变化</p>
            </div>
            <div className="flex gap-1 p-1 bg-space-800/50 rounded-lg">
              {(['7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-cyber-500/20 text-cyber-300'
                      : 'text-space-400 hover:text-space-200'
                  }`}
                >
                  {range === '7d' ? '近7天' : '近30天'}
                </button>
              ))}
            </div>
          </div>
          {trendData && (
            <TrendChart
              dates={trendData.dates}
              series={[
                { name: '完成率(%)', data: trendData.completionRate, color: '#00d4ff' },
                { name: '估计精度(%)', data: trendData.accuracy, color: '#00ff88' },
                { name: '任务数', data: trendData.taskCount, color: '#ffcc00', unit: '个' },
              ]}
              height={280}
              yAxisName="指标值"
            />
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-space-100">快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/tasks/new')}
              className="p-4 rounded-xl bg-gradient-to-br from-cyber-500/20 to-cyber-600/10 border border-cyber-500/30 hover:border-cyber-400/50 hover:shadow-glow-cyan transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-cyber-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-cyber-300" />
              </div>
              <p className="text-sm font-medium text-space-100">新建任务</p>
              <p className="text-xs text-space-400 mt-1">创建分析任务</p>
            </button>

            <button
              onClick={() => navigate('/approval')}
              className="p-4 rounded-xl bg-gradient-to-br from-signal-green/20 to-signal-green/5 border border-signal-green/30 hover:border-signal-green/50 hover:shadow-glow-green transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-signal-green/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5 text-signal-green" />
              </div>
              <p className="text-sm font-medium text-space-100">待办审批</p>
              <p className="text-xs text-space-400 mt-1">
                {dashboardStats?.pendingApprovals || 0} 项待处理
              </p>
            </button>

            <button
              onClick={() => navigate('/alerts')}
              className="p-4 rounded-xl bg-gradient-to-br from-signal-orange/20 to-signal-orange/5 border border-signal-orange/30 hover:border-signal-orange/50 hover:shadow-glow-orange transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-signal-orange/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5 text-signal-orange" />
              </div>
              <p className="text-sm font-medium text-space-100">预警中心</p>
              <p className="text-xs text-space-400 mt-1">
                {dashboardStats?.activeAlerts || 0} 条活跃预警
              </p>
            </button>

            <button
              onClick={() => navigate('/recommend')}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-400/50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-purple-300" />
              </div>
              <p className="text-sm font-medium text-space-100">智能推荐</p>
              <p className="text-xs text-space-400 mt-1">滤波器与参数推荐</p>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-space-100">最近任务</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-cyber-400 hover:text-cyber-300 transition-colors"
            >
              查看全部
            </button>
          </div>

          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/10 hover:border-cyber-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ListTodo className="w-5 h-5 text-cyber-400" />
                    <span className="font-medium text-space-100 group-hover:text-cyber-200 transition-colors">
                      {task.name}
                    </span>
                  </div>
                  <TaskStatusBadge status={task.status as TaskStatus} size="sm" />
                </div>
                <div className="flex items-center justify-between text-xs text-space-400">
                  <span>{new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                  <div className="flex items-center gap-4">
                    <span>进度: {task.progress}%</span>
                    <span>{task.currentStep}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-space-100">最新预警</h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-sm text-cyber-400 hover:text-cyber-300 transition-colors"
            >
              全部预警
            </button>
          </div>

          <div className="space-y-3">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-space-800/30 border-l-4 border-signal-orange"
                >
                  <p className="text-sm font-medium text-space-100 line-clamp-2">
                    {alert.message}
                  </p>
                  <p className="text-xs text-space-500 mt-2">
                    {new Date(alert.triggeredAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="w-10 h-10 text-signal-green mx-auto mb-2 opacity-50" />
                <p className="text-sm text-space-400">暂无待处理预警</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {dashboardStats?.tasksByStatus && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-space-100 mb-4">任务状态分布</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Object.entries(dashboardStats.tasksByStatus).map(([status, count]) => (
              <div
                key={status}
                className="p-4 rounded-lg bg-space-800/30 border border-cyber-500/10 text-center"
              >
                <div className="text-2xl font-bold text-cyber-300 font-mono">{count}</div>
                <div className="text-xs text-space-400 mt-1">
                  {status.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
