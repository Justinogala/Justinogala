
import React from 'react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { currentAnnouncement } from '@/config/announcementConfig';

/**
 * AnnouncementManager
 * A utility wrapper component that injects the current configuration into the Banner.
 * This allows for easy swapping of global announcements from a single config file.
 */
const AnnouncementManager = () => {
  // In a more complex app, this could pull from an API or Context
  // For now, it pulls from our static config file
  
  if (!currentAnnouncement) return null;

  return (
    <AnnouncementBanner
      {...currentAnnouncement}
    />
  );
};

export default AnnouncementManager;
