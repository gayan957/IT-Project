import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const PickupPartnerProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'pickuppartner') {
    return <Navigate to="/pickup-partner/login" replace />;
  }

  return children;
};

export default PickupPartnerProtectedRoute;