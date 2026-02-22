
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check, AlertTriangle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const GenerateAPIKeyModal = ({ isOpen, onClose, onGenerate }) => {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState({
    read: true,
    write: false,
    delete: false,
    admin: false
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!name.trim()) return;
    
    // Simulate key generation
    const prefix = 'sk_live_';
    const random = Array.from({length: 32}, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const newKey = `${prefix}${random}`;
    
    setGeneratedKey(newKey);
    if (onGenerate) {
      onGenerate({ name, key: newKey, scopes, created: new Date().toISOString() });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "API key copied securely." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setName('');
    setScopes({ read: true, write: false, delete: false, admin: false });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-indigo-500" />
            {generatedKey ? 'API Key Generated' : 'Create New API Key'}
          </DialogTitle>
          <DialogDescription>
            {generatedKey 
              ? "Please save this key now. You won't be able to see it again." 
              : "Generate a new API key for external access to your account."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generatedKey ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input 
                  id="keyName" 
                  placeholder="e.g. Production Server, Mobile App" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Checkbox 
                      id="read" 
                      checked={scopes.read} 
                      onCheckedChange={(c) => setScopes(prev => ({...prev, read: c}))} 
                    />
                    <Label htmlFor="read" className="cursor-pointer">Read Access</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Checkbox 
                      id="write" 
                      checked={scopes.write} 
                      onCheckedChange={(c) => setScopes(prev => ({...prev, write: c}))} 
                    />
                    <Label htmlFor="write" className="cursor-pointer">Write Access</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Checkbox 
                      id="delete" 
                      checked={scopes.delete} 
                      onCheckedChange={(c) => setScopes(prev => ({...prev, delete: c}))} 
                    />
                    <Label htmlFor="delete" className="cursor-pointer">Delete Access</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-red-200 dark:border-red-900/30">
                    <Checkbox 
                      id="admin" 
                      checked={scopes.admin} 
                      onCheckedChange={(c) => setScopes(prev => ({...prev, admin: c}))} 
                    />
                    <Label htmlFor="admin" className="cursor-pointer text-red-600 dark:text-red-400">Admin Access</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={!name} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Generate Key
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-4"
            >
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This key will only be displayed once. If you lose it, you'll need to generate a new one.
                </p>
              </div>

              <div className="relative">
                <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-sm break-all pr-12 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  {generatedKey}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 hover:bg-white dark:hover:bg-slate-800"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Scopes:</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(scopes).filter(([_, v]) => v).map(([k]) => (
                    <span key={k} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded capitalize">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  I have saved this key
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateAPIKeyModal;
