import React, { useEffect, useRef, useState, useId } from 'react';
import { AlertCircle, Download, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

let mermaidInitialized = false;

const initMermaid = async (isDark) => {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    themeVariables: isDark
      ? { primaryColor: '#7c3aed', primaryTextColor: '#e2e8f0', primaryBorderColor: '#6d28d9', lineColor: '#64748b', secondaryColor: '#1e293b', tertiaryColor: '#0f172a', background: '#0f172a', mainBkg: '#1e293b', nodeBorder: '#6d28d9', clusterBkg: '#1e293b', titleColor: '#e2e8f0', edgeLabelBackground: '#1e293b', nodeTextColor: '#e2e8f0' }
      : { primaryColor: '#7c3aed', primaryTextColor: '#1e293b', primaryBorderColor: '#8b5cf6', lineColor: '#94a3b8', secondaryColor: '#f5f3ff', tertiaryColor: '#ede9fe', background: '#ffffff', mainBkg: '#f5f3ff', nodeBorder: '#8b5cf6', clusterBkg: '#f5f3ff', titleColor: '#1e293b', edgeLabelBackground: '#ffffff', nodeTextColor: '#1e293b' },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: 14,
    flowchart: { curve: 'basis', padding: 15 },
    sequence: { actorMargin: 60, messageFontSize: 13 },
    gantt: { fontSize: 12, barHeight: 24, topPadding: 40 },
    er: { fontSize: 12 },
  });
  mermaidInitialized = true;
  return mermaid;
};

export const MermaidDiagram = ({ code, className }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svgHtml, setSvgHtml] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const uniqueId = useId().replace(/:/g, '_');
  const diagramId = `mermaid_${uniqueId}`;

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!code?.trim()) return;
    let cancelled = false;

    const render = async () => {
      try {
        setError(null);
        const mermaid = await initMermaid(isDark);

        // Validate syntax first
        await mermaid.parse(code.trim());

        const { svg } = await mermaid.render(diagramId, code.trim());
        if (!cancelled) setSvgHtml(svg);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to render diagram');
      }
    };

    // Small delay to batch rapid re-renders during streaming
    const timer = setTimeout(render, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code, isDark, diagramId]);

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className={cn("my-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden", className)}>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100/50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">Diagram syntax error</span>
        </div>
        <pre className="p-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  if (!svgHtml) {
    return (
      <div className={cn("my-4 flex items-center justify-center py-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50", className)}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          Rendering diagram...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("my-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 overflow-hidden group", className)} data-testid="mermaid-diagram">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-gray-700">
        <span className="text-[10px] font-medium text-violet-500 dark:text-violet-400 uppercase tracking-wider">Mermaid Diagram</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopyCode} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Copy source">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          <button onClick={handleDownloadSvg} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Download SVG">
            <Download className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5 text-gray-400" /> : <Maximize2 className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Diagram */}
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center p-6 overflow-auto transition-all",
          expanded ? "max-h-none" : "max-h-[500px]"
        )}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
};
