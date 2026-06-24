import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Download, Maximize2, Minimize2, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

let renderCounter = 0;

const initMermaid = async (isDark) => {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: isDark ? 'dark' : 'default',
    themeVariables: isDark
      ? { primaryColor: '#7c3aed', primaryTextColor: '#e2e8f0', primaryBorderColor: '#6d28d9', lineColor: '#64748b', secondaryColor: '#1e293b', tertiaryColor: '#0f172a', background: '#0f172a', mainBkg: '#1e293b', nodeBorder: '#6d28d9', clusterBkg: '#1e293b', titleColor: '#e2e8f0', edgeLabelBackground: '#1e293b', nodeTextColor: '#e2e8f0' }
      : { primaryColor: '#7c3aed', primaryTextColor: '#1e293b', primaryBorderColor: '#8b5cf6', lineColor: '#94a3b8', secondaryColor: '#f5f3ff', tertiaryColor: '#ede9fe', background: '#ffffff', mainBkg: '#f5f3ff', nodeBorder: '#8b5cf6', clusterBkg: '#f5f3ff', titleColor: '#1e293b', edgeLabelBackground: '#ffffff', nodeTextColor: '#1e293b' },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: 14,
    flowchart: { curve: 'basis', padding: 15, htmlLabels: true },
    sequence: { actorMargin: 60, messageFontSize: 13 },
    gantt: { fontSize: 12, barHeight: 24, topPadding: 40 },
    er: { fontSize: 12 },
  });
  return mermaid;
};

// Sanitize mermaid code to fix common LLM output issues
const sanitizeMermaidCode = (code) => {
  let cleaned = code.trim();

  // Remove any leading/trailing markdown fence artifacts
  cleaned = cleaned.replace(/^```mermaid\s*/i, '').replace(/```\s*$/, '');

  // For flowcharts/graph diagrams: auto-quote node labels with special chars
  const specialCharsPattern = /[\/():;+&]/;
  
  // Fix cylinder nodes FIRST: ID[("text")] -> ID["text"] (convert to rectangle, cylinder+quotes breaks mermaid)
  cleaned = cleaned.replace(
    /(\w+)\[\("([^"]+)"\)\]/g,
    (match, id, label) => `${id}["${label}"]`
  );
  
  // Fix unquoted cylinder nodes: ID[(text)] -> ID["text"] when text has special chars
  cleaned = cleaned.replace(
    /(\w+)\[\(([^)"]+)\)\]/g,
    (match, id, label) => {
      if (specialCharsPattern.test(label)) {
        return `${id}["${label.replace(/"/g, "'")}"]`;
      }
      return match;
    }
  );
  
  // Quote text in square bracket nodes: ID[text] -> ID["text"]
  cleaned = cleaned.replace(
    /(\w+)\[([^\]"]+)\]/g,
    (match, id, label) => {
      if (specialCharsPattern.test(label)) {
        return `${id}["${label.replace(/"/g, "'")}"]`;
      }
      return match;
    }
  );

  // Fix stadium nodes: ID([text]) — quote the inner text  
  cleaned = cleaned.replace(
    /(\w+)\(\[([^\]]+)\]\)/g,
    (match, id, label) => {
      if (specialCharsPattern.test(label)) {
        return `${id}(["${label.replace(/"/g, "'")}"])`;
      }
      return match;
    }
  );

  // Fix sequence diagram participant labels
  cleaned = cleaned.replace(
    /^(\s*participant\s+\w+\s+as\s+)(.+)$/gm,
    (match, prefix, label) => {
      label = label.trim();
      if (label.startsWith('"') && label.endsWith('"')) {
        // Quoted: strip inner parens only
        const inner = label.slice(1, -1).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
        return `${prefix}${inner}`;
      }
      // Unquoted: strip parens, replace slashes with hyphens
      const stripped = label
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\//g, ' - ')
        .replace(/"/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      return `${prefix}${stripped}`;
    }
  );

  // Fix sequence diagram messages: replace special chars that break parser
  cleaned = cleaned.replace(
    /^(\s*\w+[-]+>>?\w+:\s*)(.+)$/gm,
    (match, prefix, msg) => {
      let fixed = msg.replace(/"/g, "'");
      // Strip curly brace content {id} and parenthetical hints (param1, param2)
      if (/[{}()]/.test(fixed)) {
        fixed = fixed.replace(/\{([^}]*)\}/g, '$1').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
      }
      return `${prefix}${fixed}`;
    }
  );

  return cleaned;
};

// More aggressive sanitization for retry attempts
const aggressiveSanitize = (code) => {
  let cleaned = sanitizeMermaidCode(code);
  
  // Convert ALL cylinders to rectangles (avoid [()] issues entirely)
  cleaned = cleaned.replace(
    /(\w+)\[\(([^)]*)\)\]/g,
    (match, id, label) => `${id}["${label.replace(/"/g, "'")}"]`
  );
  
  // Quote ALL node labels in flowcharts
  cleaned = cleaned.replace(
    /(\w+)\[([^\]"]+)\]/g,
    (match, id, label) => `${id}["${label.replace(/"/g, "'")}"]`
  );
  
  // Simplify all participant names in sequence diagrams
  cleaned = cleaned.replace(
    /^(\s*participant\s+\w+\s+as\s+)(.+)$/gm,
    (match, prefix, label) => {
      label = label.trim().replace(/["']/g, '').replace(/\([^)]*\)/g, '').replace(/[\/\\:;]/g, ' ').replace(/\s+/g, ' ').trim();
      return `${prefix}${label}`;
    }
  );

  // Remove ALL double quotes from sequence messages
  cleaned = cleaned.replace(
    /^(\s*\w+[-]+>>?\w+:\s*)(.+)$/gm,
    (match, prefix, msg) => `${prefix}${msg.replace(/"/g, "'").replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()}`
  );

  return cleaned;
};

export const MermaidDiagram = ({ code, className }) => {
  const [error, setError] = useState(null);
  const [svgHtml, setSvgHtml] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);
  const lastCodeRef = useRef('');
  const timerRef = useRef(null);
  const attemptRef = useRef(0);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const doRender = useCallback(async (codeToRender) => {
    if (!codeToRender?.trim()) return;

    setRendering(true);
    try {
      const mermaid = await initMermaid(isDark);

      // Try normal sanitization first, then aggressive if it fails
      const attempts = [
        sanitizeMermaidCode(codeToRender),
        aggressiveSanitize(codeToRender),
      ];

      let lastErr = null;
      for (const cleaned of attempts) {
        if (!cleaned) continue;
        try {
          renderCounter++;
          const renderId = `mmd_${renderCounter}_${Date.now()}`;
          const stale = document.getElementById(renderId);
          if (stale) stale.remove();

          const { svg } = await mermaid.render(renderId, cleaned);
          setSvgHtml(svg);
          setError(null);
          return; // Success — exit
        } catch (err) {
          lastErr = err;
        }
      }

      // Both attempts failed
      const msg = lastErr?.message || 'Render failed';
      if (!svgHtml) {
        setError(msg);
      }
    } catch (err) {
      if (!svgHtml) setError(err?.message || 'Failed to load mermaid');
    } finally {
      setRendering(false);
    }
  }, [isDark, svgHtml]);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = code?.trim() || '';
    if (!trimmed) return;

    // If code changed, clear error to allow retry
    if (trimmed !== lastCodeRef.current) {
      lastCodeRef.current = trimmed;
      attemptRef.current++;

      // Debounce: wait for code to stabilize (longer = more streaming-friendly)
      timerRef.current = setTimeout(() => {
        doRender(trimmed);
      }, 600);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [code, doRender]);

  const handleRetry = () => {
    setError(null);
    setSvgHtml('');
    doRender(code);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'diagram.svg';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Error state — show code with retry button (not scary red)
  if (error && !svgHtml) {
    return (
      <div className={cn("my-4 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden", className)}>
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50/60 dark:bg-amber-900/15 border-b border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Diagram rendering issue</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRetry} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors" data-testid="mermaid-retry-btn">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button onClick={handleCopyCode} className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors" title="Copy source">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          </div>
        </div>
        <pre className="p-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed">{sanitizeMermaidCode(code)}</pre>
      </div>
    );
  }

  // Loading state
  if (!svgHtml && !error) {
    return (
      <div className={cn("my-4 flex items-center justify-center py-10 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/10", className)}>
        <div className="flex items-center gap-2.5 text-sm text-violet-400 dark:text-violet-500">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          Rendering diagram...
        </div>
      </div>
    );
  }

  // Success state — rendered SVG
  return (
    <div className={cn("my-4 rounded-xl border border-violet-200/60 dark:border-violet-800/30 bg-white dark:bg-slate-900 overflow-hidden shadow-sm", className)} data-testid="mermaid-diagram">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 border-b border-violet-200/60 dark:border-violet-800/30">
        <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-widest">Diagram</span>
        <div className="flex items-center gap-0.5">
          <button onClick={handleCopyCode} className="p-1.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors" title="Copy source">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
          </button>
          <button onClick={handleDownloadSvg} className="p-1.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors" title="Download SVG">
            <Download className="w-3.5 h-3.5 text-violet-400" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors" title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5 text-violet-400" /> : <Maximize2 className="w-3.5 h-3.5 text-violet-400" />}
          </button>
          <button onClick={handleRetry} className="p-1.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors" title="Re-render">
            <RefreshCw className={cn("w-3.5 h-3.5 text-violet-400", rendering && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Diagram */}
      <div
        className={cn(
          "flex items-center justify-center p-6 overflow-auto transition-all [&_svg]:max-w-full",
          expanded ? "max-h-none" : "max-h-[550px]"
        )}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
};
