import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  AlertOctagon,
  History,
  FileText,
  Building2,
  LogOut,
  HeartPulse,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Pulse Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Registry', icon: Users },
    { id: 'new-patient', label: 'Risk Assessor', icon: UserPlus },
    { id: 'high-risk', label: 'Alerts', icon: AlertOctagon },
    { id: 'history', label: 'Assessment Logs', icon: History },
    { id: 'reports', label: 'Data Export', icon: FileText },
    { id: 'hospital-profile', label: 'System Config', icon: Building2 },
  ];

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border-glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 min-w-[40px] bg-surface rounded-xl flex items-center justify-center text-primary-hover border border-primary/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <HeartPulse className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {(isHovered || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <span className="font-bold text-lg text-text-main tracking-tight block leading-tight">
                  Pulse AI
                </span>
                <span className="text-[10px] text-primary-hover font-bold uppercase tracking-widest leading-none">
                  Clinical Support
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {isMobile && (
          <button className="p-3 -mr-3 rounded-lg text-text-muted hover:bg-surface hover:text-text-main transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 sm:py-6 overflow-y-auto overflow-x-hidden space-y-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-primary/10 text-primary-hover'
                  : 'text-text-muted hover:bg-surface hover:text-text-main'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-6 bg-primary-hover rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.8)]" 
                />
              )}
              
              <div className="relative flex items-center justify-center min-w-[24px]">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-hover' : 'text-text-muted group-hover:text-primary'}`} />
                {item.id === 'high-risk' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-obsidian-900 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </div>
              
              <AnimatePresence>
                {(isHovered || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-border-glass mt-auto">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:bg-danger/10 hover:text-danger-hover transition-colors cursor-pointer group"
        >
          <div className="min-w-[24px] flex justify-center">
            <LogOut className="w-5 h-5 text-text-muted group-hover:text-danger transition-colors" />
          </div>
          <AnimatePresence>
            {(isHovered || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-base/60 backdrop-blur-md z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? (isMobileMenuOpen ? 280 : 0) : (isHovered ? 240 : 80),
          x: isMobile ? (isMobileMenuOpen ? 0 : -280) : 0
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`bg-surface-glass border-r border-border-glass backdrop-blur-xl flex flex-col h-screen shrink-0 z-50 overflow-hidden relative shadow-lg ${
          isMobile ? 'fixed top-0 bottom-0 left-0 m-0' : ''
        }`}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};
