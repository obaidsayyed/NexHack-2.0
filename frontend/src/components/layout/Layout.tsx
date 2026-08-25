import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  title: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-transparent text-text-main font-sans overflow-hidden">
      
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={(tab) => {
          onSelectTab(tab);
          setIsMobileMenuOpen(false);
        }} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <Header 
          title={title} 
          onNavigateProfile={() => onSelectTab('hospital-profile')} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 relative scroll-smooth">
          <div className="max-w-7xl mx-auto h-full pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
