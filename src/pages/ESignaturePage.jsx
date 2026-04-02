import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Upload, PenLine, Type, Calendar as CalIcon, Download,
  Trash2, ChevronLeft, ChevronRight, Loader2, Check, X, Save,
  FileText, History, Plus, GripVertical, ZoomIn, ZoomOut, RotateCcw,
  FileUp, RefreshCw, ArrowLeft, FileOutput, FileInput, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import ESignatureTermsOfService from '@/components/ESignatureTermsOfService';

// Set PDF.js worker - use unpkg CDN with exact version for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_URL = getApiUrl();

// ============ Signature Pad (Draw) ============
const SignaturePad = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasContent(false);
  };

  const save = () => {
    if (!hasContent) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef} width={460} height={160}
          className="cursor-crosshair w-full touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={clear}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear</Button>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
        <Button size="sm" onClick={save} disabled={!hasContent} className="bg-indigo-600 hover:bg-indigo-700">
          <Check className="w-3.5 h-3.5 mr-1" /> Use Signature
        </Button>
      </div>
    </div>
  );
};

// ============ Type Signature ============
const TypeSignature = ({ onSave, onClose }) => {
  const [text, setText] = useState('');
  const fonts = ['cursive', 'serif', '"Brush Script MT", cursive', '"Segoe Script", cursive'];
  const [fontIdx, setFontIdx] = useState(0);

  const save = () => {
    if (!text.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 460, 120);
    ctx.font = `40px ${fonts[fontIdx]}`;
    ctx.fillStyle = '#1e1b4b';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 20, 60);
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your name..." className="text-lg" data-testid="type-signature-input" />
      <div className="flex gap-2">
        {fonts.map((f, i) => (
          <button key={i} onClick={() => setFontIdx(i)}
            className={cn("flex-1 py-3 rounded-lg border text-lg transition-colors", i === fontIdx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-200 dark:border-slate-700')}
            style={{ fontFamily: f }}
          >
            {text || 'Preview'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
        <Button size="sm" onClick={save} disabled={!text.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          <Check className="w-3.5 h-3.5 mr-1" /> Use Signature
        </Button>
      </div>
    </div>
  );
};

// ============ Upload Signature ============
const UploadSignature = ({ onSave, onClose }) => {
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 hover:border-indigo-400 transition-colors" data-testid="upload-sig-area">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" data-testid="upload-sig-input" />
          <FileUp className="w-6 h-6 text-slate-400" />
          <span className="text-xs text-slate-500">PNG, JPG or WEBP</span>
        </label>
      ) : (
        <div className="border rounded-lg p-2 bg-white">
          <img src={preview} alt="Uploaded signature" className="max-h-20 mx-auto" />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
        <Button size="sm" onClick={() => preview && onSave(preview)} disabled={!preview} className="bg-indigo-600 hover:bg-indigo-700" data-testid="use-uploaded-sig-btn">
          <Check className="w-3.5 h-3.5 mr-1" /> Use Signature
        </Button>
      </div>
    </div>
  );
};

// ============ Word to PDF Converter ============
const WordToPdfConverter = ({ onBack, userId }) => {
  const { toast } = useToast();
  const [converting, setConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleConvert = async (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.doc', '.docx'].includes(ext)) {
      toast({ variant: 'destructive', title: 'Unsupported file', description: 'Please select a DOC or DOCX file' });
      return;
    }
    setConverting(true);
    setConvertedFile(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) formData.append('user_id', userId);
      const res = await fetch(`${API_URL}/api/esignature/convert-to-pdf`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Conversion failed');
      }
      const blob = await res.blob();
      const pdfName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
      setConvertedFile({ blob, name: pdfName, size: blob.size });
      toast({ title: 'Conversion complete', description: `${pdfName} is ready to download` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Conversion failed', description: err.message });
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedFile) return;
    const url = URL.createObjectURL(convertedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleConvert(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6" data-testid="word-to-pdf-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8" data-testid="back-to-esignature-btn">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Word to PDF converter</h1>
          <p className="text-sm text-slate-500 mt-0.5">Drag and drop a Microsoft Word document (DOCX or DOC) to convert to PDF</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-[1fr_auto] items-center">
            <div className="p-8 md:p-10 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-600 tracking-wide">Munal eSignature</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Word to PDF converter</h2>
                <p className="text-sm text-slate-500">Drag and drop a Microsoft Word document (DOCX or DOC) to convert to PDF.</p>
              </div>

              {!convertedFile ? (
                <label
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer font-medium text-sm transition-all",
                    converting
                      ? "bg-slate-200 text-slate-400 cursor-wait"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  )}
                  data-testid="word-select-file-btn"
                >
                  <input
                    type="file"
                    accept=".doc,.docx"
                    onChange={(e) => handleConvert(e.target.files?.[0])}
                    className="hidden"
                    disabled={converting}
                    data-testid="word-file-input"
                  />
                  {converting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Select a file</>
                  )}
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">{convertedFile.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{(convertedFile.size / 1024).toFixed(1)} KB — Ready to download</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700" data-testid="download-converted-pdf-btn">
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="outline" onClick={() => setConvertedFile(null)} data-testid="convert-another-btn">
                      <RefreshCw className="w-4 h-4 mr-2" /> Convert another
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative icon area */}
            <div className="hidden md:flex items-center justify-center p-8">
              <div className="w-28 h-36 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col items-center justify-center gap-2">
                <FileOutput className="w-10 h-10 text-indigo-400" />
                <span className="text-[10px] text-indigo-400 font-medium">DOC → PDF</span>
              </div>
            </div>
          </div>

          {/* Drop zone overlay */}
          {!convertedFile && !converting && (
            <div
              className={cn(
                "border-t border-dashed p-8 text-center transition-colors",
                dragOver ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400" : "border-slate-200 dark:border-slate-700"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              data-testid="word-drop-zone"
            >
              <p className="text-sm text-slate-400">
                {dragOver ? 'Drop your file here...' : 'Or drag and drop your Word document here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How to convert Word to PDF</h3>
        <p className="text-sm text-slate-500">Follow these easy steps to turn Microsoft Word files into PDFs:</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { step: 1, text: <>Click the <strong>Select a file</strong> button above, or drag and drop your Word doc into the drop zone.</> },
            { step: 2, text: 'Select the DOCX or DOC file you want to convert into the PDF format.' },
            { step: 3, text: 'Watch Munal automatically convert the file.' },
            { step: 4, text: 'Download your new PDF.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-4 py-4">
              <span className="text-2xl font-light text-slate-300 dark:text-slate-600 w-6 text-right shrink-0">{step}</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ PDF to Word Converter ============
const PdfToWordConverter = ({ onBack, userId }) => {
  const { toast } = useToast();
  const [converting, setConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleConvert = async (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (ext !== '.pdf') {
      toast({ variant: 'destructive', title: 'Unsupported file', description: 'Please select a PDF file' });
      return;
    }
    setConverting(true);
    setConvertedFile(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) formData.append('user_id', userId);
      const res = await fetch(`${API_URL}/api/esignature/convert-to-word`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Conversion failed');
      }
      const blob = await res.blob();
      const docxName = file.name.replace(/\.pdf$/i, '.docx');
      setConvertedFile({ blob, name: docxName, size: blob.size });
      toast({ title: 'Conversion complete', description: `${docxName} is ready to download` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Conversion failed', description: err.message });
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedFile) return;
    const url = URL.createObjectURL(convertedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleConvert(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6" data-testid="pdf-to-word-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8" data-testid="back-from-pdf-to-word-btn">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">PDF to Word converter</h1>
          <p className="text-sm text-slate-500 mt-0.5">Drag and drop a PDF document to convert to Word (DOCX)</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-[1fr_auto] items-center">
            <div className="p-8 md:p-10 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-600 tracking-wide">Munal eSignature</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">PDF to Word converter</h2>
                <p className="text-sm text-slate-500">Drag and drop a PDF document to convert to an editable Word file (DOCX).</p>
              </div>

              {!convertedFile ? (
                <label
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer font-medium text-sm transition-all",
                    converting
                      ? "bg-slate-200 text-slate-400 cursor-wait"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  )}
                  data-testid="pdf-select-file-btn"
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleConvert(e.target.files?.[0])}
                    className="hidden"
                    disabled={converting}
                    data-testid="pdf-file-input"
                  />
                  {converting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Select a file</>
                  )}
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">{convertedFile.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{(convertedFile.size / 1024).toFixed(1)} KB — Ready to download</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700" data-testid="download-converted-docx-btn">
                      <Download className="w-4 h-4 mr-2" /> Download Word
                    </Button>
                    <Button variant="outline" onClick={() => setConvertedFile(null)} data-testid="convert-another-pdf-btn">
                      <RefreshCw className="w-4 h-4 mr-2" /> Convert another
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative icon area */}
            <div className="hidden md:flex items-center justify-center p-8">
              <div className="w-28 h-36 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-indigo-400" />
                <span className="text-[10px] text-indigo-400 font-medium">PDF → DOCX</span>
              </div>
            </div>
          </div>

          {/* Drop zone overlay */}
          {!convertedFile && !converting && (
            <div
              className={cn(
                "border-t border-dashed p-8 text-center transition-colors",
                dragOver ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400" : "border-slate-200 dark:border-slate-700"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              data-testid="pdf-drop-zone"
            >
              <p className="text-sm text-slate-400">
                {dragOver ? 'Drop your file here...' : 'Or drag and drop your PDF document here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How to convert PDF to Word</h3>
        <p className="text-sm text-slate-500">Follow these easy steps to turn PDF files into editable Word documents:</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { step: 1, text: <>Click the <strong>Select a file</strong> button above, or drag and drop your PDF into the drop zone.</> },
            { step: 2, text: 'Select the PDF file you want to convert into the Word (DOCX) format.' },
            { step: 3, text: 'Watch Munal automatically convert the file.' },
            { step: 4, text: 'Download your new Word document.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-4 py-4">
              <span className="text-2xl font-light text-slate-300 dark:text-slate-600 w-6 text-right shrink-0">{step}</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ Main Page ============
const ESignaturePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // View mode: 'esignature' or 'wordtopdf'
  const [viewMode, setViewMode] = useState('esignature');

  // Doc state
  const [docFile, setDocFile] = useState(null);
  const [docId, setDocId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [uploading, setUploading] = useState(false);

  // Signature state
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [sigMode, setSigMode] = useState(null); // 'draw' | 'type' | null
  const [placements, setPlacements] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [savedSigs, setSavedSigs] = useState([]);
  const [conversionHistory, setConversionHistory] = useState([]);

  const pdfContainerRef = useRef(null);

  // Load history + saved signatures + conversion history
  const loadConversionHistory = useCallback(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/esignature/conversion-history?user_id=${user.id}`)
      .then(r => r.json()).then(d => setConversionHistory(d.history || [])).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/esignature/history?user_id=${user.id}`)
      .then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
    fetch(`${API_URL}/api/esignature/signatures?user_id=${user.id}`)
      .then(r => r.json()).then(d => setSavedSigs(d.signatures || [])).catch(() => {});
    loadConversionHistory();
  }, [user?.id, loadConversionHistory]);

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  // Upload PDF or DOC/DOCX (auto-converts to PDF)
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({ variant: 'destructive', title: 'Unsupported file', description: 'Please select a PDF, DOC, or DOCX file' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/esignature/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      setDocFile(file);
      setDocId(data.document.id);
      setPageCount(data.document.page_count);
      setPdfUrl(`${API_URL}/api/esignature/documents/${data.document.id}/pdf`);
      setCurrentPage(1);
      setPlacements([]);
      setSignedUrl(null);
      const converted = data.document.converted ? ' (converted to PDF)' : '';
      toast({ title: 'Document ready', description: `${file.name}${converted} — ${data.document.page_count} pages` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Signature created
  const handleSignatureReady = (dataUrl) => {
    setSignatureDataUrl(dataUrl);
    setSigMode(null);
    toast({ title: 'Signature ready', description: 'Click on the PDF to place your signature.' });
  };

  // Save signature for reuse
  const handleSaveSignature = async () => {
    if (!signatureDataUrl || !user?.id) return;
    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('name', `Signature ${savedSigs.length + 1}`);
    formData.append('sig_type', 'draw');
    formData.append('data_url', signatureDataUrl);
    const res = await fetch(`${API_URL}/api/esignature/signatures`, { method: 'POST', body: formData });
    if (res.ok) {
      const d = await res.json();
      setSavedSigs(prev => [d.signature, ...prev]);
      toast({ title: 'Signature saved for reuse' });
    }
  };

  // Click on PDF to place signature
  const handlePdfClick = (e) => {
    if (!signatureDataUrl || !pdfContainerRef.current) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const w = 0.25;
    const h = 0.06;

    setPlacements(prev => [...prev, {
      id: Date.now().toString(),
      page: currentPage - 1,
      x: Math.max(0, Math.min(x - w / 2, 1 - w)),
      y: Math.max(0, Math.min(y - h / 2, 1 - h)),
      width: w,
      height: h,
      type: 'signature',
    }]);
  };

  // Add date field
  const addDateField = () => {
    setPlacements(prev => [...prev, {
      id: Date.now().toString(),
      page: currentPage - 1,
      x: 0.6, y: 0.85,
      width: 0.2, height: 0.03,
      type: 'date',
    }]);
  };

  // Remove placement
  const removePlacement = (id) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
  };

  // Drag placement
  const handlePlacementMouseDown = (e, id) => {
    e.stopPropagation();
    setDragging({ id, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !pdfContainerRef.current) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragging.startX) / rect.width;
    const dy = (e.clientY - dragging.startY) / rect.height;
    setPlacements(prev => prev.map(p =>
      p.id === dragging.id ? { ...p, x: Math.max(0, Math.min(p.x + dx, 1 - p.width)), y: Math.max(0, Math.min(p.y + dy, 1 - p.height)) } : p
    ));
    setDragging(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Apply signatures
  const handleSign = async () => {
    if (!docId || !signatureDataUrl || placements.length === 0) return;
    setSigning(true);
    try {
      const formData = new FormData();
      formData.append('doc_id', docId);
      formData.append('user_id', user.id);
      formData.append('user_name', user.name || '');
      formData.append('user_email', user.email || '');
      formData.append('signature_data_url', signatureDataUrl);
      formData.append('placements', JSON.stringify(placements));

      const res = await fetch(`${API_URL}/api/esignature/sign`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signing failed');

      setSignedUrl(`${API_URL}/api/esignature/documents/${docId}/signed`);
      toast({ title: 'Document signed!', description: 'Your signed PDF is ready to download and has been saved to File Manager.' });

      // Refresh history
      fetch(`${API_URL}/api/esignature/history?user_id=${user.id}`)
        .then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
    } catch (err) {
      toast({ variant: 'destructive', title: 'Signing failed', description: err.message });
    } finally {
      setSigning(false);
    }
  };

  // Download signed
  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement('a');
    a.href = signedUrl;
    a.download = docFile?.name?.replace('.pdf', '_signed.pdf') || 'signed.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Reset
  const reset = () => {
    setDocFile(null);
    setDocId(null);
    setPdfUrl(null);
    setPageCount(0);
    setCurrentPage(1);
    setPlacements([]);
    setSignatureDataUrl(null);
    setSigMode(null);
    setSignedUrl(null);
  };

  const currentPagePlacements = placements.filter(p => p.page === currentPage - 1);

  return (
    <PageTransition>
      {viewMode === 'wordtopdf' ? (
        <WordToPdfConverter onBack={() => { setViewMode('esignature'); loadConversionHistory(); }} userId={user?.id} />
      ) : viewMode === 'pdftoword' ? (
        <PdfToWordConverter onBack={() => { setViewMode('esignature'); loadConversionHistory(); }} userId={user?.id} />
      ) : (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="esignature-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">eSignature</h1>
            <p className="text-sm text-slate-500 mt-1">Upload, sign, and download PDF documents</p>
          </div>
          <div className="flex items-center gap-2">
            <ESignatureTermsOfService />
            <Button variant="outline" size="sm" onClick={() => navigate('/pdf-editor')} className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40" data-testid="pdf-editor-btn">
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> PDF Editor
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('wordtopdf')} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" data-testid="word-to-pdf-btn">
              <FileOutput className="w-3.5 h-3.5 mr-1.5" /> Word to PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('pdftoword')} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" data-testid="pdf-to-word-btn">
              <FileInput className="w-3.5 h-3.5 mr-1.5" /> PDF to Word
            </Button>
            {docId && (
              <Button variant="outline" size="sm" onClick={reset} data-testid="reset-btn">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Document
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="sign" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sign"><PenLine className="w-3.5 h-3.5 mr-1.5" /> Sign</TabsTrigger>
            <TabsTrigger value="history"><History className="w-3.5 h-3.5 mr-1.5" /> History</TabsTrigger>
            <TabsTrigger value="saved"><Save className="w-3.5 h-3.5 mr-1.5" /> Saved Signatures</TabsTrigger>
            <TabsTrigger value="conversions" data-testid="conversions-tab"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Conversions</TabsTrigger>
          </TabsList>

          {/* ====== SIGN TAB ====== */}
          <TabsContent value="sign" className="space-y-4">
            {!pdfUrl ? (
              /* Upload Area */
              <Card>
                <CardContent className="p-8">
                  <label className="flex flex-col items-center gap-4 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 hover:border-indigo-400 transition-colors" data-testid="pdf-upload-area">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" data-testid="pdf-upload-input" />
                    {uploading ? (
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    ) : (
                      <Upload className="w-10 h-10 text-slate-400" />
                    )}
                    <div className="text-center">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{uploading ? 'Processing...' : 'Click to upload a document'}</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX files up to 20MB</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">PDF</Badge>
                        <Badge variant="outline" className="text-[10px]">DOC</Badge>
                        <Badge variant="outline" className="text-[10px]">DOCX</Badge>
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Auto-converts to PDF</span>
                      </div>
                    </div>
                  </label>
                </CardContent>
              </Card>
            ) : (
              /* PDF Viewer + Signing */
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                {/* PDF Viewer */}
                <Card className="overflow-hidden">
                  <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{docFile?.name}</span>
                      <Badge variant="outline" className="text-xs">{pageCount} pages</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="w-3.5 h-3.5" /></Button>
                      <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(2, s + 0.1))}><ZoomIn className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 bg-slate-100 dark:bg-slate-800 overflow-auto" style={{ maxHeight: '65vh' }}>
                    <div
                      ref={pdfContainerRef}
                      className="relative mx-auto"
                      style={{ width: 'fit-content', cursor: signatureDataUrl ? 'crosshair' : 'default' }}
                      onClick={handlePdfClick}
                    >
                      <Document file={pdfUrl} loading={<div className="flex items-center justify-center p-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
                        <Page pageNumber={currentPage} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>

                      {/* Signature placements overlay */}
                      {currentPagePlacements.map(p => (
                        <div
                          key={p.id}
                          className="absolute border-2 border-indigo-500 bg-indigo-50/40 rounded cursor-move group"
                          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.width * 100}%`, height: `${p.height * 100}%` }}
                          onMouseDown={(e) => handlePlacementMouseDown(e, p.id)}
                        >
                          {p.type === 'signature' && signatureDataUrl && (
                            <img src={signatureDataUrl} alt="sig" className="w-full h-full object-contain pointer-events-none" />
                          )}
                          {p.type === 'date' && (
                            <span className="text-[10px] text-indigo-700 flex items-center gap-1 px-1"><CalIcon className="w-3 h-3" />{new Date().toISOString().slice(0, 10)}</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removePlacement(p.id); }}
                            className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <GripVertical className="absolute top-0.5 left-0.5 w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  {/* Page navigation */}
                  <div className="flex items-center justify-center gap-3 p-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-600">Page {currentPage} of {pageCount}</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Right Panel — Signature Tools */}
                <div className="space-y-4">
                  {/* Signature creation */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Create Signature</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {!sigMode && !signatureDataUrl && (
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSigMode('draw')} className="h-16 flex-col gap-1" data-testid="draw-sig-btn">
                            <PenLine className="w-5 h-5" /> Draw
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSigMode('type')} className="h-16 flex-col gap-1" data-testid="type-sig-btn">
                            <Type className="w-5 h-5" /> Type
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSigMode('upload')} className="h-16 flex-col gap-1" data-testid="upload-sig-btn">
                            <FileUp className="w-5 h-5" /> Upload
                          </Button>
                        </div>
                      )}
                      {sigMode === 'draw' && <SignaturePad onSave={handleSignatureReady} onClose={() => setSigMode(null)} />}
                      {sigMode === 'type' && <TypeSignature onSave={handleSignatureReady} onClose={() => setSigMode(null)} />}
                      {sigMode === 'upload' && <UploadSignature onSave={handleSignatureReady} onClose={() => setSigMode(null)} />}
                      {signatureDataUrl && !sigMode && (
                        <div className="space-y-2">
                          <div className="border rounded-lg p-2 bg-white">
                            <img src={signatureDataUrl} alt="Your signature" className="max-h-16 mx-auto" />
                          </div>
                          <p className="text-xs text-slate-500 text-center">Click on the PDF to place your signature</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => { setSignatureDataUrl(null); setPlacements([]); }}>
                              <RotateCcw className="w-3 h-3 mr-1" /> Change
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={handleSaveSignature} data-testid="save-sig-btn">
                              <Save className="w-3 h-3 mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      )}
                      {/* Use saved signature */}
                      {!signatureDataUrl && savedSigs.length > 0 && !sigMode && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-slate-500 mb-2">Or use a saved signature:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {savedSigs.map(s => (
                              <button key={s.id} onClick={() => handleSignatureReady(s.data_url)}
                                className="w-full border rounded p-1.5 hover:border-indigo-400 transition-colors bg-white"
                              >
                                <img src={s.data_url} alt={s.name} className="max-h-8 mx-auto" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Fields */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Add Fields</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <Button variant="outline" size="sm" className="w-full" onClick={addDateField} data-testid="add-date-field-btn">
                        <CalIcon className="w-3.5 h-3.5 mr-1.5" /> Add Date Field
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Placements summary */}
                  {placements.length > 0 && (
                    <Card>
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm">Placements ({placements.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-1.5 max-h-40 overflow-y-auto">
                        {placements.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded px-2 py-1.5">
                            <span className="capitalize">{p.type} — Page {p.page + 1}</span>
                            <button onClick={() => removePlacement(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Sign & Download */}
                  <div className="space-y-2">
                    {!signedUrl ? (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg"
                        disabled={signing || placements.length === 0 || !signatureDataUrl}
                        onClick={handleSign}
                        data-testid="apply-signature-btn"
                      >
                        {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenLine className="w-4 h-4 mr-2" />}
                        {signing ? 'Signing...' : 'Apply Signature'}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                          <Check className="w-4 h-4" /> Document signed successfully!
                        </div>
                        <Button className="w-full" onClick={handleDownload} data-testid="download-signed-btn">
                          <Download className="w-4 h-4 mr-2" /> Download Signed PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ====== HISTORY TAB ====== */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Signing History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No documents signed yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-indigo-500" />
                          <div>
                            <p className="text-sm font-medium">{h.signed_filename || h.filename}</p>
                            <p className="text-xs text-slate-500">{h.page_count} pages &bull; {h.placements_count} signatures &bull; {new Date(h.signed_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            const a = document.createElement('a');
                            a.href = `${API_URL}/api/esignature/documents/${h.doc_id}/signed`;
                            a.download = h.signed_filename;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }} data-testid={`download-history-${h.id}`}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={async () => {
                            if (!confirm('Delete this history entry?')) return;
                            try {
                              const res = await fetch(`${API_URL}/api/esignature/history/${h.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                setHistory(prev => prev.filter(x => x.id !== h.id));
                                toast({ title: 'History entry deleted' });
                              }
                            } catch { toast({ variant: 'destructive', title: 'Delete failed' }); }
                          }} data-testid={`delete-history-${h.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== SAVED SIGNATURES TAB ====== */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Saved Signatures</CardTitle>
              </CardHeader>
              <CardContent>
                {savedSigs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <PenLine className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No saved signatures</p>
                    <p className="text-xs mt-1">Create and save a signature while signing a document</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {savedSigs.map(s => (
                      <div key={s.id} className="border rounded-lg p-3 group relative">
                        <img src={s.data_url} alt={s.name} className="max-h-12 mx-auto" />
                        <p className="text-xs text-center text-slate-500 mt-2">{s.name}</p>
                        <p className="text-[10px] text-center text-slate-400">{new Date(s.created_at).toLocaleDateString()}</p>
                        <button
                          onClick={async () => {
                            await fetch(`${API_URL}/api/esignature/signatures/${s.id}`, { method: 'DELETE' });
                            setSavedSigs(prev => prev.filter(x => x.id !== s.id));
                            toast({ title: 'Signature deleted' });
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                          data-testid={`delete-sig-${s.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== CONVERSIONS TAB ====== */}
          <TabsContent value="conversions">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversion History</CardTitle>
              </CardHeader>
              <CardContent>
                {conversionHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No conversions yet</p>
                    <p className="text-xs mt-1">Use Word to PDF or PDF to Word to see your history here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversionHistory.map(c => (
                      <div key={c.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" data-testid={`conversion-entry-${c.id}`}>
                        <div className="flex items-center gap-3">
                          {c.conversion_type === 'word-to-pdf' ? (
                            <FileOutput className="w-8 h-8 text-indigo-500 shrink-0" />
                          ) : (
                            <FileInput className="w-8 h-8 text-indigo-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.original_filename}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Badge variant="outline" className="text-[10px]">
                                {c.conversion_type === 'word-to-pdf' ? 'DOC → PDF' : 'PDF → DOCX'}
                              </Badge>
                              <span>{(c.converted_size / 1024).toFixed(1)} KB</span>
                              <span>&bull;</span>
                              <span>{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" title="Download" data-testid={`download-conversion-${c.id}`} onClick={() => {
                            const a = document.createElement('a');
                            a.href = `${API_URL}/api/esignature/conversion-history/${c.id}/download`;
                            a.download = c.converted_filename;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" data-testid={`delete-conversion-${c.id}`} onClick={async () => {
                            await fetch(`${API_URL}/api/esignature/conversion-history/${c.id}`, { method: 'DELETE' });
                            setConversionHistory(prev => prev.filter(x => x.id !== c.id));
                            toast({ title: 'Conversion deleted' });
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}
    </PageTransition>
  );
};

export default ESignaturePage;
