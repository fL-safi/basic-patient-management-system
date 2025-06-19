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

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { useTheme } from "./hooks/useTheme";
import AllUsers from "./pages/admin/AllUsers";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isCheckingAuth, checkAuth, isAuthenticated } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open
  const [sidebarMiniMode, setSidebarMiniMode] = useState(false); // Default to full mode

  useEffect(() => {
    checkAuth();
    initializeTheme();
  }, [checkAuth, initializeTheme]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false); // Close sidebar on mobile
      } else {
        setSidebarOpen(true); // Open sidebar on desktop
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for custom sidebar open event
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
      {/* Header - only show when authenticated */}
      {isAuthenticated && (
        <Header sidebarOpen={sidebarOpen} sidebarMiniMode={sidebarMiniMode} />
      )}

      {/* Sidebar - only show when authenticated */}
      {isAuthenticated && (
        <Sidebar
          isOpen={sidebarOpen}
          isMiniMode={sidebarMiniMode}
          onToggleMiniMode={toggleSidebarMiniMode}
          onClose={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div
        className={`${
          isAuthenticated ? "pt-16 transition-all duration-300" : ""
        } flex items-center justify-center ${
          isAuthenticated
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AllUsers />
              </ProtectedRoute>
            }
          />
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
          {/* Placeholder routes for sidebar menu items */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                    Patients Page
                  </h1>
                  <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                    Appointments Page
                  </h1>
                  <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                    Reports Page
                  </h1>
                  <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                    Settings Page
                  </h1>
                  <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
                </div>
              </ProtectedRoute>
            }
          />
          {/* catch all routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
