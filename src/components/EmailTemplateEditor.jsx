
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { emailTemplateService } from '@/services/emailTemplateService';

const EmailTemplateEditor = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = () => {
    const list = emailTemplateService.getAllTemplates();
    setTemplates(list);
    if (!selectedTemplate && list.length > 0) {
      selectTemplate(list[0]);
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
    setActiveTab('edit');
  };

  const handleCreateNew = () => {
    const newTemp = { id: 'new', name: 'New Template', subject: '', body: '<p>Start editing...</p>', isSystem: false };
    setSelectedTemplate(newTemp);
    setFormData({ name: 'New Template', subject: '', body: '<p>Start editing...</p>' });
    setActiveTab('edit');
  };

  const handleSave = () => {
    try {
      if (selectedTemplate.id === 'new') {
        const created = emailTemplateService.createTemplate(formData.name, formData.subject, formData.body);
        refreshList();
        selectTemplate(created);
        toast({ title: "Created", description: "Template created successfully." });
      } else {
        const updated = emailTemplateService.updateTemplate(selectedTemplate.id, formData);
        refreshList();
        selectTemplate(updated);
        toast({ title: "Saved", description: "Template updated successfully." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm("Delete this template?")) {
      try {
        emailTemplateService.deleteTemplate(id);
        const list = emailTemplateService.getAllTemplates();
        setTemplates(list);
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(list[0] || null);
        }
        toast({ title: "Deleted", description: "Template removed." });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  const getPreview = () => {
    // Mock data for preview
    const mockData = {
      name: 'John Doe',
      team_name: 'Acme Corp',
      link: '#'
    };
    
    // Simple replacement for preview
    let content = formData.body;
    Object.entries(mockData).forEach(([k, v]) => {
      content = content.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
    return content;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Sidebar List */}
      <Card className="col-span-1 flex flex-col h-full shadow-md border-border">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Templates</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {templates.map(t => (
            <div
              key={t.id}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors ${selectedTemplate?.id === t.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 border' : 'hover:bg-muted'}`}
              onClick={() => selectTemplate(t)}
            >
              <div className="truncate">
                <div className="font-medium text-sm truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
              </div>
              {!t.isSystem && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                  onClick={(e) => handleDelete(e, t.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Editor */}
      <Card className="col-span-1 md:col-span-2 flex flex-col h-full shadow-md border-border">
        {selectedTemplate ? (
          <>
            <div className="border-b px-6 py-3 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                 <Mail className="w-4 h-4 text-muted-foreground" />
                 <span className="font-medium">{selectedTemplate.name}</span>
                 {selectedTemplate.isSystem && <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">System</span>}
              </div>
              <Button size="sm" onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="edit" className="flex-1 p-6 space-y-4 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Template Name</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Monthly Newsletter"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Subject Line</label>
                  <Input 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="Subject..."
                  />
                </div>
                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="text-xs font-medium uppercase text-muted-foreground">HTML Content</label>
                  <Textarea 
                    className="flex-1 font-mono text-sm resize-none p-4"
                    value={formData.body}
                    onChange={e => setFormData({...formData, body: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground pt-2">Available variables: {'{{name}}'}, {'{{team_name}}'}, {'{{link}}'}</p>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 p-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-border p-8 h-full overflow-y-auto">
                   <div className="border-b pb-4 mb-4">
                     <p className="text-sm text-muted-foreground">Subject:</p>
                     <h3 className="font-bold text-lg">{formData.subject || '(No Subject)'}</h3>
                   </div>
                   <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: getPreview() }} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a template to edit
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailTemplateEditor;
