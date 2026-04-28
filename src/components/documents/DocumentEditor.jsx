import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Save, Download, Loader2, Check,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote,
  Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Undo2, Redo2, Highlighter, Type, Minus, Code
} from 'lucide-react';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const ToolbarButton = ({ active, onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded-md transition-colors",
      active ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200"
    )}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />;

const EditorToolbar = ({ editor }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 z-10" data-testid="doc-editor-toolbar">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph"><Type className="w-4 h-4" /></ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code"><Code className="w-4 h-4" /></ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify"><AlignJustify className="w-4 h-4" /></ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist"><CheckSquare className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="w-4 h-4" /></ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="Insert Link"><LinkIcon className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton onClick={addImage} title="Insert Image"><ImageIcon className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton active={editor.isActive('table')} onClick={addTable} title="Insert Table"><TableIcon className="w-4 h-4" /></ToolbarButton>
    </div>
  );
};

const DocumentEditor = ({ docId, onBack }) => {
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSaveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TiptapUnderline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      TiptapTable.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none px-8 py-6 min-h-[60vh] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => saveContent(editor.getHTML()), 2000);
    },
  });

  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/documents/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
          setTitle(data.title);
          if (editor) editor.commands.setContent(data.content || '<p></p>');
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (docId && editor) loadDoc();
  }, [docId, editor]);

  const saveContent = useCallback(async (content) => {
    setSaving(true);
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, title }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [docId, title]);

  const saveTitle = async (newTitle) => {
    setTitle(newTitle);
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (e) { console.error(e); }
  };

  const exportDocx = async () => {
    const html = editor?.getHTML() || '';
    const blob = new Blob([`<html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const html = editor?.getHTML() || '';
    const printWin = window.open('', '_blank');
    printWin.document.write(`<html><head><title>${title}</title><style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:2em}h2{font-size:1.5em}h3{font-size:1.25em}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}img{max-width:100%}</style></head><body>${html}</body></html>`);
    printWin.document.close();
    printWin.print();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="flex flex-col h-full" data-testid="document-editor">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="doc-back-btn" className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => saveTitle(title)}
            className="text-lg font-semibold border-none shadow-none bg-transparent px-2 h-auto focus-visible:ring-0"
            data-testid="doc-title-input"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <Button variant="outline" size="sm" onClick={() => saveContent(editor?.getHTML())} data-testid="doc-save-btn" className="gap-1.5">
            <Save className="w-4 h-4" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} data-testid="doc-export-pdf" className="gap-1.5">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportDocx} data-testid="doc-export-docx" className="gap-1.5">
            <Download className="w-4 h-4" /> HTML
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex-1">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default DocumentEditor;
