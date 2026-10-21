import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { RegisterPage } from './features/auth/RegisterPage.jsx';
import { OrganizationView } from './features/organization/OrganizationView.jsx';
import { SystemStatusModal } from './components/feedback/SystemStatusModal.jsx';
import { Layers, Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span>Restoring CargoTrace Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <LoginPage
            onSwitchToRegister={() => setAuthView('register')}
            onOpenStatus={() => setIsStatusModalOpen(true)}
          />
        ) : (
          <RegisterPage
            onSwitchToLogin={() => setAuthView('login')}
            onOpenStatus={() => setIsStatusModalOpen(true)}
          />
        )}
        <SystemStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
        />
      </>
    );
  }

  return <OrganizationView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
