import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenLine, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import ESignaturePage from '@/pages/ESignaturePage';
import PDFEditorPage from '@/pages/PDFEditorPage';
import FileConverterPage from '@/pages/FileConverterPage';

const tabs = [
  { id: 'esignature', label: 'eSignature', icon: PenLine },
  { id: 'pdf-editor', label: 'PDF Editor', icon: FileText },
  { id: 'converter', label: 'Converter', icon: RefreshCw },
];

const DocHubPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'esignature';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <PageTransition>
      <div data-testid="dochub-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">DocHub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign, edit, and manage your documents in one place.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl w-fit mb-6" data-testid="dochub-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
              data-testid={`dochub-tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'esignature' && <ESignaturePage embedded />}
        {activeTab === 'pdf-editor' && <PDFEditorPage embedded />}
        {activeTab === 'converter' && <FileConverterPage />}
      </div>
    </PageTransition>
  );
};

export default DocHubPage;
