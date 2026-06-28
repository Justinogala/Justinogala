import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AcademySubscription = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/user/plans', { replace: true }); }, [navigate]);
  return null;
};

export default AcademySubscription;
