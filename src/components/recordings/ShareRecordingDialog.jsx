import React from 'react';
import { Share2, Link, Copy, Check, X, Globe, Users, UserPlus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const ShareRecordingDialog = ({
  open, onOpenChange, shareLink, linkCopied, isSharing, shareTab, setShareTab,
  teamMembers, filteredTeamMembers, selectedMembers, memberSearch, setMemberSearch,
  onCopyLink, onGenerateLink, onShareWithMembers, onRemoveSharing, onToggleMember, onClearMembers,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" />Share Recording</DialogTitle>
        <DialogDescription>Share with a public link or specific team members.</DialogDescription>
      </DialogHeader>
      
      <Tabs value={shareTab} onValueChange={setShareTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="gap-2"><Link className="w-4 h-4" />Public Link</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" />Team Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="space-y-4 pt-4">
          {shareLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly className="flex-1 text-sm" />
                <Button onClick={onCopyLink} variant="outline" size="icon">
                  {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">Anyone with this link can view the recording</p>
              <Button onClick={onRemoveSharing} variant="ghost" size="sm" className="text-red-500 w-full">
                <X className="w-4 h-4 mr-2" /> Remove Public Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center py-4">
                <Globe className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generate a public link that anyone can use to view this recording</p>
              </div>
              <Button onClick={onGenerateLink} disabled={isSharing} className="w-full gap-2">
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                Generate Public Link
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="team" className="space-y-4 pt-4">
          {teamMembers.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No team members available</p>
              <p className="text-xs text-gray-400 mt-1">Invite others to join your workspace first</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search team members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-9" />
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {filteredTeamMembers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No members found</p>
                ) : (
                  filteredTeamMembers.map(member => (
                    <div key={member.id} onClick={() => onToggleMember(member.id)}
                      className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedMembers.includes(member.id) ? "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}>
                      <Checkbox checked={selectedMembers.includes(member.id)} onCheckedChange={() => onToggleMember(member.id)} className="data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-white text-xs">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                      {selectedMembers.includes(member.id) && <Check className="w-4 h-4 text-rose-500 shrink-0" />}
                    </div>
                  ))
                )}
              </div>
              
              {selectedMembers.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected</span>
                  <Button onClick={onClearMembers} variant="ghost" size="sm" className="text-gray-400 h-auto p-0">Clear all</Button>
                </div>
              )}
              
              <Button onClick={onShareWithMembers} disabled={isSharing || selectedMembers.length === 0} className="w-full gap-2">
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Share with {selectedMembers.length > 0 ? `${selectedMembers.length} Member${selectedMembers.length > 1 ? 's' : ''}` : 'Selected'}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
);
