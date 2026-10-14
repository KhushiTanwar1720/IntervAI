import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Roles from './pages/Roles';
import JobDescription from './pages/JobDescription';
import Roadmap from './pages/Roadmap';
import Resources from './pages/Resources';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import InterviewReport from './pages/InterviewReport';
import InterviewHistory from './pages/InterviewHistory';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Distraction-free focus mode: no sidebar/header chrome during a live interview */}
        <Route path="/interviews/:id/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/job-description" element={<JobDescription />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/interviews/new" element={<InterviewSetup />} />
          <Route path="/interviews/history" element={<InterviewHistory />} />
          <Route path="/interviews/:id/report" element={<InterviewReport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
