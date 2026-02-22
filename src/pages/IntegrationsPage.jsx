
import React from 'react';
import { Navigate } from 'react-router-dom';

const IntegrationsPage = () => {
  // This page is deprecated for users. Redirecting to dashboard.
  return <Navigate to="/dashboard" replace />;
};

export default IntegrationsPage;
