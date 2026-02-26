import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store';
import { CommandPalette } from '../domain/CommandPalette';
import { GlobalNotificationListener } from '../domain/GlobalNotificationListener';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { motion } from 'framer-motion';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { sidebarCollapsed } = useStore();
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <a href="#main-content" className="skip-to-content z-50">
                Skip to content
            </a>
            <Sidebar />
            <div className={`flex w-full flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <Header />
                <motion.main
                    id="main-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
                >
                    <div className="mx-auto max-w-screen-2xl">
                        {children}
                    </div>
                </motion.main>
            </div>
            {/* Global Command Palette - ⌘K / Ctrl+K */}
            <CommandPalette />
            <GlobalNotificationListener />
            <OnboardingTour />
        </div>
    );
};
