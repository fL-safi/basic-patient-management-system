import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Home, 
  Users, 
  Settings, 
  FileText, 
  Calendar,
  Menu,
  X,
  UserPlus,
  Box,
  Stethoscope,
  ShoppingCart
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Sidebar = ({ isOpen, isMiniMode, onToggleMiniMode, onClose }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const { user } = useAuthStore();

  // Base menu items available to all roles
  const baseMenuItems = [
    { icon: Home, label: 'Dashboard', path: '', color: 'text-blue-500' },
    { icon: Users, label: 'Patients', path: '/patients', color: 'text-green-500' },
    { icon: Calendar, label: 'Appointments', path: '/appointments', color: 'text-purple-500' },
    { icon: FileText, label: 'Reports', path: '/reports', color: 'text-orange-500' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-500' },
  ];

  // Role-specific additional items
  const roleSpecificItems = {
    admin: [
      { icon: Box, label: 'Inventory Management', path: '/inventory-management', color: 'text-yellow-500' }
    ],
    doctor: [
      { icon: Stethoscope, label: 'Consultations', path: '/consultations', color: 'text-teal-500' }
    ],
    pharmacist_dispenser: [
      { icon: ShoppingCart, label: 'Prescriptions', path: '/prescriptions', color: 'text-purple-600' }
    ],
    pharmacist_inventory: [
      { icon: Box, label: 'Inventory Management', path: '/inventory-management', color: 'text-teal-600' }
    ],
    receptionist: []
  };

  // Get role-specific menu items
  const getRoleBasedMenuItems = () => {
    const rolePrefix = `/${user.role}`;
    const baseItems = baseMenuItems.map(item => ({
      ...item,
      path: `${rolePrefix}${item.path}`
    }));

    const specificItems = (roleSpecificItems[user.role] || []).map(item => ({
      ...item,
      path: `${rolePrefix}${item.path}`
    }));

    return [...baseItems, ...specificItems];
  };

  const menuItems = getRoleBasedMenuItems();

  const isActiveRoute = (path) => location.pathname === path;

  const sidebarWidth = isMiniMode ? 'w-16' : 'w-72';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: isMiniMode ? -64 : -288 }}
          animate={{ x: 0 }}
          exit={{ x: isMiniMode ? -64 : -288 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed left-0 top-0 h-full ${sidebarWidth} ${theme.cardOpacity} backdrop-filter backdrop-blur-lg ${theme.border} border-r z-50 overflow-hidden flex flex-col`}
        >
          {/* Sidebar Header with Logo */}
          <div className={`flex items-center justify-between p-4 border-b ${theme.borderSecondary} min-h-[64px]`}>
            <div className="flex items-center space-x-2">
              {isMiniMode ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-white font-bold text-lg`}
                >
                  H
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-2"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    H
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
                      Healthway
                    </h2>
                    <p className={`text-xs ${theme.textMuted} capitalize`}>
                      {user.role.replace('_', ' ')} Panel
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="relative group"
                >
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? `${theme.cardSecondary} ${theme.textSecondary} shadow-md` : `${theme.textMuted} hover:${theme.cardSecondary} hover:${theme.textSecondary}`
                    } ${isMiniMode ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? item.color : ''} transition-colors duration-200 flex-shrink-0`} />
                    {!isMiniMode && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }} 
                        animate={{ opacity: 1, width: 'auto' }} 
                        exit={{ opacity: 0, width: 0 }} 
                        className="font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>

                  {/* Tooltip for mini mode */}
                  {/* {isMiniMode && (
                    <div className={`absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2`}>
                      {item.label}
                    </div>
                  )} */}
                </motion.div>
              );
            })}
          </nav>

          {/* Sidebar Footer - Toggle Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
            className={`p-4 border-t ${theme.borderSecondary} cursor-pointer flex justify-center items-center`}
            onClick={onToggleMiniMode}
          >
            <div className={`p-3 ${theme.cardSecondary} rounded-lg text-center w-16 flex justify-center items-center`}>
              <ChevronRight className={`w-4 h-4 ${isMiniMode ? 'rotate-180' : ''}`} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;