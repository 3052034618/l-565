import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Clock,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatusBadge, StatusDot } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/StatCard';
import { TaskStatus } from '@shared/types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: TaskStatus.PENDING_VALIDATION, label: '待校验' },
  { value: TaskStatus.MODEL_BUILDING, label: '模型构建中' },
  { value: TaskStatus.NOISE_SIMULATION, label: '噪声模拟中' },
  { value: TaskStatus.SIGNAL_INJECTION, label: '信号注入中' },
  { value: TaskStatus.PARAMETER_ESTIMATION, label: '参数估计中' },
  { value: TaskStatus.COMPLETED, label: '分析完成' },
  { value: TaskStatus.PENDING_VERIFICATION, label: '待验证' },
  { value: TaskStatus.PENDING_CONFIRMATION, label: '待确认' },
  { value: TaskStatus.APPROVED, label: '已通过' },
  { value: TaskStatus.FALLBACK, label: '异常回退' },
];

export default function TaskList() {
  const navigate = useNavigate();
  const { tasks, detectors, fetchTasks, fetchDetectors, qualityPaused } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDetector, setSelectedDetector] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchDetectors();
  }, []);

  useEffect(() => {
    fetchTasks({
      status: selectedStatus as TaskStatus | undefined,
      detectorConfigId: selectedDetector || undefined,
    });
  }, [selectedStatus, selectedDetector]);

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">任务管理</h1>
          <p className="text-space-400 text-sm mt-1">查看和管理所有分析任务</p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          disabled={qualityPaused}
          className="px-4 py-2 bg-gradient-to-r from-cyber-500 to-cyber-600 hover:from-cyber-400 hover:to-cyber-500 text-white text-sm font-medium rounded-lg transition-all shadow-glow-cyan flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      {qualityPaused && (
        <div className="p-4 rounded-lg bg-signal-orange/10 border border-signal-orange/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-signal-orange/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-signal-orange" />
          </div>
          <div>
            <p className="text-sm font-medium text-signal-orange">系统处于质量暂停状态</p>
            <p className="text-xs text-signal-orange/70">
              同一探测器构型连续三次模拟的灵敏度假定偏差超过阈值，新任务提交已暂停。请联系首席科学家处理。
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索任务名称..."
              className="w-full pl-9 pr-4 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-space-400" />
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

            <select
              value={selectedDetector}
              onChange={(e) => setSelectedDetector(e.target.value)}
              className="px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 focus:outline-none focus:border-cyber-400/50"
            >
              <option value="">全部构型</option>
              {detectors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const detector = detectors.find((d) => d.id === task.detectorConfigId);
          const isRunning = [
            TaskStatus.MODEL_BUILDING,
            TaskStatus.NOISE_SIMULATION,
            TaskStatus.SIGNAL_INJECTION,
            TaskStatus.PARAMETER_ESTIMATION,
          ].includes(task.status as TaskStatus);

          return (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="glass-card-hover p-5 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isRunning ? 'bg-cyber-500/20 animate-pulse' : 'bg-space-700/50'
                  }`}>
                    <ListTodo className={`w-6 h-6 ${isRunning ? 'text-cyber-400' : 'text-space-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-space-100 group-hover:text-cyber-200 transition-colors truncate">
                        {task.name}
                      </h3>
                      <TaskStatusBadge status={task.status as TaskStatus} size="sm" />
                      {isRunning && <StatusDot status="info" size="sm" />}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-space-400 mb-3">
                      <span>探测器: {detector?.name || '未知'}</span>
                      <span>信号源: {task.signalSource.type}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    {isRunning && (
                      <div className="max-w-md">
                        <ProgressBar value={task.progress} size="sm" color="cyan" />
                        <p className="text-xs text-space-500 mt-1">{task.currentStep}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 rounded-lg text-space-400 hover:text-cyber-300 hover:bg-cyber-500/10 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="glass-card p-12 text-center">
            <ListTodo className="w-12 h-12 text-space-600 mx-auto mb-4" />
            <p className="text-space-400">暂无任务</p>
            <button
              onClick={() => navigate('/tasks/new')}
              className="mt-4 px-4 py-2 bg-cyber-500/20 text-cyber-300 rounded-lg text-sm hover:bg-cyber-500/30 transition-colors"
            >
              创建第一个任务
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
