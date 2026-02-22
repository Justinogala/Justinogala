
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCode, ExternalLink, Lock } from 'lucide-react';

const APIDocumentationSection = () => {
  return (
    <Card className="rounded-xl shadow-lg border-none bg-slate-900 text-white overflow-hidden h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileCode className="w-5 h-5 text-indigo-400" />
              API Quick Reference
            </CardTitle>
            <CardDescription className="text-slate-400">Essential endpoints for integration</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-white hover:text-white">
            <ExternalLink className="w-3 h-3 mr-2" /> Full Docs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Lock className="w-3 h-3" /> Authentication
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
            Authorization: Bearer {'<YOUR_API_KEY>'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">GET</span> Users
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs text-slate-300">
              /api/v1/users?limit=10
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">POST</span> Meetings
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs text-slate-300">
              /api/v1/meetings/create
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Rate Limit</span>
            <span className="text-white font-medium">1000 req / min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIDocumentationSection;
