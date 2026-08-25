import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, LogOut, Building, ChevronDown, Bell, Menu, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';

interface HeaderProps {
  title: string;
  onNavigateProfile?: () => void;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onNavigateProfile, onMenuToggle }) => {
  const { user, logout, apiConnected } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 sm:h-20 bg-surface-glass border border-border-glass backdrop-blur-xl shadow-lg rounded-2xl mx-4 sm:mx-6 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 sticky top-0 mt-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <button className="md:hidden p-3 -ml-3 rounded-lg text-text-muted hover:bg-surface hover:text-text-main transition-colors" onClick={onMenuToggle}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            Pulse Clinical System
          </span>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-text-main truncate max-w-[200px] sm:max-w-md">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hospital Identifier */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-border-glass">
          <div className="w-5 h-5 rounded bg-primary/10 text-primary-hover flex items-center justify-center">
            <Building className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-text-muted">{user?.hospital_name || 'St. Jude Medical'}</span>
        </div>

        {/* System Health Status */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-glass bg-surface/50">
          <div className="relative flex h-2.5 w-2.5">
            {apiConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-hover opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiConnected ? 'bg-primary shadow-[0_0_8px_rgba(20,184,166,0.8)]' : 'bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></span>
          </div>
          <span className={`text-[10px] font-bold tracking-wide ${apiConnected ? 'text-primary' : 'text-danger'}`}>
            {apiConnected ? 'SYSTEM ACTIVE' : 'CONNECTION LOST'}
          </span>
        </div>

        {/* Theme Toggle */}
        <MagneticButton variant="ghost" size="sm" onClick={toggleTheme} className="p-2 rounded-lg text-text-muted hidden sm:flex">
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </MagneticButton>

        {/* Notifications */}
        <MagneticButton variant="ghost" size="sm" className="relative p-2 rounded-lg text-text-muted hidden sm:flex">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-base shadow-[0_0_8px_var(--accent-danger-glow)]" />
        </MagneticButton>

        {/* User Profile Avatar */}
        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 sm:pr-3 rounded-xl bg-surface/50 hover:bg-surface border border-border-glass transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-base text-primary-hover border border-primary/30 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(20,184,166,0.2)] group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]">
              {user?.full_name ? user.full_name.charAt(0) : 'S'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-text-main leading-none mb-0.5 group-hover:text-primary-hover transition-colors">
                {user?.full_name || 'Dr. Sarah Chen'}
              </p>
              <p className="text-[10px] font-medium text-text-muted leading-none">
                Clinical Lead
              </p>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-text-muted group-hover:text-primary-hover transition-colors" />
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-surface-glass border border-border-glass backdrop-blur-xl shadow-lg rounded-xl py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border-glass bg-surface/30 md:hidden">
                  <p className="font-bold text-text-main text-sm">{user?.full_name || 'Dr. Sarah Chen'}</p>
                  <p className="text-text-muted text-xs mt-0.5 truncate">{user?.email || 's.chen@hospital.org'}</p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onNavigateProfile) onNavigateProfile();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-surface hover:text-primary-hover font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-danger-hover hover:bg-danger/10 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};
