import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

const AdminRoute: React.FC = () => {
  const { userRole } = useAuth();

  if (userRole !== UserRole.Admin) {
    // Redirect non-admin users to the dashboard or a specific "unauthorized" page
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
