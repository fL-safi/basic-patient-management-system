import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';

const Header = ({ sidebarOpen, sidebarMiniMode }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'receptionist':
        return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'doctor':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'pharmacist_dispenser':
        return 'bg-purple-500 bg-opacity-20 text-purple-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  // Calculate header left margin based on sidebar state
  const getHeaderStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && sidebarOpen) {
      return sidebarMiniMode ? 'lg:ml-16' : 'lg:ml-72';
    }
    return '';
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 right-0 left-0 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg ${theme.border} border-b z-40 transition-all duration-300 ${getHeaderStyle()}`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Info */}
            {user && (
              <div className={`hidden sm:flex items-center space-x-2 ${theme.textSecondary}`}>
                <User className="w-4 h-4" />
                <span className="text-sm font-medium truncate max-w-32">{user.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getRoleBadgeColor(user.role)}`}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textMuted} hover:${theme.textSecondary} transition-colors duration-200 flex-shrink-0`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>

            {/* Logout Button */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className={`px-3 sm:px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200 text-sm whitespace-nowrap flex-shrink-0`}
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;