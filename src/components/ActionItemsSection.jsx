
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Download, Filter, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ActionItemsSection = ({ actionItems }) => {
  const [items, setItems] = useState(actionItems.map(item => ({ ...item, completed: false })));
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const toggleComplete = (index) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    setItems(newItems);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle>Action Items</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilter(filter === 'all' ? 'pending' : 'all')}>
            <Filter className="w-4 h-4 mr-2" />
            {filter === 'all' ? 'All Items' : 'Pending Only'}
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">Status</div>
            <div className="col-span-6">Task</div>
            <div className="col-span-3">Owner</div>
            <div className="col-span-2">Deadline</div>
          </div>
          
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 rounded-lg items-center transition-colors",
                  item.completed ? "bg-white/5 opacity-60" : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="col-span-1">
                  <button onClick={() => toggleComplete(index)} className="text-gray-400 hover:text-indigo-400 transition-colors">
                    {item.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                </div>
                <div className={cn("col-span-6 font-medium text-white", item.completed && "line-through text-gray-400")}>
                  {item.task}
                </div>
                <div className="col-span-3">
                  <Badge variant="outline" className="bg-slate-800 text-indigo-300 border-indigo-500/30">
                    {item.owner}
                  </Badge>
                </div>
                <div className="col-span-2 text-sm text-gray-400">
                  {item.deadline}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No action items found for this filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionItemsSection;
