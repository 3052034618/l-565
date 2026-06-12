import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TaskList from "@/pages/TaskList";
import TaskDetail from "@/pages/TaskDetail";
import NewTask from "@/pages/NewTask";
import AlertCenter from "@/pages/AlertCenter";
import ApprovalCenter from "@/pages/ApprovalCenter";
import DataExport from "@/pages/DataExport";
import Recommendations from "@/pages/Recommendations";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/new" element={<NewTask />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="alerts" element={<AlertCenter />} />
          <Route path="approval" element={<ApprovalCenter />} />
          <Route path="export" element={<DataExport />} />
          <Route path="recommend" element={<Recommendations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
