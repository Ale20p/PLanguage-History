'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { compilerBridge } from '../wasm/compilerBridge';
import { AstNode, ParseResult } from '../wasm/astParser';

interface AstVisualizerProps {
  languageId: string;
  code: string;
  onSelectLine?: (line: number) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TranslationUnit: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Module: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Program: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  FunctionDefinition: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  FunctionDef: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  IncludeDirective: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  ImportStatement: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  CompoundStatement: { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
  Statement: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  ListExpression: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Loop: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Instruction: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Atom: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30' },
  NumberLiteral: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
};

function getNodeStyle(type: string) {
  return TYPE_COLORS[type] || { bg: 'bg-white/5', text: 'text-slate-300', border: 'border-white/10' };
}

interface TreeNodeProps {
  node: AstNode;
  level: number;
  filter: string;
  isAllExpanded: boolean;
  onSelectLine?: (line: number) => void;
}

function TreeNode({ node, level, filter, isAllExpanded, onSelectLine }: TreeNodeProps) {
  const [localOpen, setLocalOpen] = useState<boolean | null>(null);
  const isOpen = localOpen !== null ? localOpen : isAllExpanded;

  const hasChildren = node.children && node.children.length > 0;
  const style = getNodeStyle(node.type);

  const matchesFilter = useMemo(() => {
    if (!filter) return true;
    const lower = filter.toLowerCase();
    const selfMatch = node.type.toLowerCase().includes(lower) ||
      node.label.toLowerCase().includes(lower) ||
      (node.value && node.value.toLowerCase().includes(lower));

    if (selfMatch) return true;

    // Check if any descendant matches
    const checkDescendants = (n: AstNode): boolean => {
      if (n.type.toLowerCase().includes(lower) ||
          n.label.toLowerCase().includes(lower) ||
          (n.value && n.value.toLowerCase().includes(lower))) return true;
      return !!n.children?.some(checkDescendants);
    };

    return hasChildren && node.children!.some(checkDescendants);
  }, [filter, node, hasChildren]);

  if (!matchesFilter) return null;

  return (
    <div className="flex flex-col select-none text-xs font-mono">
      <div
        className={`group flex items-center gap-2 py-1 px-2 rounded-lg transition-colors hover:bg-white/5 ${
          level > 0 ? 'ml-4' : ''
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => setLocalOpen(!isOpen)}
            className="w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10"
            title={isOpen ? 'Collapse node' : 'Expand node'}
          >
            {isOpen ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-slate-600 text-[10px]">•</span>
        )}

        {/* Node Type Badge */}
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${style.bg} ${style.text} ${style.border}`}
        >
          {node.type}
        </span>

        {/* Label */}
        <span className="text-slate-200 font-medium">{node.label}</span>

        {/* Value snippet */}
        {node.value && (
          <span className="text-slate-400 bg-white/5 px-2 py-0.5 rounded max-w-xs truncate border border-white/5">
            {node.value}
          </span>
        )}

        {/* Line Reference */}
        {node.line && (
          <button
            onClick={() => onSelectLine?.(node.line!)}
            className="ml-auto text-[10px] text-slate-500 hover:text-cyan-400 px-1.5 py-0.5 rounded bg-black/20 border border-white/5"
            title={`Jump to line ${node.line}`}
          >
            L:{node.line}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="border-l border-white/10 ml-2 pl-2 flex flex-col gap-0.5 my-0.5">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              filter={filter}
              isAllExpanded={isAllExpanded}
              onSelectLine={onSelectLine}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AstVisualizer({ languageId, code, onSelectLine }: AstVisualizerProps) {
  const currentKey = `${languageId}:::${code}`;
  const [state, setState] = useState<{ key: string; result: ParseResult | null; loading: boolean }>({
    key: currentKey,
    result: null,
    loading: true,
  });
  const [filter, setFilter] = useState('');
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    compilerBridge.parseAst(languageId, code).then((res) => {
      if (!isCancelled) {
        setState({ key: currentKey, result: res, loading: false });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [languageId, code, currentKey]);

  const loading = state.key !== currentKey || state.loading;
  const parseResult = state.key === currentKey ? state.result : null;

  return (
    <div className="flex flex-col h-full bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Visualizer Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            AST Engine (Wasm)
          </span>
          {parseResult && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
              {parseResult.totalNodes} Nodes • Depth {parseResult.maxDepth}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter nodes..."
              className="px-2.5 py-1 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-36 sm:w-44 transition-all"
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="absolute right-2 top-1 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Expand / Collapse All */}
          <button
            onClick={() => setIsAllExpanded(!isAllExpanded)}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>

          {/* JSON toggle */}
          <button
            onClick={() => setShowJson(!showJson)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              showJson
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {showJson ? 'Tree View' : '{ } JSON'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-auto max-h-[460px] custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Parsing Abstract Syntax Tree in WebWorker...</span>
          </div>
        ) : parseResult?.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            {parseResult.error}
          </div>
        ) : showJson ? (
          <pre className="p-4 rounded-xl bg-black/40 border border-white/5 text-slate-300 text-xs font-mono overflow-auto leading-relaxed">
            {JSON.stringify(parseResult?.root, null, 2)}
          </pre>
        ) : parseResult?.root ? (
          <div className="space-y-1">
            <TreeNode
              node={parseResult.root}
              level={0}
              filter={filter}
              isAllExpanded={isAllExpanded}
              onSelectLine={onSelectLine}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">No AST available for this snippet.</div>
        )}
      </div>
    </div>
  );
}
