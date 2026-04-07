import React, { useState } from 'react';
import {
  Sparkles, Wand2, FileText, TrendingUp, Globe, Tags,
  Loader2, X, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
};

// ── AI Formula Modal ──
export const AIFormulaModal = ({ open, onClose, onInsert }) => {
  const [desc, setDesc] = useState('');
  const [context, setContext] = useState('');
  const [formula, setFormula] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    setFormula('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets/ai/formula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: desc, context }),
      });
      const data = await res.json();
      setFormula(data.formula);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleInsert = () => {
    if (formula) {
      onInsert(formula);
      setDesc('');
      setFormula('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="ai-formula-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            AI Formula Generator
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Describe what you need</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !loading) { e.preventDefault(); generate(); } }}
              placeholder='e.g., "Sum of column B from row 2 to 10" or "Average of all values in column C"'
              className="w-full h-20 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              data-testid="formula-desc-input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Cell context <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g., A1=Date, B1=Revenue, C1=Expenses"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              data-testid="formula-context-input"
            />
          </div>
          {formula && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" data-testid="formula-result">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Generated Formula:</p>
              <code className="text-sm font-mono text-emerald-900 dark:text-emerald-200 block bg-white dark:bg-slate-800 px-2 py-1 rounded">{formula}</code>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {formula ? (
            <Button onClick={handleInsert} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="formula-insert-btn">
              Copy Formula
            </Button>
          ) : (
            <Button onClick={generate} disabled={!desc.trim() || loading} className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white" data-testid="formula-generate-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// ── Smart Actions Modal ──
const ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: FileText, desc: 'Condense text values into brief summaries', color: 'blue' },
  { id: 'sentiment', label: 'Sentiment', icon: TrendingUp, desc: 'Analyze emotional tone of text values', color: 'rose' },
  { id: 'categorize', label: 'Categorize', icon: Tags, desc: 'Auto-classify text into categories', color: 'emerald' },
  { id: 'translate', label: 'Translate', icon: Globe, desc: 'Translate text to another language', color: 'violet' },
];

export const SmartActionsModal = ({ open, onClose, sheetId, selectedValues, onResult }) => {
  const [activeAction, setActiveAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [targetLang, setTargetLang] = useState('Spanish');

  const runAction = async (actionId) => {
    if (!selectedValues || selectedValues.length === 0) return;
    setActiveAction(actionId);
    setLoading(true);
    setResults(null);

    try {
      const token = getToken();
      const opts = actionId === 'translate' ? { target_language: targetLang } : undefined;
      const res = await fetch(`${API_URL}/api/sheets/${sheetId}/ai/smart-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionId, values: selectedValues, options: opts }),
      });
      const data = await res.json();
      setResults(data.results);
      if (onResult) onResult(actionId, data.results);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetAndClose = () => {
    setActiveAction(null);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg" data-testid="smart-actions-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Smart Actions
            {selectedValues && <span className="text-xs font-normal text-gray-400">({selectedValues.length} values selected)</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {!selectedValues || selectedValues.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm" data-testid="no-values-msg">
              Select cells with text data first, then use Smart Actions.
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(action => {
                  const Icon = action.icon;
                  const isActive = activeAction === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => runAction(action.id)}
                      disabled={loading}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left",
                        isActive
                          ? "border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                      )}
                      data-testid={`action-${action.id}`}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                        `bg-${action.color}-100 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`
                      )}>
                        {loading && isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</p>
                        <p className="text-[10px] text-gray-400">{action.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Translate language picker */}
              {activeAction === 'translate' && !results && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Target:</label>
                  <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    className="text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                    data-testid="translate-lang-select"
                  >
                    {['Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Swahili'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden" data-testid="action-results">
                  <div className="bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span>Results ({results.length})</span>
                    <button onClick={() => { setResults(null); setActiveAction(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                    {results.map((r, i) => (
                      <div key={i} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {typeof r === 'object' ? (
                          <div>
                            <span className="text-xs text-gray-400">{r.text || selectedValues[i]}</span>
                            <span className={cn("ml-2 px-1.5 py-0.5 text-xs rounded-full",
                              r.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                              r.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            )}>{r.sentiment} {r.score && `(${(r.score * 100).toFixed(0)}%)`}</span>
                          </div>
                        ) : (
                          <span>{String(r)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
