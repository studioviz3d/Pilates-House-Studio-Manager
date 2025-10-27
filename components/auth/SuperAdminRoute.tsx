import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

const SuperAdminRoute: React.FC = () => {
  const { userRole } = useAuth();

  // If the user role is not 'super-admin', redirect them.
  // We can decide on a better redirect location later,
  // but for now, the main dashboard is a safe default.
  if (userRole !== UserRole.SuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If the user has the correct role, render the child routes.
  return <Outlet />;
};

export default SuperAdminRoute;
