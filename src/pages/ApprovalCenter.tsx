import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  Check,
  X,
  MessageSquare,
  FileText,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatusBadge } from '@/components/ui/StatusBadge';
import { TaskStatus } from '@shared/types';

type ApprovalTab = 'verification' | 'confirmation' | 'history';

export default function ApprovalCenter() {
  const navigate = useNavigate();
  const { pendingApprovals, fetchPendingApprovals, tasks, fetchTasks, approveVerification, rejectVerification, approveConfirmation, rejectConfirmation, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('verification');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
    fetchTasks();
  }, []);

  const verificationTasks = pendingApprovals.filter((t) => t.status === TaskStatus.PENDING_VERIFICATION);
  const confirmationTasks = pendingApprovals.filter((t) => t.status === TaskStatus.PENDING_CONFIRMATION);
  const historyTasks = tasks.filter((t) =>
    [TaskStatus.APPROVED, TaskStatus.FALLBACK].includes(t.status as TaskStatus)
  );

  const handleApprove = (taskId: string) => {
    if (activeTab === 'verification') {
      approveVerification(taskId, comment);
    } else {
      approveConfirmation(taskId, comment);
    }
    setSelectedTask(null);
    setComment('');
  };

  const handleReject = (taskId: string) => {
    if (activeTab === 'verification') {
      rejectVerification(taskId, comment);
    } else {
      rejectConfirmation(taskId, comment);
    }
    setSelectedTask(null);
    setComment('');
  };

  const currentTasks =
    activeTab === 'verification'
      ? verificationTasks
      : activeTab === 'confirmation'
      ? confirmationTasks
      : historyTasks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-space-100">审批中心</h1>
          <p className="text-space-400 text-sm mt-1">数据验证与项目确认两级审批流程</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-signal-yellow/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-signal-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-signal-yellow font-display">
                {verificationTasks.length}
              </p>
              <p className="text-sm text-space-400">待数据验证</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-cyber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyber-300 font-display">
                {confirmationTasks.length}
              </p>
              <p className="text-sm text-space-400">待项目确认</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-signal-green/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-signal-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-signal-green font-display">
                {historyTasks.filter((t) => t.status === TaskStatus.APPROVED).length}
              </p>
              <p className="text-sm text-space-400">已通过审批</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-space-800/50 rounded-lg w-fit">
        {[
          { key: 'verification', label: '待验证', count: verificationTasks.length },
          { key: 'confirmation', label: '待确认', count: confirmationTasks.length },
          { key: 'history', label: '审批历史', count: historyTasks.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ApprovalTab)}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
              activeTab === tab.key
                ? 'bg-cyber-500/20 text-cyber-300'
                : 'text-space-400 hover:text-space-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key ? 'bg-cyber-500/30' : 'bg-space-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {currentTasks.length > 0 ? (
          currentTasks.map((task) => {
            const isSelected = selectedTask === task.id;

            return (
              <div key={task.id} className="glass-card overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-space-800/30 transition-colors"
                  onClick={() => setSelectedTask(isSelected ? null : task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-space-700/50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyber-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-space-100">{task.name}</h3>
                        <p className="text-xs text-space-400 mt-0.5">
                          信号源: {task.signalSource.type} · 质量: {task.signalSource.mass1}/
                          {task.signalSource.mass2} M☉
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <TaskStatusBadge status={task.status as TaskStatus} size="sm" />
                      <span className="text-xs text-space-500">
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <Eye className="w-4 h-4 text-space-500" />
                    </div>
                  </div>
                </div>

                {isSelected && activeTab !== 'history' && (
                  <div className="px-5 pb-5 border-t border-cyber-500/10 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-space-800/30">
                        <p className="text-xs text-space-400 mb-1">质量 1</p>
                        <p className="text-sm font-mono text-space-100">
                          {task.signalSource.mass1} M☉
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-space-800/30">
                        <p className="text-xs text-space-400 mb-1">质量 2</p>
                        <p className="text-sm font-mono text-space-100">
                          {task.signalSource.mass2} M☉
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-space-800/30">
                        <p className="text-xs text-space-400 mb-1">距离</p>
                        <p className="text-sm font-mono text-space-100">
                          {task.signalSource.distance} Mpc
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-space-800/30">
                        <p className="text-xs text-space-400 mb-1">创建人</p>
                        <p className="text-sm text-space-100">张分析</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-space-300 mb-2">
                        {activeTab === 'verification' ? '验证意见' : '确认意见'}
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`请输入${activeTab === 'verification' ? '验证' : '确认'}意见...`}
                        rows={3}
                        className="w-full px-3 py-2 bg-space-900/50 border border-cyber-500/20 rounded-lg text-sm text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50 resize-none"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="text-sm text-cyber-400 hover:text-cyber-300 transition-colors"
                      >
                        查看任务详情 →
                      </button>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(task.id)}
                          className="px-5 py-2 bg-signal-red/20 text-signal-red rounded-lg hover:bg-signal-red/30 flex items-center gap-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          驳回
                        </button>
                        <button
                          onClick={() => handleApprove(task.id)}
                          className="px-5 py-2 bg-signal-green/20 text-signal-green rounded-lg hover:bg-signal-green/30 flex items-center gap-2 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          {activeTab === 'verification' ? '通过验证' : '通过确认'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isSelected && activeTab === 'history' && (
                  <div className="px-5 pb-5 border-t border-cyber-500/10 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-space-400">
                          审批状态:{' '}
                          <span
                            className={
                              task.status === TaskStatus.APPROVED
                                ? 'text-signal-green'
                                : 'text-signal-orange'
                            }
                          >
                            {task.status === TaskStatus.APPROVED ? '已通过' : '已驳回'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="text-sm text-cyber-400 hover:text-cyber-300 transition-colors"
                      >
                        查看详情 →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center">
            <CheckSquare className="w-12 h-12 text-space-600 mx-auto mb-4" />
            <p className="text-space-400">
              {activeTab === 'verification'
                ? '暂无待验证任务'
                : activeTab === 'confirmation'
                ? '暂无待确认任务'
                : '暂无审批历史'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
