import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import TrainersPage from './pages/TrainersPage';
import TrainerDetailPage from './pages/TrainerDetailPage';
import PackagesPage from './pages/PackagesPage';
import SettingsPage from './pages/SettingsPage';
import TrainerPaymentsPage from './pages/TrainerPaymentsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ReportingPage from './pages/ReportingPage';
import CustomerPaymentsPage from './pages/CustomerPaymentsPage';
import TrainerReportPage from './pages/TrainerPayoutReportPage';
import { StudioDataProvider } from './hooks/useStudioData';
import TrainerSchedulePage from './pages/TrainerSchedulePage';
import CustomerReportPage from './pages/CustomerReportPage';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import MySchedulePage from './pages/MySchedulePage';
import MyPayoutsPage from './pages/MyPayoutsPage';
import StudioSetupGate from './components/auth/StudioSetupGate';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
import SuperAdminRoute from './components/auth/SuperAdminRoute';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <StudioDataProvider>
          <HashRouter>
              <Routes>
                  {/* Regular User Authentication */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Super Admin Authentication */}
                  <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
                  
                  {/* Main Application Routes */}
                  <Route element={<ProtectedRoute />}>
                    
                    {/* Super Admin Dashboard Route */}
                    <Route element={<SuperAdminRoute />}>
                      <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
                    </Route>

                    {/* Regular Studio App Routes */}
                    <Route element={<StudioSetupGate />}>
                      <Route path="/" element={<Layout />}>
                          <Route index element={<Navigate to="/dashboard" replace />} />
                          <Route path="dashboard" element={<DashboardPage />} />

                          {/* Trainer-specific routes */}
                          <Route path="my-schedule" element={<MySchedulePage />} />
                          <Route path="my-payouts" element={<MyPayoutsPage />} />
                          
                          {/* Admin-only routes */}
                          <Route element={<AdminRoute />}>
                              {/* Manage Routes */}
                              <Route path="manage/customers" element={<CustomersPage />} />
                              <Route path="manage/customers/:id" element={<CustomerDetailPage />} />
                              <Route path="manage/trainers" element={<TrainersPage />} />
                              <Route path="manage/trainers/:id" element={<TrainerDetailPage />} />
                              <Route path="manage/trainers/:id/schedule" element={<TrainerSchedulePage />} />
                              <Route path="manage/packages" element={<PackagesPage />} />

                              {/* Finance Routes */}
                              <Route path="financial/trainer-payouts" element={<TrainerPaymentsPage />} />
                              <Route path="financial/payout-history" element={<PaymentHistoryPage />} />
                              <Route path="financial/payment-history" element={<CustomerPaymentsPage />} />

                              {/* Analytics Routes */}
                              <Route path="analytics/overview" element={<ReportingPage />} />
                              <Route path="analytics/trainer-report" element={<TrainerReportPage />} />
                              <Route path="analytics/customer-report" element={<CustomerReportPage />} />
                              
                              <Route path="settings" element={<SettingsPage />} />

                              {/* --- REDIRECTS for backward compatibility --- */}
                              <Route path="customers" element={<Navigate to="/manage/customers" replace />} />
                              <Route path="trainers" element={<Navigate to="/manage/trainers" replace />} />
                              <Route path="packages" element={<Navigate to="/manage/packages" replace />} />
                              <Route path="financial/packages" element={<Navigate to="/manage/packages" replace />} />
                              <Route path="financial/customer-payments" element={<Navigate to="/financial/payment-history" replace />} />
                              <Route path="payments" element={<Navigate to="/financial/trainer-payouts" replace />} />
                              <Route path="payments/history" element={<Navigate to="/financial/payout-history" replace />} />
                              <Route path="payments/customer" element={<Navigate to="/financial/payment-history" replace />} />
                              <Route path="reporting" element={<Navigate to="/analytics/overview" replace />} />
                              <Route path="reporting/trainer-report" element={<Navigate to="/analytics/trainer-report" replace />} />
                              <Route path="reporting/customer-report" element={<Navigate to="/analytics/customer-report" replace />} />
                          </Route>
                      </Route>
                    </Route>
                  </Route>
              </Routes>
          </HashRouter>
      </StudioDataProvider>
    </AuthProvider>
  );
};

export default App;