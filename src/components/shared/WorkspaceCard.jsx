import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Users, HardDrive, Settings, MessageSquare, ArrowRight, MoreVertical, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const WorkspaceCard = ({ workspace }) => {
  const navigate = useNavigate();

  const getPlanColor = (plan) => {
    switch ((plan || '').toLowerCase()) {
      case 'pro': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'enterprise': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="group relative overflow-hidden border border-white/20 dark:border-white/10 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-md h-full flex flex-col">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{getInitials(workspace.name)}</span>
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                {workspace.name}
              </CardTitle>
              <Badge variant="outline" className={cn("mt-1 text-xs font-semibold border", getPlanColor(workspace.plan))}>
                {workspace.plan || 'Free'}
              </Badge>
              <Badge variant="outline" className="mt-1 text-[10px] py-0 border-slate-200 dark:border-slate-700">
                {workspace.scope === 'org' ? <><Globe className="w-2.5 h-2.5 mr-0.5" /> Org</> : <><Lock className="w-2.5 h-2.5 mr-0.5" /> Team</>}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigate(`/workspace/${workspace.id}/manage`)}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <span className="w-4 h-4 mr-2" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 flex-grow relative z-10">
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">
            {workspace.description || 'No description provided for this workspace.'}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex -space-x-2 overflow-hidden">
               {/* Mock avatars for members */}
               {[1, 2, 3].map((_, i) => (
                 <Avatar key={i} className="inline-block w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gray-100 dark:bg-slate-800">
                   <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">{['JD', 'AS', 'MK'][i]}</AvatarFallback>
                 </Avatar>
               ))}
               <div className="flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gray-100 dark:bg-slate-800 text-[10px] font-medium text-gray-500">
                 +2
               </div>
            </div>
            <div className="text-xs text-gray-500 font-medium">
               5 Members
            </div>
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-slate-900/30 relative z-10">
          <Button 
            variant="ghost" 
            className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
            onClick={() => navigate('/workspace/chat')}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Chat
          </Button>
          <Button 
            variant="default"
            className="w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm"
            onClick={() => navigate(`/workspace/${workspace.id}/manage`)}
          >
            Manage
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default WorkspaceCard;