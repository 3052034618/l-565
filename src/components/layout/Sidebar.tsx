import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  AlertTriangle,
  CheckSquare,
  Download,
  Lightbulb,
  Settings,
  LogOut,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const menuItems = [
  { path: '/dashboard', label: '综合看板', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/alerts', label: '预警中心', icon: AlertTriangle },
  { path: '/approval', label: '审批中心', icon: CheckSquare },
  { path: '/export', label: '数据导出', icon: Download },
  { path: '/recommend', label: '智能推荐', icon: Lightbulb },
  { path: '/settings', label: '系统配置', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, qualityPaused } = useAppStore();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-space-950/80 backdrop-blur-xl border-r border-cyber-500/20 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-cyber-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center shadow-glow-cyan">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-cyber-300 text-glow-cyan">
              GW Analyzer
            </h1>
            <p className="text-xs text-space-400">引力波分析平台</p>
          </div>
        </div>
      </div>

      {qualityPaused && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-signal-orange/20 border border-signal-orange/40">
          <div className="flex items-center gap-2 text-signal-orange text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>质量暂停中</span>
          </div>
          <p className="text-xs text-signal-orange/70 mt-1">新任务提交已暂停</p>
        </div>
      )}

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-cyber-500/20 text-cyber-300 shadow-[inset_0_0_20px_rgba(0,212,255,0.1)] border border-cyber-500/30'
                  : 'text-space-300 hover:bg-cyber-500/10 hover:text-cyber-300'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-400' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyber-500/10">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-space-600 to-space-800 flex items-center justify-center border border-cyber-500/30">
              <span className="text-sm font-medium text-cyber-300">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-space-100 truncate">{user.name}</p>
              <p className="text-xs text-space-400 truncate">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-space-400 hover:text-space-200 hover:bg-space-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
