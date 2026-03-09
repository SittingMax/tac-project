import React from 'react';
import { AppSidebar } from './app-sidebar';
import { Header } from './app-header';

import { CommandPalette } from '../domain/CommandPalette';
import { GlobalNotificationListener } from '../domain/GlobalNotificationListener';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { motion } from 'framer-motion';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300 w-full">
      <a href="#main-content" className="skip-to-content z-50">
        Skip to content
      </a>
      <TooltipProvider>
      <SidebarProvider className="w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col h-screen overflow-hidden">
          <Header />
          <motion.main
            id="main-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
          >
            <div className="mx-auto max-w-screen-2xl">{children}</div>
          </motion.main>
        </SidebarInset>
      </SidebarProvider>
      </TooltipProvider>

      {/* Global Command Palette - ⌘K / Ctrl+K */}
      <CommandPalette />
      <GlobalNotificationListener />
      <OnboardingTour />
    </div>
  );
};
