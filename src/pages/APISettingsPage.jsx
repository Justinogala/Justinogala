
import React from 'react';
import { Navigate } from 'react-router-dom';

const APISettingsPage = () => {
  // This page is deprecated for users. Redirecting to dashboard.
  return <Navigate to="/dashboard" replace />;
};

export default APISettingsPage;
