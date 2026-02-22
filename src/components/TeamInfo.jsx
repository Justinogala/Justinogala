
import React, { useState } from 'react';
import { Edit2, Trash2, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { teamService } from '@/services/teamService';
import { permissionService } from '@/services/permissionService';
import { useAuth } from '@/context/AuthContext';

const TeamInfo = ({ team, memberCount, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || ''
  });

  const canEdit = permissionService.canEditTeam(team.id, user.id);
  const canDelete = permissionService.canDeleteTeam(team.id, user.id);

  const handleSave = () => {
    try {
      teamService.updateTeam(team.id, formData, user.id);
      setIsEditing(false);
      onUpdate();
      toast({ title: "Success", description: "Team updated successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update team." });
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      teamService.deleteTeam(team.id, user.id);
      onDelete();
      toast({ title: "Deleted", description: "Team deleted successfully." });
    }
  };

  return (
    <Card className="rounded-xl shadow-lg border border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Team Information</CardTitle>
        <div className="flex gap-2">
          {canEdit && !isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
          {canDelete && !isEditing && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Team Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-2xl font-bold text-indigo-500 mb-2">{team.name}</h3>
              <p className="text-muted-foreground">{team.description || "No description provided."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{memberCount} Members</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(team.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamInfo;
