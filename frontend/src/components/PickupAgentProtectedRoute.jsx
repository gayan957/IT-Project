import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const PickupAgentProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'pickupagent') {
    return <Navigate to="/pickup-agent/login" replace />;
  }

  return children;
};

export default PickupAgentProtectedRoute;
