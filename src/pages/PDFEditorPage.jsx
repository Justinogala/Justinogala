import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Upload, Type, PenLine, Highlighter, StickyNote, Download, Save,
  Trash2, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut,
  RotateCcw, ArrowLeft, FileText, Plus, X, Square, Undo2, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';
import { getApiUrl } from '@/lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_URL = getApiUrl();

const TOOLS = [
  { id: 'select', icon: Square, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'draw', icon: PenLine, label: 'Draw' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'note', icon: StickyNote, label: 'Note' },
  { id: 'signature', icon: Camera, label: 'Signature' },
];

const COLORS = ['#1e1b4b', '#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];

// ── Signature Mini-Pad ──
const MiniSignaturePad = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  return (
    <div className="absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl p-4 w-80" data-testid="signature-pad-modal">
      <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Draw Signature</p>
      <canvas
        ref={canvasRef} width={280} height={100}
        className="border border-gray-300 dark:border-slate-600 rounded-lg bg-white cursor-crosshair"
        onMouseDown={(e) => { setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }}
        onMouseMove={(e) => { if (!drawing) return; const ctx = canvasRef.current.getContext('2d'); const p = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e1b4b'; ctx.lineTo(p.x, p.y); ctx.stroke(); }}
        onMouseUp={() => setDrawing(false)}
        onMouseLeave={() => setDrawing(false)}
        data-testid="signature-canvas"
      />
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="outline" onClick={() => { canvasRef.current.getContext('2d').clearRect(0, 0, 280, 100); }}>Clear</Button>
        <Button size="sm" onClick={() => { onSave(canvasRef.current.toDataURL('image/png')); onClose(); }} data-testid="signature-save-btn">Use</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
};

// ── Main PDF Editor Page ──
const PDFEditorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || user?.user_id || '';

  // Document state
  const [docId, setDocId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Annotations
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#1e1b4b');
  const [showSigPad, setShowSigPad] = useState(false);
  const [sigPadPos, setSigPadPos] = useState({ x: 0, y: 0 });

  // Drawing state
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null);

  // Saved docs list
  const [savedDocs, setSavedDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fileInputRef = useRef(null);

  // Load saved docs
  const loadDocs = useCallback(async () => {
    if (!userId) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_URL}/api/pdf-editor/documents?user_id=${userId}`);
      if (res.ok) { const d = await res.json(); setSavedDocs(d.documents || []); }
    } catch { /* silent */ }
    finally { setLoadingDocs(false); }
  }, [userId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // Upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({ variant: 'destructive', title: 'Only PDF files are supported' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      const res = await fetch(`${API_URL}/api/pdf-editor/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      const data = await res.json();
      setDocId(data.document.id);
      setPdfUrl(`${API_URL}/api/pdf-editor/documents/${data.document.id}/pdf`);
      setAnnotations([]);
      setCurrentPage(1);
      // Also read raw bytes for pdf-lib editing
      const reader = new FileReader();
      reader.onload = () => setPdfBytes(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(file);
      toast({ title: 'PDF Loaded', description: data.document.filename });
      loadDocs();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Open saved doc
  const openDoc = async (doc) => {
    setDocId(doc.id);
    setPdfUrl(`${API_URL}/api/pdf-editor/documents/${doc.id}/pdf`);
    setAnnotations(doc.annotations || []);
    setCurrentPage(1);
    // Fetch raw bytes
    try {
      const res = await fetch(`${API_URL}/api/pdf-editor/documents/${doc.id}/pdf`);
      if (res.ok) { const buf = await res.arrayBuffer(); setPdfBytes(new Uint8Array(buf)); }
    } catch { /* silent */ }
  };

  // Delete doc
  const deleteDoc = async (id) => {
    try {
      await fetch(`${API_URL}/api/pdf-editor/documents/${id}`, { method: 'DELETE' });
      if (docId === id) { setDocId(null); setPdfUrl(null); setPdfBytes(null); setAnnotations([]); }
      loadDocs();
      toast({ title: 'Document deleted' });
    } catch { toast({ variant: 'destructive', title: 'Delete failed' }); }
  };

  // Canvas click handler for annotation tools
  const handleCanvasClick = (e) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width * zoom);
    const y = (e.clientY - rect.top) / (rect.height * zoom);

    if (activeTool === 'text') {
      setTextPos({ x, y, page: currentPage });
    } else if (activeTool === 'note') {
      const note = prompt('Enter note text:');
      if (note) {
        setAnnotations(prev => [...prev, { type: 'note', x, y, page: currentPage, text: note, color: activeColor, id: Date.now() }]);
      }
    } else if (activeTool === 'highlight') {
      setAnnotations(prev => [...prev, { type: 'highlight', x, y, page: currentPage, width: 0.2, height: 0.025, color: activeColor, id: Date.now() }]);
    } else if (activeTool === 'signature') {
      setSigPadPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowSigPad(true);
    }
  };

  // Drawing handlers
  const handleDrawStart = (e) => {
    if (activeTool !== 'draw') return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width * zoom);
    const y = (e.clientY - rect.top) / (rect.height * zoom);
    setIsDrawing(true);
    setDrawPoints([{ x, y }]);
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width * zoom);
    const y = (e.clientY - rect.top) / (rect.height * zoom);
    setDrawPoints(prev => [...prev, { x, y }]);
  };

  const handleDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (drawPoints.length > 1) {
      setAnnotations(prev => [...prev, { type: 'draw', page: currentPage, points: drawPoints, color: activeColor, id: Date.now() }]);
    }
    setDrawPoints([]);
  };

  // Add text annotation
  const addTextAnnotation = () => {
    if (!textInput.trim() || !textPos) return;
    setAnnotations(prev => [...prev, { type: 'text', x: textPos.x, y: textPos.y, page: textPos.page, text: textInput, color: activeColor, fontSize: 14, id: Date.now() }]);
    setTextInput('');
    setTextPos(null);
  };

  // Add signature
  const addSignature = (dataUrl) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = sigPadPos.x / (rect.width * zoom);
    const y = sigPadPos.y / (rect.height * zoom);
    setAnnotations(prev => [...prev, { type: 'signature', x, y, page: currentPage, dataUrl, width: 0.2, height: 0.06, id: Date.now() }]);
  };

  // Undo
  const undo = () => setAnnotations(prev => prev.slice(0, -1));

  // Remove specific annotation
  const removeAnnotation = (id) => setAnnotations(prev => prev.filter(a => a.id !== id));

  // Save annotations to server
  const saveAnnotations = async () => {
    if (!docId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pdf-editor/documents/${docId}/annotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Annotations saved' });
    } catch { toast({ variant: 'destructive', title: 'Save failed' }); }
    finally { setSaving(false); }
  };

  // Export / Download with baked-in annotations using pdf-lib
  const downloadEdited = async () => {
    if (!pdfBytes) { toast({ variant: 'destructive', title: 'No PDF loaded' }); return; }
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const ann of annotations) {
        const pageIdx = (ann.page || 1) - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { width, height } = page.getSize();

        if (ann.type === 'text') {
          const hexColor = ann.color || '#1e1b4b';
          const r = parseInt(hexColor.slice(1, 3), 16) / 255;
          const g = parseInt(hexColor.slice(3, 5), 16) / 255;
          const b = parseInt(hexColor.slice(5, 7), 16) / 255;
          page.drawText(ann.text, {
            x: ann.x * width,
            y: height - ann.y * height,
            size: ann.fontSize || 14,
            font: helvetica,
            color: rgb(r, g, b),
          });
        } else if (ann.type === 'note') {
          page.drawRectangle({
            x: ann.x * width - 2, y: height - ann.y * height - 14,
            width: Math.min(ann.text.length * 7 + 12, 200), height: 20,
            color: rgb(1, 0.95, 0.7), borderColor: rgb(0.9, 0.8, 0.4), borderWidth: 0.5,
          });
          page.drawText(ann.text, {
            x: ann.x * width + 4, y: height - ann.y * height - 10,
            size: 9, font: helvetica, color: rgb(0.3, 0.2, 0),
          });
        } else if (ann.type === 'highlight') {
          page.drawRectangle({
            x: ann.x * width, y: height - ann.y * height - (ann.height || 0.025) * height,
            width: (ann.width || 0.2) * width, height: (ann.height || 0.025) * height,
            color: rgb(1, 1, 0), opacity: 0.35,
          });
        } else if (ann.type === 'draw' && ann.points?.length > 1) {
          const hexColor = ann.color || '#1e1b4b';
          const r = parseInt(hexColor.slice(1, 3), 16) / 255;
          const g = parseInt(hexColor.slice(3, 5), 16) / 255;
          const bVal = parseInt(hexColor.slice(5, 7), 16) / 255;
          for (let i = 1; i < ann.points.length; i++) {
            const p0 = ann.points[i - 1];
            const p1 = ann.points[i];
            page.drawLine({
              start: { x: p0.x * width, y: height - p0.y * height },
              end: { x: p1.x * width, y: height - p1.y * height },
              thickness: 2, color: rgb(r, g, bVal),
            });
          }
        } else if (ann.type === 'signature' && ann.dataUrl) {
          try {
            const sigB64 = ann.dataUrl.split(',')[1];
            const sigImg = await pdfDoc.embedPng(Uint8Array.from(atob(sigB64), c => c.charCodeAt(0)));
            const sigW = (ann.width || 0.2) * width;
            const sigH = (ann.height || 0.06) * height;
            page.drawImage(sigImg, {
              x: ann.x * width, y: height - ann.y * height - sigH,
              width: sigW, height: sigH,
            });
          } catch (imgErr) {
            console.error('Signature embed error:', imgErr);
          }
        }
      }

      const editedBytes = await pdfDoc.save();
      const editedB64 = btoa(String.fromCharCode(...editedBytes));

      // Save to server
      if (docId) {
        await fetch(`${API_URL}/api/pdf-editor/documents/${docId}/save-edited`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf_base64: editedB64 }),
        });
      }

      // Also trigger download
      const blob = new Blob([editedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_document.pdf';
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'PDF saved & downloaded' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Export failed', description: err.message });
    } finally { setSaving(false); }
  };

  // Render annotations overlay for current page
  const pageAnnotations = annotations.filter(a => a.page === currentPage);

  // ── No document loaded ──
  if (!pdfUrl) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto p-6 space-y-6" data-testid="pdf-editor-empty">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/esignature')} data-testid="back-to-esignature">
              <ArrowLeft className="w-4 h-4 mr-1" /> eSignature
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <FileText className="w-6 h-6 text-violet-600" /> PDF Editor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload a PDF to add text, drawings, highlights, notes, and signatures.
            </p>
          </div>

          {/* Upload */}
          <Card className="border-dashed border-2 border-gray-300 dark:border-slate-600 hover:border-violet-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()} data-testid="pdf-upload-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              {uploading ? <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-3" /> : <Upload className="w-10 h-10 text-gray-400 mb-3" />}
              <p className="font-semibold text-gray-700 dark:text-gray-200">{uploading ? 'Uploading...' : 'Click to upload PDF'}</p>
              <p className="text-xs text-gray-400 mt-1">Max 25MB</p>
            </CardContent>
          </Card>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} data-testid="pdf-file-input" />

          {/* Saved documents */}
          {savedDocs.length > 0 && (
            <div data-testid="saved-docs-list">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedDocs.map(doc => (
                  <Card key={doc.id} className="border-border hover:shadow-md transition-shadow cursor-pointer group" data-testid={`saved-doc-${doc.id}`}>
                    <CardContent className="p-4 flex items-center gap-3" onClick={() => openDoc(doc)}>
                      <FileText className="w-8 h-8 text-violet-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-400">{doc.page_count} pages &middot; {new Date(doc.updated_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  // ── Editor view ──
  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-64px)]" data-testid="pdf-editor">
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-2 flex items-center gap-2 flex-wrap" data-testid="pdf-editor-toolbar">
          <Button variant="ghost" size="sm" onClick={() => { setPdfUrl(null); setDocId(null); setPdfBytes(null); setAnnotations([]); }} data-testid="close-editor-btn">
            <X className="w-4 h-4 mr-1" /> Close
          </Button>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

          {/* Tools */}
          {TOOLS.map(t => (
            <Button
              key={t.id} variant={activeTool === t.id ? 'default' : 'ghost'} size="sm"
              onClick={() => setActiveTool(t.id)}
              className={activeTool === t.id ? 'bg-violet-600 text-white hover:bg-violet-700' : ''}
              data-testid={`tool-${t.id}`}
            >
              <t.icon className="w-4 h-4 mr-1" /> {t.label}
            </Button>
          ))}

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

          {/* Colors */}
          {COLORS.map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setActiveColor(c)}
              data-testid={`color-${c}`}
            />
          ))}

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

          <Button variant="ghost" size="sm" onClick={undo} disabled={annotations.length === 0} data-testid="undo-btn">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="upload-new-btn">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />

          <div className="flex-1" />

          {/* Zoom */}
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} data-testid="zoom-out-btn">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))} data-testid="zoom-in-btn">
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

          <Button variant="outline" size="sm" onClick={saveAnnotations} disabled={saving} data-testid="save-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={downloadEdited} disabled={saving} data-testid="download-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} Export PDF
          </Button>
        </div>

        {/* Page nav */}
        <div className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 px-4 py-1.5 flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="prev-page-btn">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300" data-testid="page-indicator">
            Page {currentPage} of {numPages}
          </span>
          <Button variant="ghost" size="sm" disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="next-page-btn">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* PDF Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-950 flex justify-center p-6" data-testid="pdf-canvas-area">
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div
              ref={overlayRef}
              className="relative"
              onClick={handleCanvasClick}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              style={{ cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'select' ? 'default' : 'pointer' }}
            >
              <Document file={pdfUrl} onLoadSuccess={({ numPages: n }) => setNumPages(n)} loading={<Loader2 className="w-8 h-8 animate-spin text-violet-500" />}>
                <Page pageNumber={currentPage} width={700} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>

              {/* Annotation overlays */}
              {pageAnnotations.map(ann => (
                <div key={ann.id} className="absolute group" style={{ left: `${ann.x * 100}%`, top: `${ann.y * 100}%`, pointerEvents: activeTool === 'select' ? 'auto' : 'none' }}>
                  {ann.type === 'text' && (
                    <span style={{ color: ann.color, fontSize: ann.fontSize || 14, fontFamily: 'Helvetica, sans-serif', whiteSpace: 'nowrap' }} data-testid={`ann-text-${ann.id}`}>
                      {ann.text}
                    </span>
                  )}
                  {ann.type === 'note' && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs text-yellow-900 max-w-[180px] shadow-sm" data-testid={`ann-note-${ann.id}`}>
                      {ann.text}
                    </div>
                  )}
                  {ann.type === 'highlight' && (
                    <div
                      className="bg-yellow-300/40 rounded"
                      style={{ width: `${(ann.width || 0.2) * 700}px`, height: `${(ann.height || 0.025) * 700}px` }}
                      data-testid={`ann-highlight-${ann.id}`}
                    />
                  )}
                  {ann.type === 'signature' && ann.dataUrl && (
                    <img
                      src={ann.dataUrl} alt="sig"
                      style={{ width: `${(ann.width || 0.2) * 700}px`, height: `${(ann.height || 0.06) * 700}px` }}
                      className="pointer-events-none"
                      data-testid={`ann-signature-${ann.id}`}
                    />
                  )}
                  {activeTool === 'select' && (
                    <button
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                      data-testid={`remove-ann-${ann.id}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Drawing preview */}
              {isDrawing && drawPoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  <polyline
                    points={drawPoints.map(p => `${p.x * 700},${p.y * 700}`).join(' ')}
                    fill="none" stroke={activeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Draw annotations for current page */}
              {pageAnnotations.filter(a => a.type === 'draw').map(ann => (
                <svg key={ann.id} className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  <polyline
                    points={ann.points.map(p => `${p.x * 700},${p.y * 700}`).join(' ')}
                    fill="none" stroke={ann.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    data-testid={`ann-draw-${ann.id}`}
                  />
                </svg>
              ))}

              {/* Signature pad popup */}
              {showSigPad && (
                <div style={{ position: 'absolute', left: sigPadPos.x, top: sigPadPos.y }}>
                  <MiniSignaturePad onSave={addSignature} onClose={() => setShowSigPad(false)} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text input bar */}
        {textPos && (
          <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-4 py-2 flex items-center gap-2" data-testid="text-input-bar">
            <Type className="w-4 h-4 text-gray-400" />
            <Input
              autoFocus
              placeholder="Type text and press Enter..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTextAnnotation(); if (e.key === 'Escape') setTextPos(null); }}
              className="flex-1"
              data-testid="text-annotation-input"
            />
            <Button size="sm" onClick={addTextAnnotation} disabled={!textInput.trim()} data-testid="add-text-btn">Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setTextPos(null)}>Cancel</Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default PDFEditorPage;
