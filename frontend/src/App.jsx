import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import FloatingShape from "./components/FloatingShape";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LoadingSpinner from "./components/LoadingSpinner";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { useTheme } from "./hooks/useTheme";
import AllUsers from "./pages/admin/AllUsers";
import RoleProfile from "./pages/admin/RoleProfile";

import AccountStatusRoute from "./components/AccountStatusRoute";
import AccountInactive from "./components/AccountInactive";
import Stocks from "./pages/inventory/Stocks";
import AllStocks from "./pages/inventory/AllStocks";
import DefaultPasswordModal from "./components/DefaultPasswordModal";
import InventroyAdminDashboard from "./pages/inventory/InventroyAdminDashboard";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// redirect authenticated users to their role-based home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Check account status first - redirect inactive users
    if (user.isActive === false) {
      return <Navigate to="/account-inactive" replace />;
    }

    // Redirect to role-specific dashboard
    const roleRoute = `/${user.role}`;
    return <Navigate to={roleRoute} replace />;
  }

  return children;
};

// Helper component to redirect root "/" to role-based route
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();
  const roleRoute = `/${user.role}`;
  return <Navigate to={roleRoute} replace />;
};

// Generic page components for different routes
const GenericPage = ({ title, role }) => {
  const { theme } = useTheme();
  return (
    <div className="p-8 text-center">
      <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
        {title} - {role.charAt(0).toUpperCase() + role.slice(1)}
      </h1>
      <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
    </div>
  );
};

function App() {
  const { isCheckingAuth, checkAuth, isAuthenticated, user } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMiniMode, setSidebarMiniMode] = useState(false);

    const [showDefaultPasswordModal, setShowDefaultPasswordModal] = useState(false);


  useEffect(() => {
    checkAuth();
    initializeTheme();
  }, [checkAuth, initializeTheme]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    useEffect(() => {
    if (isAuthenticated && user && user.isDefaultPassword) {
      setShowDefaultPasswordModal(true);
    } else {
      setShowDefaultPasswordModal(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleOpenSidebar = () => {
      setSidebarOpen(true);
    };

    window.addEventListener("openSidebar", handleOpenSidebar);
    return () => window.removeEventListener("openSidebar", handleOpenSidebar);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarMiniMode = () => {
    setSidebarMiniMode(!sidebarMiniMode);
  };

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme.primary} relative overflow-hidden`}
    >
      {/* {isAuthenticated && (
        <Header sidebarOpen={sidebarOpen} sidebarMiniMode={sidebarMiniMode} />
      )}

      {isAuthenticated && (
        <Sidebar
          isOpen={sidebarOpen}
          isMiniMode={sidebarMiniMode}
          onToggleMiniMode={toggleSidebarMiniMode}
          onClose={closeSidebar}
        />
      )} */}

      {/* Only show header and sidebar for authenticated users with active accounts */}
      {isAuthenticated && user && user.isActive !== false && (
        <Header sidebarOpen={sidebarOpen} sidebarMiniMode={sidebarMiniMode} />
      )}

      {isAuthenticated && user && user.isActive !== false && (
        <Sidebar
          isOpen={sidebarOpen}
          isMiniMode={sidebarMiniMode}
          onToggleMiniMode={toggleSidebarMiniMode}
          onClose={closeSidebar}
        />
      )}

      <div
        className={`${
          isAuthenticated && user && user.isActive
            ? "pt-16 transition-all duration-300"
            : ""
        } flex items-center justify-center ${
          isAuthenticated && user && user.isActive
            ? `min-h-[calc(100vh-4rem)] ${
                sidebarOpen && window.innerWidth >= 1024
                  ? sidebarMiniMode
                    ? "lg:ml-16"
                    : "lg:ml-72"
                  : ""
              }`
            : "min-h-screen"
        }`}
      >
        <Routes>
          {/* Account Inactive Route - No protection needed, just the component */}
          <Route path="/account-inactive" element={<AccountInactive />} />

          {/* Root redirect to role-based route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/email-verification"
            element={
              <RedirectAuthenticatedUser>
                <EmailVerificationPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <DashboardPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/user-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <AllUsers />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/user-management/:role/:id" // Dynamic route for role profile
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <RoleProfile />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Appointments Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Reports Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Inventory Management Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Settings Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Dashboard" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Patients Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Appointments Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultations"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Consultations Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <GenericPage title="Reports Page" role="doctor" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <GenericPage title="Settings Page" role="doctor" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Receptionist Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Dashboard" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Patients Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Appointments Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Reports Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Settings Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Pharmacist Dispenser Routes */}
          <Route
            path="/pharmacist_dispenser"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage title="Dashboard" role="pharmacist_dispenser" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Patients Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Appointments Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/prescriptions"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Prescriptions Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Reports Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Settings Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Pharmacist Inventory Routes */}
          <Route
            path="/pharmacist_inventory"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <InventroyAdminDashboard />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/inventory-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <Stocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/all-stocks"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <AllStocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Patients Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_inventory/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Appointments Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Reports Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_inventory/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Settings Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch all routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster />

      <DefaultPasswordModal 
        isOpen={showDefaultPasswordModal} 
        onClose={() => setShowDefaultPasswordModal(false)} 
      />

    </div>
  );
}

export default App;
