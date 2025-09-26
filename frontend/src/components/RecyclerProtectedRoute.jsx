import React from 'react';
import { Navigate } from 'react-router-dom';

const RecyclerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token || userRole !== 'recycler') {
    return <Navigate to="/recycler/login" replace />;
  }

  return children;
};

export default RecyclerProtectedRoute;