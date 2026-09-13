'use client';

import React from 'react';

export interface ExecutionMetrics {
  exitCode: number;
  stdout: string;
  stderr: string;
  compileTimeMs: number;
  executionTimeMs: number;
  peakMemoryBytes: number;
  timedOut: boolean;
  cached?: boolean;
}

interface CompilerTerminalProps {
  status: 'idle' | 'compiling' | 'running' | 'success' | 'error' | 'timeout';
  metrics?: ExecutionMetrics | null;
  statusLogs?: string[];
  onClear?: () => void;
  onClose?: () => void;
  stdinInput: string;
  onStdinChange: (val: string) => void;
}

export function CompilerTerminal({
  status,
  metrics,
  statusLogs = [],
  onClear,
  onClose,
  stdinInput,
  onStdinChange,
}: CompilerTerminalProps) {
  const [activeTab, setActiveTab] = React.useState<'output' | 'stdin' | 'status'>('output');

  const getStatusBadge = () => {
    switch (status) {
      case 'compiling':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] uppercase font-semibold text-amber-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Compiling...
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] uppercase font-semibold text-cyan-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Sandboxing...
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] uppercase font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Exit: {metrics?.exitCode ?? 0}
          </span>
        );
      case 'timeout':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] uppercase font-semibold text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Watchdog Timed Out
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] uppercase font-semibold text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Exit: {metrics?.exitCode ?? 1}
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-medium text-slate-500 tracking-wider">
            Ready
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-black/15 dark:border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Sandbox Terminal
          </span>
          {getStatusBadge()}
        </div>

        {/* Telemetry pill */}
        <div className="flex items-center gap-2">
          {metrics && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              {metrics.cached ? (
                <span className="text-amber-400 font-semibold">⚡ Cached</span>
              ) : (
                <>
                  {metrics.compileTimeMs > 0 && <span>Build: {metrics.compileTimeMs}ms</span>}
                  <span>Exec: {metrics.executionTimeMs}ms</span>
                  {metrics.peakMemoryBytes > 0 && (
                    <span>Mem: {Math.round(metrics.peakMemoryBytes / 1024)} KB</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab selectors */}
          <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/5 text-[11px]">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2 py-0.5 rounded transition ${
                activeTab === 'output' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Output
            </button>
            <button
              onClick={() => setActiveTab('stdin')}
              className={`px-2 py-0.5 rounded transition ${
                activeTab === 'stdin' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stdin
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-2 py-0.5 rounded transition ${
                activeTab === 'status' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Logs ({statusLogs.length})
            </button>
          </div>

          {onClear && (
            <button
              onClick={onClear}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 text-[11px]"
              title="Clear Console"
            >
              Clear
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 text-xs"
              title="Close Terminal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-3 min-h-[140px] max-h-[260px] overflow-y-auto custom-scrollbar">
        {activeTab === 'output' && (
          <div className="space-y-2">
            {status === 'compiling' || status === 'running' ? (
              <div className="flex items-center gap-2 py-4 text-cyan-400/90">
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>
                  {status === 'compiling' ? 'Invoking compiler toolchain in isolated container...' : 'Executing binary in Linux sandbox...'}
                </span>
              </div>
            ) : null}

            {metrics?.stdout && (
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed font-mono">
                {metrics.stdout}
              </pre>
            )}

            {metrics?.stderr && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 whitespace-pre-wrap leading-relaxed font-mono">
                {metrics.stderr}
              </div>
            )}

            {!metrics?.stdout && !metrics?.stderr && status !== 'compiling' && status !== 'running' && (
              <p className="text-slate-500 italic py-4">Click &quot;Execute&quot; to compile and run code in the sandbox.</p>
            )}
          </div>
        )}

        {activeTab === 'stdin' && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-slate-400">
              Provide input passed to standard input (stdin) during execution:
            </span>
            <textarea
              value={stdinInput}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter stdin input here..."
              rows={4}
              className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
            />
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-1">
            {statusLogs.length === 0 ? (
              <p className="text-slate-500 italic">No execution logs captured yet.</p>
            ) : (
              statusLogs.map((log, i) => (
                <div key={i} className="text-slate-400 text-[11px] flex items-center gap-2">
                  <span className="text-cyan-500">›</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
