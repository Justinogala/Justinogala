
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { brandingService } from '@/services/brandingService';
import LogoUpload from './LogoUpload';
import ColorPicker from './ColorPicker';

const BrandingSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(brandingService.getSettings());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initial load
    setSettings(brandingService.getSettings());
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleColorChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleTypographyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    brandingService.updateSettings(settings);
    setHasChanges(false);
    toast({ title: "Branding Saved", description: "Your branding settings have been updated." });
  };

  const handleReset = () => {
    if (confirm("Reset all branding settings to default?")) {
      const defaults = brandingService.resetSettings();
      setSettings(defaults);
      setHasChanges(false);
      toast({ title: "Reset Complete", description: "Branding reset to defaults." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Form */}
      <div className="space-y-6">
        <Card className="shadow-md border-border">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Configure your workspace identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Brand Name</label>
              <Input 
                value={settings.brandName} 
                onChange={e => handleChange('brandName', e.target.value)} 
                placeholder="My Company"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea 
                value={settings.brandDescription} 
                onChange={e => handleChange('brandDescription', e.target.value)}
                placeholder="A brief description..."
              />
            </div>
            <LogoUpload />
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Font Family</label>
              <Select 
                value={settings.typography.fontFamily} 
                onValueChange={v => handleTypographyChange('fontFamily', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Default)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Base Size</label>
              <Select 
                 value={settings.typography.baseSize} 
                 onValueChange={v => handleTypographyChange('baseSize', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="14px">Small (14px)</SelectItem>
                  <SelectItem value="16px">Medium (16px)</SelectItem>
                  <SelectItem value="18px">Large (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <ColorPicker 
               label="Primary Color" 
               color={settings.colors.primary} 
               onChange={c => handleColorChange('primary', c)} 
             />
             <ColorPicker 
               label="Secondary Color" 
               color={settings.colors.secondary} 
               onChange={c => handleColorChange('secondary', c)} 
             />
             <ColorPicker 
               label="Accent Color" 
               color={settings.colors.accent} 
               onChange={c => handleColorChange('accent', c)} 
             />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Defaults
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-8 h-fit space-y-6">
        <div className="flex items-center gap-2 mb-2">
           <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
           <h3 className="font-semibold text-lg">Live Preview</h3>
        </div>
        
        {/* Preview Container */}
        <div 
           className="rounded-xl border shadow-xl overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300"
           style={{ fontFamily: settings.typography.fontFamily }}
        >
           {/* Preview Header */}
           <div className="h-16 border-b flex items-center justify-between px-6" style={{ backgroundColor: settings.colors.background }}>
             <span className="font-bold text-xl" style={{ color: settings.colors.primary }}>{settings.brandName || 'Logo'}</span>
             <div className="flex gap-4 text-sm font-medium opacity-70" style={{ color: settings.colors.text }}>
               <span>Home</span>
               <span>About</span>
               <span>Services</span>
             </div>
             <div 
               className="h-9 px-4 rounded-md flex items-center justify-center text-sm font-medium text-white shadow"
               style={{ backgroundColor: settings.colors.primary, borderRadius: settings.borderRadius }}
             >
               Sign In
             </div>
           </div>

           {/* Preview Hero */}
           <div className="p-8 text-center space-y-6" style={{ backgroundColor: `${settings.colors.primary}10` }}>
              <h1 className="text-3xl font-bold" style={{ color: settings.colors.text }}>Welcome to {settings.brandName}</h1>
              <p className="max-w-md mx-auto opacity-80" style={{ color: settings.colors.text }}>
                {settings.brandDescription || "This is a preview of how your branding settings will look across the application."}
              </p>
              <div className="flex justify-center gap-3">
                 <button 
                   className="h-10 px-6 rounded-md font-medium text-white shadow-lg transform transition-transform hover:-translate-y-0.5"
                   style={{ backgroundColor: settings.colors.primary, borderRadius: settings.borderRadius }}
                 >
                   Get Started
                 </button>
                 <button 
                   className="h-10 px-6 rounded-md font-medium border bg-transparent"
                   style={{ 
                     borderColor: settings.colors.secondary, 
                     color: settings.colors.secondary,
                     borderRadius: settings.borderRadius 
                   }}
                 >
                   Learn More
                 </button>
              </div>
           </div>

           {/* Preview Content */}
           <div className="p-6 grid grid-cols-2 gap-4" style={{ backgroundColor: settings.colors.background }}>
              {[1, 2].map(i => (
                <div key={i} className="p-4 rounded-lg border shadow-sm space-y-2">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: settings.colors.accent }}>
                      {i}
                   </div>
                   <h4 className="font-semibold" style={{ color: settings.colors.text }}>Feature {i}</h4>
                   <p className="text-xs opacity-60" style={{ color: settings.colors.text }}>
                     Sample content card to demonstrate typography and color usage.
                   </p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
