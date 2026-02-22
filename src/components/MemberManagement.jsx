
import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { memberService } from '@/services/memberService';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';
import { useAuth } from '@/context/AuthContext';

const MemberManagement = ({ teamId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const canRemove = permissionService.canRemoveMember(teamId, user.id);
  const canChangeRole = permissionService.canChangeRole(teamId, user.id);

  const fetchData = () => {
    setLoading(true);
    // In a real app, you'd fetch user details (name/email) for each member ID
    // Here we'll mock user details based on ID for display if we don't have a userService handy
    // or assume memberService returns populated data (Task 2 says "retrieve member details")
    const rawMembers = memberService.getTeamMembers(teamId);
    
    // Simulating resolving user info from localStorage 'munal_users' if needed, 
    // or just using placeholder if not found.
    const usersJson = localStorage.getItem('munal_users');
    const allUsers = usersJson ? JSON.parse(usersJson) : [];
    
    const populatedMembers = rawMembers.map(m => {
      const u = allUsers.find(user => user.id === m.user_id);
      return {
        ...m,
        name: u ? u.full_name : 'Unknown User',
        email: u ? u.email : `user_${m.user_id.substring(0,6)}@example.com`
      };
    });

    setMembers(populatedMembers);
    setRoles(roleService.getAvailableRoles());
    setLoading(false);
  };

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  const handleRoleChange = (memberId, newRole) => {
    try {
      memberService.updateMemberRole(teamId, memberId, newRole, user.id);
      fetchData();
      toast({ title: "Role Updated", description: "Member permissions updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update role." });
    }
  };

  const handleRemove = (memberId) => {
    if (confirm("Remove this user from the team?")) {
      memberService.removeMember(teamId, memberId, user.id);
      fetchData();
      toast({ title: "Member Removed", description: "User removed from team." });
    }
  };

  return (
    <Card className="rounded-xl shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.user_id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {canChangeRole ? (
                        <Select 
                          value={member.role} 
                          onValueChange={(val) => handleRoleChange(member.user_id, val)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 text-xs font-medium">
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canRemove && member.user_id !== user.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleRemove(member.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberManagement;
