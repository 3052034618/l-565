import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const { user, fetchDetectors, fetchNoiseModels, fetchQualityStatus } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!user && savedUser) {
      useAppStore.getState().setUser(JSON.parse(savedUser));
    } else if (!user && !savedUser) {
      navigate('/login');
    }

    fetchDetectors();
    fetchNoiseModels();
    fetchQualityStatus();
  }, []);

  return (
    <div className="min-h-screen bg-space-gradient star-bg">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
