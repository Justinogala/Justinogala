
import { v4 as uuidv4 } from 'uuid';
import { memberService } from './memberService';
import { activityLogService } from './activityLogService';

const INVITATIONS_KEY = 'munal_invitations';

const getInvitations = () => {
  try {
    return JSON.parse(localStorage.getItem(INVITATIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveInvitations = (invitations) => {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
};

export const invitationService = {
  sendInvitation: (teamId, email, role, invitedByUserId) => {
    const invitations = getInvitations();
    
    // Check pending
    if (invitations.some(i => i.team_id === teamId && i.email === email && i.status === 'pending')) {
      throw new Error("Invitation already pending for this email");
    }

    const newInvite = {
      id: uuidv4(),
      team_id: teamId,
      email,
      role,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    invitations.push(newInvite);
    saveInvitations(invitations);
    
    activityLogService.logActivity(teamId, invitedByUserId, 'invitation_sent', `Invitation sent to ${email}`);
    
    return newInvite;
  },

  getPendingInvitations: (teamId) => {
    const invitations = getInvitations();
    const now = new Date();
    return invitations.filter(i => 
      i.team_id === teamId && 
      i.status === 'pending' &&
      new Date(i.expires_at) > now
    );
  },

  acceptInvitation: (inviteId, userId) => {
    const invitations = getInvitations();
    const index = invitations.findIndex(i => i.id === inviteId);
    
    if (index === -1) throw new Error("Invitation not found");
    const invite = invitations[index];
    
    if (new Date(invite.expires_at) < new Date()) {
       invite.status = 'expired';
       saveInvitations(invitations);
       throw new Error("Invitation expired");
    }

    invite.status = 'accepted';
    saveInvitations(invitations);

    // Add member
    memberService.addMember(invite.team_id, userId, invite.role, userId);
    
    return invite;
  },

  declineInvitation: (inviteId) => {
    const invitations = getInvitations();
    const index = invitations.findIndex(i => i.id === inviteId);
    if (index !== -1) {
      invitations[index].status = 'declined';
      saveInvitations(invitations);
    }
  },

  cancelInvitation: (inviteId, cancelledByUserId) => {
    const invitations = getInvitations();
    const filtered = invitations.filter(i => i.id !== inviteId);
    saveInvitations(filtered);
    
    // We might need to look up teamId to log properly, but let's assume we have it in UI context usually.
    // For now, simpler implementation:
    // activityLogService.logActivity(invitations.find(i=>i.id===inviteId)?.team_id, cancelledByUserId, 'invitation_cancelled', ...);
  },

  resendInvitation: (inviteId) => {
     const invitations = getInvitations();
     const index = invitations.findIndex(i => i.id === inviteId);
     if (index !== -1) {
       invitations[index].created_at = new Date().toISOString();
       invitations[index].expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
       saveInvitations(invitations);
     }
  }
};
