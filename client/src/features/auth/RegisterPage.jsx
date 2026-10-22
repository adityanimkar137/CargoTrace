import React, { useState } from 'react';
import { Layers, Lock, Mail, User, Building, AlertCircle, ArrowRight, Database, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function RegisterPage({ onSwitchToLogin, onOpenStatus }) {
  const { register, dbUnavailable, error: authError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!displayName || !email || !password || !organizationName) {
      setFormError('All fields are required to establish your organization workspace.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ email, password, displayName, organizationName });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-600/30 mb-4">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">CargoTrace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Organization Onboarding & Evidence Management Setup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Establish Organization</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create an administrative account and primary organization boundary
            </p>
          </div>

          {/* Database Unconfigured Banner */}
          {dbUnavailable && (
            <div className="mb-6 bg-amber-950/40 border border-amber-800/80 rounded-lg p-3.5 flex items-start space-x-3 text-amber-300">
              <Database className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs">
                <span className="font-semibold block">MongoDB Disconnected</span>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  Real persistence requires <code className="bg-amber-950 px-1 py-0.5 rounded font-mono">MONGODB_URI</code> in <code className="bg-amber-950 px-1 py-0.5 rounded font-mono">server/.env</code>. Fictional accounts or local bypasses are prohibited.
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {(formError || authError) && !dbUnavailable && (
            <div className="mb-5 bg-rose-950/50 border border-rose-900 rounded-lg p-3 flex items-start space-x-2.5 text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-xs">{formError || authError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Sarah Chen"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="orgName" className="block text-xs font-medium text-slate-300">
                Organization / Company Name
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Pacific Maritime Logistics"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="regEmail" className="block text-xs font-medium text-slate-300">
                Business Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="regEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.chen@pacificmaritime.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="regPassword" className="block text-xs font-medium text-slate-300">
                Password (min. 8 characters)
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="regPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition cursor-pointer"
            >
              <span>{submitting ? 'Creating Organization...' : 'Register & Create Workspace'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Telemetry link */}
        <div className="mt-6 text-center">
          <button
            onClick={onOpenStatus}
            className="text-xs text-slate-500 hover:text-slate-400 transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Server className="h-3.5 w-3.5" />
            <span>Check Platform Subsystems Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
