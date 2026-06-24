import React from 'react';
import { Edit2, FolderOpen, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const DEFAULT_CATEGORIES = ['Uncategorized', 'Meetings', 'Tutorials', 'Presentations', 'Bug Reports', 'Personal'];

export const EditRecordingDialog = ({
  open, onOpenChange, editTitle, setEditTitle, editCategory, setEditCategory, isUpdating, onSave,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Edit2 className="w-5 h-5" />Edit Recording</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Recording title" data-testid="edit-recording-title" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" />{editCategory}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {DEFAULT_CATEGORIES.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setEditCategory(cat)}>{cat}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={onSave} disabled={isUpdating} data-testid="save-edit-btn">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
