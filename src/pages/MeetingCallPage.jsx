
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoCallInterface from '@/components/video/VideoCallInterface';
import { Helmet } from 'react-helmet';

const MeetingCallPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleEndCall = () => {
    // Navigate back to meetings dashboard or feedback page
    navigate('/meetings');
  };

  return (
    <>
      <Helmet>
        <title>Active Meeting | Munal AI</title>
        <meta name="description" content="Secure high-quality video conferencing session." />
      </Helmet>
      <div className="fixed inset-0 z-[100] bg-black">
        <VideoCallInterface onEndCall={handleEndCall} />
      </div>
    </>
  );
};

export default MeetingCallPage;
