'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { executeCode, ExecuteCodeResult } from '../lib/api';
import { compilerBridge } from '../wasm/compilerBridge';
import { CompilerTerminal, ExecutionMetrics } from './CompilerTerminal';
import { AstVisualizer } from './AstVisualizer';

// Dynamically import Monaco Editor to ensure SSR safety
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center bg-black/40 text-xs font-mono text-slate-400">
      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2" />
      Loading Monaco Editor...
    </div>
  ),
});

interface CodeBlockProps {
  code: string;
  label?: string;
  languageId?: string;
}

function mapLanguageToMonaco(lang?: string): string {
  if (!lang) return 'plaintext';
  const l = lang.toLowerCase();
  if (l.includes('c++') || l === 'cpp') return 'cpp';
  if (l === 'c') return 'c';
  if (l.includes('python') || l === 'py') return 'python';
  if (l.includes('javascript') || l === 'js') return 'javascript';
  if (l.includes('typescript') || l === 'ts') return 'typescript';
  if (l.includes('rust')) return 'rust';
  if (l.includes('java')) return 'java';
  if (l.includes('go')) return 'go';
  if (l.includes('lisp') || l.includes('scheme')) return 'scheme';
  if (l.includes('html')) return 'html';
  if (l.includes('css')) return 'css';
  if (l.includes('json')) return 'json';
  if (l.includes('sql')) return 'sql';
  return 'plaintext';
}

export function CodeBlock({ code, label = 'Example', languageId }: CodeBlockProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [isEditing, setIsEditing] = useState(false);
  const [showAst, setShowAst] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Terminal & execution state
  const [status, setStatus] = useState<'idle' | 'compiling' | 'running' | 'success' | 'error' | 'timeout'>('idle');
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [stdinInput, setStdinInput] = useState('');

  // Keep code in sync if external prop changes
  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  const monacoLanguage = mapLanguageToMonaco(languageId || label);
  const isDirty = currentCode !== code;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setCurrentCode(code);
  };

  const handleRun = async () => {
    setShowTerminal(true);
    setShowAst(false);
    setStatus('compiling');
    setStatusLogs(['Allocating execution sandbox...', 'Preparing compiler pipeline...']);
    setMetrics(null);

    const targetLang = (languageId || label || 'cpp').toLowerCase();

    // Check if supported client-side (e.g. Brainfuck)
    if (targetLang === 'brainfuck' || targetLang === 'bf') {
      setStatus('running');
      setStatusLogs((prev) => [...prev, 'Running in client-side WebAssembly engine...']);
      const localRes = await compilerBridge.executeLocal(targetLang, currentCode, stdinInput);
      if (localRes) {
        setMetrics({
          exitCode: localRes.exitCode,
          stdout: localRes.stdout,
          stderr: localRes.stderr,
          compileTimeMs: 0,
          executionTimeMs: localRes.executionTimeMs,
          peakMemoryBytes: 1024 * 32,
          timedOut: localRes.exitCode === 137,
          cached: false,
        });
        setStatus(localRes.exitCode === 0 ? 'success' : localRes.exitCode === 137 ? 'timeout' : 'error');
        setStatusLogs((prev) => [...prev, `Completed in ${localRes.executionTimeMs}ms`]);
        return;
      }
    }

    // Remote sandboxed execution via Spring Boot Gateway & C++ Daemon
    try {
      setStatusLogs((prev) => [...prev, `Connecting to Spring Boot Gateway (language: ${targetLang})...`]);
      const res: ExecuteCodeResult = await executeCode({
        languageId: targetLang,
        sourceCode: currentCode,
        stdinInput,
        timeoutMs: 4000,
      });

      setMetrics({
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr,
        compileTimeMs: res.compileTimeMs,
        executionTimeMs: res.executionTimeMs,
        peakMemoryBytes: res.peakMemoryBytes,
        timedOut: res.timedOut,
        cached: res.cached,
      });

      if (res.timedOut) {
        setStatus('timeout');
        setStatusLogs((prev) => [...prev, 'Process exceeded watchdog timeout limit. Terminated with SIGKILL.']);
      } else if (res.exitCode === 0) {
        setStatus('success');
        setStatusLogs((prev) => [
          ...prev,
          res.cached
            ? '⚡ Result retrieved from SHA-256 deterministic cache'
            : `Execution finished with exit code 0 (${res.executionTimeMs}ms)`,
        ]);
      } else {
        setStatus('error');
        setStatusLogs((prev) => [...prev, `Process exited with error code ${res.exitCode}`]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Execution failed';
      setStatus('error');
      setMetrics({
        exitCode: 1,
        stdout: '',
        stderr: `Gateway Error: ${errMsg}`,
        compileTimeMs: 0,
        executionTimeMs: 0,
        peakMemoryBytes: 0,
        timedOut: false,
        cached: false,
      });
      setStatusLogs((prev) => [...prev, `Execution request failed: ${errMsg}`]);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl p-1 overflow-hidden">
      {/* Code Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            {label}
          </span>
          {isDirty && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Edited
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Run Code Button */}
          <button
            onClick={handleRun}
            disabled={status === 'compiling' || status === 'running'}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all disabled:opacity-50"
            title="Compile & Run in Sandbox"
          >
            <span className="text-[10px]">▶</span>
            {status === 'compiling' || status === 'running' ? 'Running...' : 'Run Code'}
          </button>

          {/* Inspect AST Button */}
          <button
            onClick={() => {
              setShowAst(!showAst);
              if (!showAst) setShowTerminal(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showAst
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Inspect Abstract Syntax Tree"
          >
            <span className="text-[10px]">⑂</span>
            AST
          </button>

          {/* Edit / View Mode Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              isEditing
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title={isEditing ? 'Switch to View Mode' : 'Switch to Monaco Editor'}
          >
            {isEditing ? 'View' : 'Edit'}
          </button>

          {/* Reset Code */}
          {isDirty && (
            <button
              onClick={handleReset}
              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition"
              title="Reset Code"
            >
              Reset
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition"
            title="Copy snippet"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code Editor or Static Pre */}
      <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5">
        {isEditing ? (
          <MonacoEditor
            height="240px"
            language={monacoLanguage}
            value={currentCode}
            onChange={(val) => setCurrentCode(val || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12, bottom: 12 },
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            }}
          />
        ) : (
          <pre className="max-h-80 overflow-auto p-4 text-xs font-mono leading-relaxed text-slate-200 custom-scrollbar">
            <code>{currentCode}</code>
          </pre>
        )}
      </div>

      {/* Terminal Drawer */}
      {showTerminal && (
        <CompilerTerminal
          status={status}
          metrics={metrics}
          statusLogs={statusLogs}
          stdinInput={stdinInput}
          onStdinChange={setStdinInput}
          onClear={() => {
            setMetrics(null);
            setStatusLogs([]);
            setStatus('idle');
          }}
          onClose={() => setShowTerminal(false)}
        />
      )}

      {/* AST Visualizer Drawer */}
      {showAst && (
        <div className="mt-1">
          <AstVisualizer
            languageId={languageId || label}
            code={currentCode}
          />
        </div>
      )}
    </div>
  );
}
