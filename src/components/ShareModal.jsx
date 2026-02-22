import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Share2, Copy, Check, Lock, Globe, RefreshCw, Trash2 } from 'lucide-react';
import { generateShareLink, validateShareToken } from '@/services/sharingService';
import { getShareLinkByMeetingId, revokeShareLink } from '@/services/supabaseService';
import { useAuth } from '@/context/AuthContext';

const ShareModal = ({ isOpen, onClose, meetingId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState('7'); // days

  useEffect(() => {
    if (isOpen && meetingId) {
      loadExistingLink();
    }
  }, [isOpen, meetingId]);

  const loadExistingLink = async () => {
    try {
      setLoading(true);
      const link = await getShareLinkByMeetingId(meetingId);
      if (link) {
        setCurrentLink(link);
      } else {
        setCurrentLink(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      // If duration is 'never' pass null, else pass number of days
      const days = duration === 'never' ? null : parseInt(duration);
      const link = await generateShareLink(meetingId, user.id, days);
      setCurrentLink(link);
      toast({
        title: "Link Generated",
        description: "Public share link has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    if (!currentLink) return;
    setLoading(true);
    try {
      await revokeShareLink(currentLink.id);
      setCurrentLink(null);
      toast({
        title: "Link Revoked",
        description: "The share link is no longer active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke link.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentLink) return;
    const url = `${window.location.origin}/shared/${currentLink.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = currentLink ? `${window.location.origin}/shared/${currentLink.token}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Meeting">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <p className="text-gray-300 text-sm">
            Create a public link to share the transcript and summary with anyone. 
            People with the link won't need an account to view.
          </p>

          {!currentLink ? (
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Link Expiration</span>
                <select 
                  className="bg-slate-900 border border-white/20 rounded-md text-sm text-white px-2 py-1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <Button onClick={handleGenerateLink} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                Generate Public Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="bg-slate-950" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-400 px-1">
                <span>Expires: {new Date(currentLink.expires_at).toLocaleDateString()}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRevokeLink} 
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Revoke Access
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;