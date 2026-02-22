import { v4 as uuidv4 } from 'uuid';
import { saveShareLink, getShareLinkByToken } from './supabaseService';

// Local storage key for access logs
const ACCESS_LOG_KEY = 'echoNote_shareAccess';

export const generateShareLink = async (meetingId, userId, durationInDays) => {
  let expiresAt = null;
  if (durationInDays) {
    const date = new Date();
    date.setDate(date.getDate() + durationInDays);
    expiresAt = date.toISOString();
  } else {
    // 100 years from now for 'never'
    const date = new Date();
    date.setFullYear(date.getFullYear() + 100);
    expiresAt = date.toISOString();
  }

  const token = uuidv4();
  
  return await saveShareLink(meetingId, userId, token, expiresAt);
};

export const validateShareToken = async (token) => {
  try {
    const shareLinkData = await getShareLinkByToken(token);
    
    if (!shareLinkData || !shareLinkData.meetings) {
      return { valid: false, error: 'Link not found or expired' };
    }
    
    return { valid: true, data: shareLinkData };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, error: 'Invalid token' };
  }
};

export const logShareAccess = async (shareLinkId) => {
  try {
    const logs = localStorage.getItem(ACCESS_LOG_KEY) ? JSON.parse(localStorage.getItem(ACCESS_LOG_KEY)) : [];
    
    logs.push({
      id: uuidv4(),
      share_link_id: shareLinkId,
      accessed_at: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
    
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.warn('Failed to log access:', error);
  }
};

export const getShareMetadata = async (token) => {
  try {
    const shareLink = await getShareLinkByToken(token);
    if (!shareLink) return null;
    
    const logs = localStorage.getItem(ACCESS_LOG_KEY) ? JSON.parse(localStorage.getItem(ACCESS_LOG_KEY)) : [];
    const count = logs.filter(l => l.share_link_id === shareLink.id).length;
    
    return {
      createdAt: shareLink.created_at,
      expiresAt: shareLink.expires_at,
      accessCount: count
    };
  } catch (error) {
    return null;
  }
};