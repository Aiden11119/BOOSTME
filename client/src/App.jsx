import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import Login from './components/auth/Login';
import RegisterWizard from './components/auth/RegisterWizard';
import ForgotPassword from './components/auth/ForgotPassword';
import StudentDashboard from './components/dashboards/StudentDashboard';
import LecturerDashboard from './components/dashboards/LecturerDashboard';
import MentorDashboard from './components/dashboards/MentorDashboard';
import AdminDashboard from './components/dashboards/admin/AdminDashboard';

function App() {
  const { user, logout, isLoading } = useAuth();
  const userRole = user?.role;

  // Show a global spinner while we check auth state (localStorage/sessionStorage)
  // This prevents the loop: don't render any routes until we know auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white shadow p-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-blue-600 tracking-wide flex items-center gap-2">
            <span className="text-2xl">🎓</span> BoostMe
          </h1>
          {userRole && (
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          )}
        </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            {/* Root: redirect based on auth */}
            <Route path="/" element={<Navigate to={userRole ? `/${userRole}` : '/login'} replace />} />

            {/* Public routes: if already logged in, go to dashboard */}
            <Route path="/login" element={userRole ? <Navigate to={`/${userRole}`} replace /> : <Login />} />
            <Route path="/register" element={userRole ? <Navigate to={`/${userRole}`} replace /> : <RegisterWizard />} />
            <Route path="/forgot-password" element={userRole ? <Navigate to={`/${userRole}`} replace /> : <ForgotPassword />} />

            {/* Protected routes: if not logged in, go to login */}
            <Route path="/student/*" element={userRole === 'student' ? <StudentDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/lecturer/*" element={userRole === 'lecturer' ? <LecturerDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/mentor/*" element={userRole === 'mentor' ? <MentorDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/admin/*" element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
