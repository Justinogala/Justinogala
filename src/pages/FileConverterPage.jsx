import React, { useState, useRef } from 'react';
import { FileUp, Download, Loader2, ArrowRight, FileText, Image, Table, Presentation, X, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

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

const FileConverterPage = () => {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSelect = (item) => {
    setSelected(item);
    setFile(null);
    setDone(false);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 50 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 50MB', variant: 'destructive' });
        return;
      }
      setFile(f);
      setDone(false);
    }
  };

  const handleConvert = async () => {
    if (!file || !selected) return;
    setConverting(true);
    setDone(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversion_type', selected.id);

      const res = await fetch(`${API_URL}/api/converter/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Conversion failed');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch ? filenameMatch[1] : `converted_${selected.to.toLowerCase()}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      toast({ title: 'Conversion complete', description: `Your file has been converted to ${selected.to}` });
    } catch (err) {
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' });
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setFile(null);
    setDone(false);
  };

  // Active conversion view
  if (selected) {
    return (
      <div data-testid="converter-active" className="max-w-lg mx-auto">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
          data-testid="converter-back-btn"
        >
          <X className="w-3.5 h-3.5" /> Back to all conversions
        </button>

        <div className="glass-panel rounded-2xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-200">{selected.from}</span>
            <ArrowRight className="w-5 h-5 text-violet-500" />
            <span className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-sm font-semibold text-violet-700 dark:text-violet-300">{selected.to}</span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={selected.accept}
            onChange={handleFileChange}
            className="hidden"
            data-testid="converter-file-input"
          />

          {!file ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors group"
              data-testid="converter-dropzone"
            >
              <FileUp className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Click to select a <strong>{selected.from}</strong> file
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 50MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3" data-testid="converter-file-info">
                <FileText className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                {done && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setDone(false); }}>
                  Change file
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleConvert}
                  disabled={converting}
                  data-testid="converter-convert-btn"
                >
                  {converting ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Converting...</>
                  ) : done ? (
                    <><Download className="w-4 h-4 mr-1.5" /> Download Again</>
                  ) : (
                    <><ArrowRight className="w-4 h-4 mr-1.5" /> Convert & Download</>
                  )}
                </Button>
              </div>
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
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-800/60 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm transition-all text-left"
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
    </div>
  );
};

export default FileConverterPage;
