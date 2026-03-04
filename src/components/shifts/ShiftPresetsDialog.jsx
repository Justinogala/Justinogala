import React, { useState } from 'react';
import { Clock, Trash2, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4'
];

const PRESET_ICONS = ['🌅', '☀️', '🌆', '🌙', '⭐', '🔥', '💼', '🏠', '🎯', '⚡', '🚀', '💪'];

const ShiftPresetsDialog = ({ 
  open, 
  onOpenChange, 
  presets = [], 
  onCreatePreset, 
  onDeletePreset,
  loading = false 
}) => {
  const { toast } = useToast();
  const [newPreset, setNewPreset] = useState({
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    icon: '💼',
    color: '#6366f1'
  });

  const handleCreate = async () => {
    if (!newPreset.name.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a preset name' });
      return;
    }

    await onCreatePreset(newPreset);
    setNewPreset({
      name: '',
      start_time: '09:00',
      end_time: '17:00',
      icon: '💼',
      color: '#6366f1'
    });
  };

  const handleDelete = async (presetId) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      await onDeletePreset(presetId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Shift Presets
          </DialogTitle>
          <DialogDescription>
            Create custom shift presets for quick scheduling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Presets</Label>
            {presets.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No custom presets yet. Create one below!
              </p>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{preset.icon || '💼'}</span>
                      <div>
                        <p className="font-medium">{preset.name}</p>
                        <p className="text-sm text-gray-500">
                          {preset.start_time} - {preset.end_time}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(preset.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Preset */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Create New Preset</Label>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  placeholder="e.g., Morning Shift"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewPreset({ ...newPreset, icon })}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all",
                        newPreset.icon === icon
                          ? "bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Start Time</Label>
                  <Input
                    type="time"
                    value={newPreset.start_time}
                    onChange={(e) => setNewPreset({ ...newPreset, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">End Time</Label>
                  <Input
                    type="time"
                    value={newPreset.end_time}
                    onChange={(e) => setNewPreset({ ...newPreset, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Color</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewPreset({ ...newPreset, color })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        newPreset.color === color && "ring-2 ring-offset-2 ring-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCreate} disabled={loading || !newPreset.name.trim()}>
            <Clock className="w-4 h-4 mr-2" />
            Create Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftPresetsDialog;
