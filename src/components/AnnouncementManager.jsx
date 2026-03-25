
import React from 'react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { rotatingAnnouncements } from '@/config/announcementConfig';

const AnnouncementManager = () => {
  if (!rotatingAnnouncements || rotatingAnnouncements.length === 0) return null;

  return (
    <AnnouncementBanner announcements={rotatingAnnouncements} />
  );
};

export default AnnouncementManager;
