import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Login() {
  const [username, setUsername] = useState('analyst');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-gradient star-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-500/5 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-400 to-cyber-600 shadow-glow-cyan mb-4 animate-float">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-cyber-200 text-glow-cyan mb-2">
            GW Analyzer
          </h1>
          <p className="text-space-400">引力波探测器干涉仪分析平台</p>
        </div>

        <div className="glass-card p-8 border-glow">
          <h2 className="text-xl font-semibold text-space-100 mb-6">登录账户</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-space-300 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-space-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50 focus:ring-2 focus:ring-cyber-400/20 transition-all"
                  placeholder="输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-space-300 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-space-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-space-900/50 border border-cyber-500/20 rounded-lg text-space-100 placeholder-space-500 focus:outline-none focus:border-cyber-400/50 focus:ring-2 focus:ring-cyber-400/20 transition-all"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-signal-red/10 border border-signal-red/30 text-signal-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyber-500 to-cyber-600 hover:from-cyber-400 hover:to-cyber-500 text-white font-medium rounded-lg transition-all duration-300 shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyber-500/10">
            <p className="text-xs text-space-500 text-center mb-3">快速体验账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-space-800/50 text-center">
                <span className="text-space-400">数据分析员：</span>
                <span className="text-cyber-300 font-mono">analyst</span>
              </div>
              <div className="p-2 rounded bg-space-800/50 text-center">
                <span className="text-space-400">验证员：</span>
                <span className="text-cyber-300 font-mono">verifier</span>
              </div>
              <div className="p-2 rounded bg-space-800/50 text-center">
                <span className="text-space-400">负责人：</span>
                <span className="text-cyber-300 font-mono">lead</span>
              </div>
              <div className="p-2 rounded bg-space-800/50 text-center">
                <span className="text-space-400">首席：</span>
                <span className="text-cyber-300 font-mono">chief</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-space-600 text-xs mt-6">
          © 2024 GW Analyzer Platform - 引力波数据分析系统
        </p>
      </div>
    </div>
  );
}
