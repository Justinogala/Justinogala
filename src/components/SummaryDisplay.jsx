
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Edit2, Save, Sparkles, CheckSquare, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { jsPDF } from 'jspdf';

const SummaryDisplay = ({ summaryData, onSave }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState({
    summary: summaryData?.summary?.text || '',
    keyPoints: summaryData?.keyPoints?.text || '',
    actionItems: summaryData?.actionItems?.text || ''
  });

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Content copied to clipboard" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy" });
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Meeting Summary", 15, 15);
    
    doc.setFontSize(12);
    doc.text("Summary:", 15, 30);
    const splitSummary = doc.splitTextToSize(data.summary, 180);
    doc.text(splitSummary, 15, 40);
    
    let yPos = 40 + (splitSummary.length * 7);
    
    doc.text("Key Points:", 15, yPos);
    const splitPoints = doc.splitTextToSize(data.keyPoints, 180);
    doc.text(splitPoints, 15, yPos + 10);
    
    yPos += 10 + (splitPoints.length * 7);
    
    doc.text("Action Items:", 15, yPos);
    const splitActions = doc.splitTextToSize(data.actionItems, 180);
    doc.text(splitActions, 15, yPos + 10);
    
    doc.save(`summary-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) onSave(data);
    toast({ title: "Saved", description: "Summary changes saved" });
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-purple-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Summary
        </CardTitle>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : <><Edit2 className="w-4 h-4 mr-2" /> Edit</>}
           </Button>
           {isEditing && (
             <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
               <Save className="w-4 h-4 mr-2" /> Save
             </Button>
           )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="keypoints">Key Points</TabsTrigger>
            <TabsTrigger value="actions">Action Items</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {isEditing ? (
              <Textarea 
                value={data.summary} 
                onChange={e => setData({...data, summary: e.target.value})}
                className="min-h-[300px]"
              />
            ) : (
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-lg leading-relaxed text-gray-700 dark:text-gray-200">
                {data.summary}
              </div>
            )}
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => handleCopy(data.summary)} className="mt-2">
                <Copy className="w-4 h-4 mr-2" /> Copy Summary
              </Button>
            )}
          </TabsContent>

          <TabsContent value="keypoints" className="space-y-4">
             {isEditing ? (
              <Textarea 
                value={data.keyPoints} 
                onChange={e => setData({...data, keyPoints: e.target.value})}
                className="min-h-[300px]"
              />
            ) : (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400 font-semibold">
                  <List className="w-5 h-5" /> Key Takeaways
                </div>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {data.keyPoints}
                </div>
              </div>
            )}
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => handleCopy(data.keyPoints)} className="mt-2">
                <Copy className="w-4 h-4 mr-2" /> Copy Key Points
              </Button>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
             {isEditing ? (
              <Textarea 
                value={data.actionItems} 
                onChange={e => setData({...data, actionItems: e.target.value})}
                className="min-h-[300px]"
              />
            ) : (
              <div className="bg-green-50/50 dark:bg-green-900/10 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4 text-green-700 dark:text-green-400 font-semibold">
                  <CheckSquare className="w-5 h-5" /> Action Items
                </div>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {data.actionItems}
                </div>
              </div>
            )}
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => handleCopy(data.actionItems)} className="mt-2">
                <Copy className="w-4 h-4 mr-2" /> Copy Actions
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {!isEditing && (
          <div className="flex justify-end pt-6 border-t border-border mt-4">
             <Button variant="outline" onClick={handleDownloadPDF}>
               <Download className="w-4 h-4 mr-2" /> Export to PDF
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryDisplay;
