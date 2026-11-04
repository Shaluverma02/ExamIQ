import React from 'react';
import { Navigate } from 'react-router-dom';

const ResetPassword = () => {
  return <Navigate to="/forgot-password" replace />;
};

export default ResetPassword;
