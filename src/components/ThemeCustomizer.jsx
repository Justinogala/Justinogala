
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { themeService } from '@/services/themeService';
import ColorPicker from './ColorPicker';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

const ThemeCustomizer = () => {
  const { toast } = useToast();
  const [themes, setThemes] = useState([]);
  const [activeThemeId, setActiveThemeId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New Theme State
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeType, setNewThemeType] = useState('light');
  const [newThemeColors, setNewThemeColors] = useState({
    primary: '#6366f1',
    secondary: '#ec4899',
    background: '#ffffff',
    surface: '#f8fafc'
  });

  const fetchData = () => {
    setThemes(themeService.getAllThemes());
    setActiveThemeId(themeService.getActiveThemeId());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = (id) => {
    themeService.applyTheme(id);
    setActiveThemeId(id);
    toast({ title: "Theme Applied", description: "Appearance updated successfully." });
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm("Delete this theme?")) {
      try {
        themeService.deleteTheme(id);
        fetchData();
        toast({ title: "Theme Deleted" });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  const handleCreate = () => {
    if (!newThemeName) return;
    try {
      themeService.createTheme(newThemeName, newThemeColors, newThemeType);
      setIsDialogOpen(false);
      setNewThemeName('');
      fetchData();
      toast({ title: "Theme Created", description: "New theme added to your library." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create theme." });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
           <h3 className="text-lg font-medium">Themes</h3>
           <p className="text-sm text-muted-foreground">Choose or create a visual theme for the interface.</p>
         </div>
         
         <Button onClick={() => setIsDialogOpen(true)}>
           <Plus className="w-4 h-4 mr-2" /> Create Theme
         </Button>

         <Modal 
           isOpen={isDialogOpen} 
           onClose={() => setIsDialogOpen(false)}
           title="Create Custom Theme"
           className="sm:max-w-[425px]"
         >
             <div className="grid gap-4 py-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Theme Name</label>
                 <Input value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="e.g., Ocean Blue" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Base Type</label>
                 <Select value={newThemeType} onValueChange={setNewThemeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-3 pt-2">
                 <label className="text-sm font-medium">Colors</label>
                 <ColorPicker 
                    label="Primary" 
                    color={newThemeColors.primary} 
                    onChange={c => setNewThemeColors({...newThemeColors, primary: c})} 
                 />
                 <ColorPicker 
                    label="Background" 
                    color={newThemeColors.background} 
                    onChange={c => setNewThemeColors({...newThemeColors, background: c})} 
                 />
               </div>
             </div>
             <div className="flex justify-end pt-4">
               <Button onClick={handleCreate} disabled={!newThemeName}>Save Theme</Button>
             </div>
         </Modal>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map(theme => (
          <div 
            key={theme.id}
            className={cn(
              "group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
              activeThemeId === theme.id ? "border-primary ring-2 ring-primary/20 ring-offset-2" : "border-border hover:border-primary/50"
            )}
            onClick={() => handleApply(theme.id)}
          >
            {/* Visual Preview */}
            <div className="h-32 w-full p-4 flex flex-col gap-2 relative" style={{ backgroundColor: theme.colors.background }}>
               <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
               </div>
               <div className="h-2 w-2/3 rounded opacity-20 bg-current text-foreground" style={{ color: theme.type === 'dark' ? '#fff' : '#000' }} />
               <div className="h-2 w-1/2 rounded opacity-20 bg-current text-foreground" style={{ color: theme.type === 'dark' ? '#fff' : '#000' }} />
               
               {/* Active Indicator */}
               {activeThemeId === theme.id && (
                 <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                   <Check className="w-4 h-4" />
                 </div>
               )}
            </div>

            {/* Info Footer */}
            <div className="p-4 bg-card flex justify-between items-center border-t border-border">
              <div>
                <h4 className="font-medium text-sm">{theme.name}</h4>
                <span className="text-xs text-muted-foreground capitalize">{theme.type} mode</span>
              </div>
              
              {/* Delete Custom Themes Only */}
              {!['default', 'dark'].includes(theme.id) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(theme.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeCustomizer;
