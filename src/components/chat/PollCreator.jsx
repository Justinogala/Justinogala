import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Plus, Minus, X, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PollCreator = ({ onCreatePoll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresIn, setExpiresIn] = useState('24'); // hours

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    const validOptions = options.filter(opt => opt.trim());
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll({
        type: 'poll',
        question: question.trim(),
        options: validOptions.map((text, i) => ({ id: i + 1, text, votes: 0, voters: [] })),
        allowMultiple,
        isAnonymous,
        expiresAt: new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        totalVotes: 0
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      setIsAnonymous(false);
      setExpiresIn('24');
      setIsOpen(false);
    }
  };

  const isValid = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-orange-600 rounded-full"
          title="Create Poll"
        >
          <BarChart3 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Create a Poll
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Question */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="bg-gray-50 dark:bg-slate-800"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2">
              <AnimatePresence>
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                      {index + 1}
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-gray-50 dark:bg-slate-800"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Option
              </Button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="multiple" className="text-sm">Allow multiple answers</Label>
              </div>
              <Switch 
                id="multiple" 
                checked={allowMultiple} 
                onCheckedChange={setAllowMultiple}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="anonymous" className="text-sm">Anonymous voting</Label>
              </div>
              <Switch 
                id="anonymous" 
                checked={isAnonymous} 
                onCheckedChange={setIsAnonymous}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <Label className="text-sm">Expires in</Label>
              </div>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="168">1 week</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" 
              onClick={handleCreate}
              disabled={!isValid}
            >
              <Send className="w-4 h-4 mr-2" /> Create Poll
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PollCreator;
