
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Copy, Check, Shield } from 'lucide-react';
import { format } from 'date-fns';
import GenerateAPIKeyModal from './GenerateAPIKeyModal';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const APIKeysSection = () => {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production Server', prefix: 'sk_live_...8a9s', status: 'active', created: new Date().toISOString(), lastUsed: new Date().toISOString() },
    { id: 2, name: 'Staging Environment', prefix: 'sk_test_...j2k1', status: 'active', created: new Date(Date.now() - 86400000 * 5).toISOString(), lastUsed: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, name: 'Legacy Mobile App', prefix: 'sk_live_...992k', status: 'inactive', created: new Date(Date.now() - 86400000 * 30).toISOString(), lastUsed: new Date(Date.now() - 86400000 * 10).toISOString() },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const { toast } = useToast();

  const handleCreateKey = (newKeyData) => {
    const newKeyEntry = {
      id: Math.max(...keys.map(k => k.id), 0) + 1,
      name: newKeyData.name,
      prefix: `${newKeyData.key.slice(0, 8)}...${newKeyData.key.slice(-4)}`,
      status: 'active',
      created: new Date().toISOString(),
      lastUsed: 'Never'
    };
    setKeys([newKeyEntry, ...keys]);
    toast({ title: "API Key Created", description: `Key "${newKeyData.name}" is now active.` });
  };

  const handleDelete = (id) => {
    setKeys(keys.filter(k => k.id !== id));
    toast({ title: "API Key Revoked", description: "The key has been permanently deleted." });
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text); // In reality this would only copy prefix if full key isn't stored
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="rounded-xl shadow-lg border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            API Keys
          </CardTitle>
          <CardDescription>Manage programmatic access to your account</CardDescription>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
          <Plus className="w-4 h-4 mr-2" /> Generate New Key
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-white/50 dark:bg-slate-950/50 backdrop-blur overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {keys.map((key) => (
                  <motion.tr
                    key={key.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                      {key.prefix}
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(key.id, key.prefix)}>
                        {copiedId === key.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'} className={key.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}>
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(key.created), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.lastUsed === 'Never' ? 'Never' : format(new Date(key.lastUsed), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(key.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <GenerateAPIKeyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onGenerate={handleCreateKey} 
      />
    </Card>
  );
};

export default APIKeysSection;
