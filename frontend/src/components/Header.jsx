import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';

const Header = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full ${theme.cardOpacity} backdrop-filter backdrop-blur-lg ${theme.border} border-b sticky top-0 z-50`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className={`text-2xl font-bold bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text cursor-pointer`}
            >
              Healthway
            </motion.h1>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className={`hidden sm:flex items-center space-x-2 ${theme.textSecondary}`}>
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                  user.role === 'operator' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                  'bg-green-500 bg-opacity-20 text-green-400'
                }`}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textMuted} hover:${theme.textSecondary} transition-colors duration-200`}
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
                className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200`}
              >
                Logout
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;