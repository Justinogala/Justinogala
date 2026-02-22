
import React, { useState } from 'react';
import { 
  Search, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MoreVertical, 
  Shield, 
  UserMinus,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const ParticipantManager = ({ onClose }) => {
  const [search, setSearch] = useState('');
  
  // Mock participants
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', role: 'Host', isMuted: false, isVideoOff: false, isHandRaised: false, isMe: true },
    { id: 2, name: 'Sarah Chen', role: 'Presenter', isMuted: true, isVideoOff: false, isHandRaised: true, isMe: false },
    { id: 3, name: 'Mike Ross', role: 'Attendee', isMuted: false, isVideoOff: true, isHandRaised: false, isMe: false },
    { id: 4, name: 'Jessica Pearson', role: 'Attendee', isMuted: true, isVideoOff: true, isHandRaised: false, isMe: false },
  ]);

  const filtered = participants.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggleMute = (id) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, isMuted: !p.isMuted } : p));
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Participants ({participants.length})</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search people" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-800"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                   <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-xs">
                     {p.name.substring(0,2).toUpperCase()}
                   </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    {p.name} {p.isMe && '(You)'}
                    {p.isHandRaised && <Hand className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  </span>
                  <span className="text-[10px] text-slate-500">{p.role}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-7 w-7 ${p.isMuted ? 'text-red-500' : 'text-slate-400'}`}
                  onClick={() => toggleMute(p.id)}
                >
                  {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
                
                {!p.isMe && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleMute(p.id)}>
                        {p.isMuted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Pin Video</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => removeParticipant(p.id)}>
                        <UserMinus className="w-3.5 h-3.5 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <Button variant="outline" className="w-full text-slate-600 dark:text-slate-300">
          Mute All
        </Button>
      </div>
    </div>
  );
};

export default ParticipantManager;
