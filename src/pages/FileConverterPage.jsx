import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileUp, Download, Loader2, ArrowRight, FileText, Image, X, CheckCircle2, BookOpen, Trash2, Plus, Layers, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const MERGE_TYPES = new Set(['jpg-to-pdf', 'png-to-pdf', 'image-to-pdf']);

const CATEGORIES = [
  {
    name: 'Convert from PDF',
    icon: FileText,
    color: 'from-red-500 to-rose-500',
    items: [
      { id: 'pdf-to-jpg', from: 'PDF', to: 'JPG', accept: '.pdf' },
      { id: 'pdf-to-png', from: 'PDF', to: 'PNG', accept: '.pdf' },
      { id: 'pdf-to-word', from: 'PDF', to: 'DOCX', accept: '.pdf' },
    ],
  },
  {
    name: 'Convert to PDF',
    icon: FileText,
    color: 'from-blue-500 to-indigo-500',
    items: [
      { id: 'word-to-pdf', from: 'DOCX', to: 'PDF', accept: '.docx' },
      { id: 'excel-to-pdf', from: 'XLSX', to: 'PDF', accept: '.xlsx,.xls' },
      { id: 'pptx-to-pdf', from: 'PPTX', to: 'PDF', accept: '.pptx' },
      { id: 'jpg-to-pdf', from: 'JPG', to: 'PDF', accept: '.jpg,.jpeg' },
      { id: 'png-to-pdf', from: 'PNG', to: 'PDF', accept: '.png' },
    ],
  },
  {
    name: 'Image Converter',
    icon: Image,
    color: 'from-emerald-500 to-teal-500',
    items: [
      { id: 'png-to-jpg', from: 'PNG', to: 'JPG', accept: '.png' },
      { id: 'jpg-to-png', from: 'JPG', to: 'PNG', accept: '.jpg,.jpeg' },
    ],
  },
  {
    name: 'eBook',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    items: [
      { id: 'epub-to-mobi', from: 'EPUB', to: 'MOBI', accept: '.epub' },
      { id: 'mobi-to-epub', from: 'MOBI', to: 'EPUB', accept: '.mobi' },
      { id: 'epub-to-pdf', from: 'EPUB', to: 'PDF', accept: '.epub' },
    ],
  },
];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const _timeAgo = (date) => {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
};

const FileConverterPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const token = (() => {
    try {
      const s = localStorage.getItem('munal_sessions');
      return s ? JSON.parse(s).token : '';
    } catch { return ''; }
  })();

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/converter/history?limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, [token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRedownload = async (id, name) => {
    try {
      const res = await fetch(`${API_URL}/api/converter/history/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('File no longer available');
      const blob = await res.blob();
      triggerDownload(blob, name);
    } catch (err) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await fetch(`${API_URL}/api/converter/history/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setHistory(prev => prev.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  const isBatch = files.length > 1;
  const isMerge = selected && MERGE_TYPES.has(selected.id);

  const handleSelect = (item) => {
    setSelected(item);
    setFiles([]);
    setDone(false);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    const totalSize = [...files, ...newFiles].reduce((s, f) => s + f.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Total batch size cannot exceed 100MB', variant: 'destructive' });
      return;
    }
    if (files.length + newFiles.length > 50) {
      toast({ title: 'Too many files', description: 'Maximum 50 files per batch', variant: 'destructive' });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    setDone(false);
    // Reset input so same file can be re-added
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setDone(false);
  };

  const handleConvert = async () => {
    if (!files.length || !selected) return;
    setConverting(true);
    setDone(false);

    try {
      if (files.length === 1) {
        // Single file — use original endpoint
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('conversion_type', selected.id);

        const res = await fetch(`${API_URL}/api/converter/convert`, {
          method: 'POST', body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Conversion failed');
        }

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?(.+?)"?$/);
        triggerDownload(blob, match ? match[1] : `converted.${selected.to.toLowerCase()}`);
      } else {
        // Batch — use batch endpoint
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('conversion_type', selected.id);

        const res = await fetch(`${API_URL}/api/converter/batch-convert`, {
          method: 'POST', body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Batch conversion failed');
        }

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?(.+?)"?$/);
        const defaultName = isMerge ? 'combined.pdf' : 'batch_converted.zip';
        triggerDownload(blob, match ? match[1] : defaultName);
      }

      setDone(true);
      fetchHistory(); // Refresh history
      const msg = isBatch
        ? isMerge
          ? `${files.length} images merged into one PDF`
          : `${files.length} files converted and zipped`
        : `Your file has been converted to ${selected.to}`;
      toast({ title: 'Conversion complete', description: msg });
    } catch (err) {
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' });
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setFiles([]);
    setDone(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!selected) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    const acceptExts = selected.accept.split(',').map(a => a.trim().toLowerCase());
    const valid = droppedFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return acceptExts.some(a => a === ext || (a === '.jpg' && ext === '.jpeg') || (a === '.jpeg' && ext === '.jpg'));
    });
    if (!valid.length) {
      toast({ title: 'Invalid files', description: `Only ${selected.from} files are accepted`, variant: 'destructive' });
      return;
    }
    const totalSize = [...files, ...valid].reduce((s, f) => s + f.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Total batch size cannot exceed 100MB', variant: 'destructive' });
      return;
    }
    setFiles(prev => [...prev, ...valid].slice(0, 50));
    setDone(false);
  }, [selected, files, toast]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);

  // Active conversion view
  if (selected) {
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    return (
      <div data-testid="converter-active" className="max-w-xl mx-auto px-1 sm:px-0">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
          data-testid="converter-back-btn"
        >
          <X className="w-3.5 h-3.5" /> Back to all conversions
        </button>

        <div className="glass-panel rounded-2xl p-4 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-200">{selected.from}</span>
            <ArrowRight className="w-5 h-5 text-violet-500" />
            <span className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-sm font-semibold text-violet-700 dark:text-violet-300">{selected.to}</span>
            {isMerge && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Merge
              </span>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={selected.accept}
            multiple
            onChange={handleFileChange}
            className="hidden"
            data-testid="converter-file-input"
          />

          {/* Dropzone */}
          {files.length === 0 ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-10 cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors group text-center"
              data-testid="converter-dropzone"
            >
              <FileUp className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Drop <strong>{selected.from}</strong> files here or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Select multiple files for batch conversion &middot; Max 50 files, 100MB total
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File list */}
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1" data-testid="converter-file-list">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 group" data-testid={`converter-file-${i}`}>
                    <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{f.name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatSize(f.size)}</span>
                    {!converting && (
                      <button
                        onClick={() => removeFile(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        data-testid={`converter-remove-${i}`}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary bar */}
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
                <span data-testid="converter-file-count">{files.length} file{files.length > 1 ? 's' : ''} &middot; {formatSize(totalSize)}</span>
                {!converting && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 text-violet-500 hover:text-violet-600 transition-colors"
                    data-testid="converter-add-more-btn"
                  >
                    <Plus className="w-3 h-3" /> Add more
                  </button>
                )}
              </div>

              {/* Batch info */}
              {isBatch && (
                <div className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {isMerge
                      ? 'All images will be merged into a single PDF document.'
                      : 'Each file will be converted individually. You\'ll get a ZIP file.'}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-center pt-1">
                <Button variant="outline" size="sm" onClick={() => { setFiles([]); setDone(false); }}>
                  Clear all
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleConvert}
                  disabled={converting}
                  data-testid="converter-convert-btn"
                >
                  {converting ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Converting {files.length} file{files.length > 1 ? 's' : ''}...</>
                  ) : done ? (
                    <><Download className="w-4 h-4 mr-1.5" /> Download Again</>
                  ) : (
                    <><ArrowRight className="w-4 h-4 mr-1.5" /> Convert{isBatch ? ` ${files.length} Files` : ''} & Download</>
                  )}
                </Button>
              </div>

              {done && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="converter-done">
                  <CheckCircle2 className="w-4 h-4" />
                  {isBatch ? (isMerge ? 'Files merged successfully' : 'Batch conversion complete') : 'Conversion complete'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Category grid view
  return (
    <div data-testid="converter-grid" className="space-y-8">
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center", cat.color)}>
              <cat.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.name}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {cat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="group flex items-center gap-2 px-3 py-3 sm:py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-800/60 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm transition-all text-left min-h-[44px]"
                data-testid={`converter-${item.id}`}
              >
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {item.from} <span className="text-gray-300 dark:text-gray-600 mx-0.5">&rarr;</span> {item.to}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Conversion History */}
      {history.length > 0 && (
        <div data-testid="converter-history">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Conversions</h3>
            </div>
            <button onClick={fetchHistory} className="text-xs text-gray-400 hover:text-violet-500 transition-colors flex items-center gap-1" data-testid="converter-history-refresh">
              <RefreshCw className={cn("w-3 h-3", historyLoading && "animate-spin")} /> Refresh
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((record) => {
              const fromTo = record.conversion_type.replace('-to-', ' → ').toUpperCase();
              const date = new Date(record.created_at);
              const timeAgo = _timeAgo(date);
              return (
                <div key={record.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-800/60 group" data-testid={`history-${record.id}`}>
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{record.original_name}</p>
                    <p className="text-[10px] text-gray-400">
                      {fromTo} &middot; {formatSize(record.output_size)} &middot; {record.file_count > 1 ? `${record.file_count} files &middot; ` : ''}{timeAgo}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {record.downloadable && (
                      <button
                        onClick={() => handleRedownload(record.id, record.output_name)}
                        className="p-2 sm:p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                        title="Re-download"
                        data-testid={`history-download-${record.id}`}
                      >
                        <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-violet-500" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteHistory(record.id)}
                      className="p-2 sm:p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                      data-testid={`history-delete-${record.id}`}
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileConverterPage;
