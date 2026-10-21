import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  HardDrive,
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Activity,
  Clock
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';

export function SystemStatusModal({ isOpen, onClose }) {
  const [healthState, setHealthState] = useState({
    loading: true,
    data: null,
    latencyMs: null,
    error: null,
    lastChecked: null
  });

  const checkHealth = useCallback(async () => {
    setHealthState(prev => ({ ...prev, loading: true }));
    try {
      const result = await apiClient.checkHealth();
      setHealthState({
        loading: false,
        data: result.data,
        latencyMs: result.latencyMs,
        error: result.error,
        lastChecked: new Date()
      });
    } catch (err) {
      setHealthState({
        loading: false,
        data: null,
        latencyMs: null,
        error: err,
        lastChecked: new Date()
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen, checkHealth]);

  if (!isOpen) return null;

  const data = healthState.data;
  const dbStatus = data?.subsystems?.database;
  const storageStatus = data?.subsystems?.storage;
  const aiStatus = data?.subsystems?.ai;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <Server className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">System Health & Telemetry</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
              disabled={healthState.loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 ${healthState.loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* API Server Status */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Backend API (Express)</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                data ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}>
                {data ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />}
                {data?.status?.toUpperCase() || 'UNREACHABLE'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono text-slate-400">
              <div>
                <span className="text-slate-500 block">Latency</span>
                <span className="text-slate-200">{healthState.latencyMs !== null ? `${healthState.latencyMs}ms` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Uptime</span>
                <span className="text-slate-200">{data?.uptimeSeconds !== undefined ? `${data.uptimeSeconds}s` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Environment</span>
                <span className="text-slate-200">{data?.environment || '—'}</span>
              </div>
            </div>
          </div>

          {/* Subsystems */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* MongoDB */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>MongoDB</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                  dbStatus?.connected
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {dbStatus?.connected ? 'Connected' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {dbStatus?.connected ? (dbStatus.host || 'Connected') : 'MONGODB_URI required for auth & data persistence'}
              </p>
            </div>

            {/* Firebase */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <HardDrive className="h-4 w-4 text-amber-400" />
                  <span>Firebase</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                  storageStatus?.initialized
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {storageStatus?.initialized ? 'Ready' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {storageStatus?.initialized ? 'Storage bucket ready' : 'Required for Phase 5 evidence uploads'}
              </p>
            </div>

            {/* Gemini AI */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Gemini AI</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                  aiStatus?.status === 'ready'
                    ? 'bg-purple-950 text-purple-400 border-purple-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {aiStatus?.status === 'ready' ? 'Ready' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {aiStatus?.status === 'ready' ? aiStatus.model : 'Required for Phase 7 analysis'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
