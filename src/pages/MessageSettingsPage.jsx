import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  User,
  PenLine,
  Mail,
  Filter,
  Sparkles,
  Users,
  Bot,
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Bell,
  Volume2,
  MessageSquare,
  Wand2,
  Zap,
  BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const MessageSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    signature: '',
    email_alias: '',
    auto_reply_enabled: false,
    auto_reply_message: '',
    notifications_enabled: true,
    notification_sound: true,
  });
  
  // AI Personalization state
  const [aiSettings, setAiSettings] = useState({
    ai_personalization_enabled: true,
    ai_tone: 'professional',
    ai_auto_categorize: true,
    ai_smart_replies: true,
  });
  
  // Assistant settings
  const [assistantSettings, setAssistantSettings] = useState({
    enabled: true,
    auto_draft_replies: false,
    summarize_threads: true,
    suggest_actions: true,
    writing_style: 'match_my_style',
  });
  
  // Filters state
  const [filters, setFilters] = useState([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [newFilter, setNewFilter] = useState({
    name: '',
    conditions: { field: 'from', operator: 'contains', value: '' },
    action: 'move_to_folder',
    action_value: 'inbox',
  });
  
  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactGroups, setContactGroups] = useState([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    nickname: '',
    notes: '',
    group: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchAllSettings();
    }
  }, [user?.id]);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch main settings
      const settingsRes = await fetch(`${API_URL}/api/messages/settings/${user.id}`);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
          setAiSettings(prev => ({
            ...prev,
            ai_personalization_enabled: data.settings.ai_personalization_enabled ?? true,
            ai_tone: data.settings.ai_tone || 'professional',
            ai_auto_categorize: data.settings.ai_auto_categorize ?? true,
            ai_smart_replies: data.settings.ai_smart_replies ?? true,
          }));
        }
      }
      
      // Fetch assistant settings
      const assistantRes = await fetch(`${API_URL}/api/messages/assistant/${user.id}`);
      if (assistantRes.ok) {
        const data = await assistantRes.json();
        if (data.settings) {
          setAssistantSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
      
      // Fetch filters
      const filtersRes = await fetch(`${API_URL}/api/messages/filters/${user.id}`);
      if (filtersRes.ok) {
        const data = await filtersRes.json();
        setFilters(data.filters || []);
      }
      
      // Fetch contacts
      const contactsRes = await fetch(`${API_URL}/api/messages/contacts/${user.id}`);
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
        setContactGroups(data.groups || []);
      }
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`${API_URL}/api/messages/settings/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...aiSettings }),
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveAssistantSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`${API_URL}/api/messages/assistant/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assistantSettings),
      });
      
      if (!response.ok) throw new Error('Failed to save assistant settings');
      
      toast({ title: 'Success', description: 'Assistant settings saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Filter handlers
  const handleSaveFilter = async () => {
    try {
      const url = editingFilter 
        ? `${API_URL}/api/messages/filters/${editingFilter.id}`
        : `${API_URL}/api/messages/filters/${user.id}`;
      
      const response = await fetch(url, {
        method: editingFilter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFilter),
      });
      
      if (!response.ok) throw new Error('Failed to save filter');
      
      toast({ title: 'Success', description: `Filter ${editingFilter ? 'updated' : 'created'}` });
      setShowFilterDialog(false);
      setEditingFilter(null);
      setNewFilter({ name: '', conditions: { field: 'from', operator: 'contains', value: '' }, action: 'move_to_folder', action_value: 'inbox' });
      fetchAllSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteFilter = async (filterId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/filters/${filterId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete filter');
      
      toast({ title: 'Success', description: 'Filter deleted' });
      fetchAllSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Contact handlers
  const handleSaveContact = async () => {
    try {
      const url = editingContact 
        ? `${API_URL}/api/messages/contacts/${editingContact.id}`
        : `${API_URL}/api/messages/contacts/${user.id}`;
      
      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      
      if (!response.ok) throw new Error('Failed to save contact');
      
      toast({ title: 'Success', description: `Contact ${editingContact ? 'updated' : 'created'}` });
      setShowContactDialog(false);
      setEditingContact(null);
      setNewContact({ name: '', email: '', nickname: '', notes: '', group: '' });
      fetchAllSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/contacts/${contactId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete contact');
      
      toast({ title: 'Success', description: 'Contact deleted' });
      fetchAllSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const settingsTabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'signature', label: 'Signature', icon: PenLine },
    { id: 'alias', label: 'Email Alias', icon: Mail },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'ai', label: 'AI Personalization', icon: Sparkles },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'assistant', label: 'Assistant', icon: Bot },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950" data-testid="message-settings-page">
        <div className="max-w-5xl mx-auto px-4 py-4 md:p-6">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/messages')}
              className="mb-2 -ml-2 h-10"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Messages
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Message Settings
            </h1>
            <p className="text-sm md:text-base text-gray-500">Customize your messaging experience</p>
          </div>

          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="md:hidden mb-4 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Desktop Sidebar Navigation */}
            <Card className="hidden md:block lg:col-span-1 h-fit">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          activeTab === tab.id
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Account Settings */}
              {activeTab === 'account' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>Manage your message account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive email when you get new messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications_enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Notification Sound</p>
                          <p className="text-sm text-gray-500">Play sound for new messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notification_sound}
                        onCheckedChange={(checked) => setSettings({ ...settings, notification_sound: checked })}
                      />
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Auto-Reply</p>
                          <p className="text-sm text-gray-500">Automatically reply when you&apos;re away</p>
                        </div>
                        <Switch
                          checked={settings.auto_reply_enabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, auto_reply_enabled: checked })}
                          className="ml-auto"
                        />
                      </div>
                      {settings.auto_reply_enabled && (
                        <Textarea
                          placeholder="Enter your auto-reply message..."
                          value={settings.auto_reply_message}
                          onChange={(e) => setSettings({ ...settings, auto_reply_message: e.target.value })}
                          rows={3}
                        />
                      )}
                    </div>

                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Signature */}
              {activeTab === 'signature' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenLine className="h-5 w-5" />
                      Email Signature
                    </CardTitle>
                    <CardDescription>Create a signature to appear at the bottom of your messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Enter your signature here...&#10;&#10;Best regards,&#10;John Doe&#10;Senior Developer"
                      value={settings.signature}
                      onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                      rows={6}
                      className="font-mono"
                    />
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="text-sm whitespace-pre-wrap border-t pt-2 border-gray-200 dark:border-gray-700">
                        {settings.signature || <span className="text-gray-400 italic">No signature set</span>}
                      </div>
                    </div>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Signature
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Email Alias */}
              {activeTab === 'alias' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Alias
                    </CardTitle>
                    <CardDescription>Set a display name or alias for your messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Display Name / Alias</Label>
                      <Input
                        placeholder="e.g., John from Support"
                        value={settings.email_alias}
                        onChange={(e) => setSettings({ ...settings, email_alias: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">This name will appear as the sender name on your messages</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">How recipients will see you:</p>
                      <p className="font-medium">
                        {settings.email_alias || user?.name || user?.email || 'Your Name'}
                      </p>
                    </div>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Alias
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              {activeTab === 'filters' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Message Filters
                        </CardTitle>
                        <CardDescription>Automatically organize incoming messages</CardDescription>
                      </div>
                      <Button onClick={() => setShowFilterDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Filter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filters.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No filters created yet</p>
                        <p className="text-sm">Create filters to automatically sort your messages</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filters.map((filter) => (
                          <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{filter.name}</p>
                              <p className="text-sm text-gray-500">
                                If {filter.conditions?.field} {filter.conditions?.operator} &quot;{filter.conditions?.value}&quot;
                                → {filter.action.replace(/_/g, ' ')} {filter.action_value && `to ${filter.action_value}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={filter.enabled ? 'default' : 'secondary'}>
                                {filter.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingFilter(filter);
                                  setNewFilter(filter);
                                  setShowFilterDialog(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() => handleDeleteFilter(filter.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Personalization */}
              {activeTab === 'ai' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Personalization
                    </CardTitle>
                    <CardDescription>Customize how AI helps you with messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">AI Personalization</p>
                          <p className="text-sm text-gray-500">Enable AI-powered features for messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={aiSettings.ai_personalization_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, ai_personalization_enabled: checked })}
                      />
                    </div>

                    <div className="space-y-2 p-4 border rounded-lg">
                      <Label>Writing Tone</Label>
                      <Select
                        value={aiSettings.ai_tone}
                        onValueChange={(value) => setAiSettings({ ...aiSettings, ai_tone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">AI will adapt suggestions to match this tone</p>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Auto-Categorize</p>
                          <p className="text-sm text-gray-500">AI automatically sorts messages into folders</p>
                        </div>
                      </div>
                      <Switch
                        checked={aiSettings.ai_auto_categorize}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, ai_auto_categorize: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Smart Replies</p>
                          <p className="text-sm text-gray-500">Show AI-suggested quick replies</p>
                        </div>
                      </div>
                      <Switch
                        checked={aiSettings.ai_smart_replies}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, ai_smart_replies: checked })}
                      />
                    </div>

                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save AI Settings
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Contacts */}
              {activeTab === 'contacts' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Contacts
                        </CardTitle>
                        <CardDescription>Manage your message contacts</CardDescription>
                      </div>
                      <Button onClick={() => setShowContactDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {contacts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <BookUser className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No contacts yet</p>
                        <p className="text-sm">Add contacts for quick access when composing messages</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                  {contact.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{contact.name}</p>
                                  <p className="text-sm text-gray-500">{contact.email}</p>
                                  {contact.nickname && (
                                    <p className="text-xs text-gray-400">@{contact.nickname}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {contact.group && (
                                  <Badge variant="secondary">{contact.group}</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setNewContact(contact);
                                    setShowContactDialog(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Assistant */}
              {activeTab === 'assistant' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription>Configure your AI messaging assistant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                          <Bot className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">AI Assistant</p>
                          <p className="text-sm text-gray-500">Your personal messaging helper</p>
                        </div>
                      </div>
                      <Switch
                        checked={assistantSettings.enabled}
                        onCheckedChange={(checked) => setAssistantSettings({ ...assistantSettings, enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <PenLine className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Auto-Draft Replies</p>
                          <p className="text-sm text-gray-500">AI drafts reply suggestions for you</p>
                        </div>
                      </div>
                      <Switch
                        checked={assistantSettings.auto_draft_replies}
                        onCheckedChange={(checked) => setAssistantSettings({ ...assistantSettings, auto_draft_replies: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="font-medium">Summarize Threads</p>
                          <p className="text-sm text-gray-500">Get AI summaries of long conversations</p>
                        </div>
                      </div>
                      <Switch
                        checked={assistantSettings.summarize_threads}
                        onCheckedChange={(checked) => setAssistantSettings({ ...assistantSettings, summarize_threads: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Suggest Actions</p>
                          <p className="text-sm text-gray-500">AI suggests follow-up actions</p>
                        </div>
                      </div>
                      <Switch
                        checked={assistantSettings.suggest_actions}
                        onCheckedChange={(checked) => setAssistantSettings({ ...assistantSettings, suggest_actions: checked })}
                      />
                    </div>

                    <div className="space-y-2 p-4 border rounded-lg">
                      <Label>Writing Style</Label>
                      <Select
                        value={assistantSettings.writing_style}
                        onValueChange={(value) => setAssistantSettings({ ...assistantSettings, writing_style: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="match_my_style">Match My Style</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">How the assistant writes messages for you</p>
                    </div>

                    <Button onClick={saveAssistantSettings} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Assistant Settings
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Filter Dialog */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFilter ? 'Edit Filter' : 'Create Filter'}</DialogTitle>
              <DialogDescription>Set up rules to automatically organize your messages</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Filter Name</Label>
                <Input
                  placeholder="e.g., Work emails"
                  value={newFilter.name}
                  onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={newFilter.conditions?.field}
                    onValueChange={(value) => setNewFilter({ ...newFilter, conditions: { ...newFilter.conditions, field: value } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from">From</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={newFilter.conditions?.operator}
                    onValueChange={(value) => setNewFilter({ ...newFilter, conditions: { ...newFilter.conditions, operator: value } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="starts_with">Starts with</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder="Enter value"
                    value={newFilter.conditions?.value}
                    onChange={(e) => setNewFilter({ ...newFilter, conditions: { ...newFilter.conditions, value: e.target.value } })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select
                    value={newFilter.action}
                    onValueChange={(value) => setNewFilter({ ...newFilter, action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="move_to_folder">Move to folder</SelectItem>
                      <SelectItem value="mark_as_read">Mark as read</SelectItem>
                      <SelectItem value="star">Star</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newFilter.action === 'move_to_folder' && (
                  <div className="space-y-2">
                    <Label>Folder</Label>
                    <Select
                      value={newFilter.action_value || 'inbox'}
                      onValueChange={(value) => setNewFilter({ ...newFilter, action_value: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbox">Inbox</SelectItem>
                        <SelectItem value="junk">Junk</SelectItem>
                        <SelectItem value="trash">Trash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowFilterDialog(false); setEditingFilter(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveFilter}>
                {editingFilter ? 'Update' : 'Create'} Filter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
              <DialogDescription>Save a contact for quick access</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="John Doe"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input
                    placeholder="johnny"
                    value={newContact.nickname}
                    onChange={(e) => setNewContact({ ...newContact, nickname: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Input
                  placeholder="e.g., Work, Family, Friends"
                  value={newContact.group}
                  onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                  list="contact-groups"
                />
                <datalist id="contact-groups">
                  {contactGroups.map(group => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any notes about this contact..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowContactDialog(false); setEditingContact(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveContact} disabled={!newContact.name || !newContact.email}>
                {editingContact ? 'Update' : 'Add'} Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default MessageSettingsPage;
