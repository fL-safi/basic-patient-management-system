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
  const { user } = useAuthStore();  // Access the logged-in user

  // Define the sidebar menu items based on roles
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', color: 'text-blue-500' },
    { icon: Users, label: 'Patients', path: '/patients', color: 'text-green-500' },
    { icon: Calendar, label: 'Appointments', path: '/appointments', color: 'text-purple-500' },
    { icon: FileText, label: 'Reports', path: '/reports', color: 'text-orange-500' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-500' },
  ];

  // Role-specific items
  const roleBasedItems = {
    admin: [
      ...menuItems,
      { icon: UserPlus, label: 'User Management', path: '/user-management', color: 'text-red-500' },
      { icon: Box, label: 'Inventory Management', path: '/inventory-management', color: 'text-yellow-500' }
    ],
    receptionist: [
      ...menuItems
    ],
    doctor: [
      ...menuItems,
      { icon: Stethoscope, label: 'Consultations', path: '/consultations', color: 'text-teal-500' }
    ],
    pharmacist_dispenser: [
      ...menuItems,
      { icon: ShoppingCart, label: 'Prescriptions', path: '/prescriptions', color: 'text-purple-600' }
    ],
    pharmacist_inventory: [
      ...menuItems,
      { icon: Box, label: 'Inventory Management', path: '/inventory-management', color: 'text-teal-600' }
    ]
  };

  const isActiveRoute = (path) => location.pathname === path;

  const sidebarWidth = isMiniMode ? 'w-16' : 'w-72';

  // Get menu items based on the user's role
  const itemsForRole = roleBasedItems[user.role] || menuItems;

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
            {/* Logo */}
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
                  <h2 className={`text-lg font-bold bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
                    Healthway
                  </h2>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {itemsForRole.map((item, index) => {
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
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="font-medium whitespace-nowrap">
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
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
            className={`p-4 border-t ${theme.borderSecondary} cursor-pointer flex justify-center items-center`} // Added flexbox centering
            onClick={onToggleMiniMode} // Toggle on footer click
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
