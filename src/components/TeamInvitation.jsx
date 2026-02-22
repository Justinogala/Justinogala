
import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { invitationService } from '@/services/invitationService';
import { roleService } from '@/services/roleService';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const TeamInvitation = ({ teamId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');

  const fetchData = () => {
    setInvitations(invitationService.getPendingInvitations(teamId));
    setRoles(roleService.getAvailableRoles());
  };

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  const handleInvite = () => {
    if (!inviteEmail) return;
    setLoading(true);
    try {
      invitationService.sendInvitation(teamId, inviteEmail, inviteRole, user.id);
      toast({ title: "Invitation Sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setInviteEmail('');
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id) => {
    if (confirm("Cancel this invitation?")) {
      invitationService.cancelInvitation(id, user.id);
      fetchData();
      toast({ title: "Cancelled", description: "Invitation cancelled." });
    }
  };

  const handleResend = (id) => {
    invitationService.resendInvitation(id);
    fetchData();
    toast({ title: "Resent", description: "Invitation sent again." });
  };

  return (
    <Card className="rounded-xl shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-500" />
          Pending Invitations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Form */}
        <div className="flex flex-col md:flex-row gap-3 items-end border-b border-border pb-6">
           <div className="w-full md:flex-1 space-y-1">
             <label className="text-xs font-medium text-muted-foreground">Email Address</label>
             <Input 
               placeholder="colleague@example.com" 
               value={inviteEmail}
               onChange={(e) => setInviteEmail(e.target.value)}
             />
           </div>
           <div className="w-full md:w-40 space-y-1">
             <label className="text-xs font-medium text-muted-foreground">Role</label>
             <Select value={inviteRole} onValueChange={setInviteRole}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {roles.map(r => (
                   <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <Button className="w-full md:w-auto" onClick={handleInvite} disabled={loading || !inviteEmail}>
             {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
             Invite
           </Button>
        </div>

        {/* List */}
        <div>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending invitations.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map(invite => (
                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-muted/20 gap-3">
                   <div>
                     <div className="font-medium text-sm">{invite.email}</div>
                     <div className="text-xs text-muted-foreground flex gap-2">
                       <span>{invite.role}</span>
                       <span>•</span>
                       <span>Sent {formatDistanceToNow(new Date(invite.created_at))} ago</span>
                     </div>
                   </div>
                   <div className="flex gap-2 self-end sm:self-center">
                     <Button variant="outline" size="sm" className="h-8" onClick={() => handleResend(invite.id)}>
                       <RefreshCw className="w-3 h-3 mr-1" /> Resend
                     </Button>
                     <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-500/10" onClick={() => handleCancel(invite.id)}>
                       <XCircle className="w-3 h-3" />
                     </Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamInvitation;
