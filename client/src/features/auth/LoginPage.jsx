import React, { useState } from 'react';
import { Layers, Lock, Mail, AlertCircle, ArrowRight, Database, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function LoginPage({ onSwitchToRegister, onOpenStatus }) {
  const { login, dbUnavailable, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-600/30 mb-4">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">CargoTrace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Cargo Damage Investigation & Evidence Integrity Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Sign In</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your authorized organization credentials to access the workspace
            </p>
          </div>

          {/* Database Unconfigured / Offline Banner */}
          {dbUnavailable && (
            <div className="mb-6 bg-amber-950/40 border border-amber-800/80 rounded-lg p-3.5 flex items-start space-x-3 text-amber-300">
              <Database className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs">
                <span className="font-semibold block">Database Connection Required</span>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  Persistent database connectivity is required to verify account credentials.
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
              <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                Work Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition cursor-pointer"
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Sign In'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need to create a new organization?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Register Organization
              </button>
            </p>
          </div>
        </div>

        {/* System telemetry link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onOpenStatus}
            className="text-xs text-slate-500 hover:text-slate-400 transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Server className="h-3.5 w-3.5" />
            <span>Platform Connectivity Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
