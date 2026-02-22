
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  User,
  AlertCircle,
  MoreVertical,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import ActionItemEditor from './ActionItemEditor';

const PriorityBadge = ({ priority }) => {
  const colors = {
    High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    Low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  };
  
  return (
    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", colors[priority] || colors.Medium)}>
      {priority}
    </Badge>
  );
};

const ActionItemsPanel = ({ 
  actionItems, 
  loading, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onToggleComplete,
  onExtract 
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleSave = (itemData) => {
    if (editingItem) {
      onUpdate(itemData);
    } else {
      onAdd(itemData);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
          <CheckSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Action Items Yet</h3>
        <p className="text-gray-500 max-w-md mb-6">
          Extract action items automatically from your transcription or add them manually.
        </p>
        <div className="flex gap-3">
          <Button onClick={onExtract} variant="outline" className="border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
            Auto-Extract
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {actionItems.filter(i => !i.completed).length} Pending Tasks
        </h3>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={onExtract}>
            Auto-Extract
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {actionItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                item.completed 
                  ? "bg-gray-50 border-gray-100 dark:bg-gray-900/30 dark:border-gray-800 opacity-60" 
                  : "bg-white border-gray-200 dark:bg-gray-950 dark:border-gray-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md"
              )}
            >
              <button 
                onClick={() => onToggleComplete(item.id)}
                className={cn(
                  "mt-0.5 flex-shrink-0 transition-colors duration-200",
                  item.completed ? "text-green-500" : "text-gray-300 hover:text-indigo-500"
                )}
              >
                {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium mb-1.5 transition-all",
                  item.completed ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"
                )}>
                  {item.text}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {item.assignee && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      <User className="w-3 h-3" />
                      <span>{item.assignee}</span>
                    </div>
                  )}
                  {item.deadline && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full",
                      new Date(item.deadline) < new Date() && !item.completed ? "text-red-600 bg-red-50" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Calendar className="w-3 h-3" />
                      <span>{item.deadline}</span>
                    </div>
                  )}
                  <PriorityBadge priority={item.priority} />
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600 focus:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ActionItemEditor 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)} 
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
};

export default ActionItemsPanel;
