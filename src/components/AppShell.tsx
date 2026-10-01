'use client';

import React from 'react';
import { NavigationProvider } from '@/context/NavigationContext';
import { Header } from '@/components/Header';
import { SafeHavenModal } from '@/components/SafeHavenModal';
import { CompassRadarModal } from '@/components/CompassRadarModal';
import { BreadcrumbFlashbackModal } from '@/components/BreadcrumbFlashbackModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NavigationProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 min-h-0 w-full max-w-md mx-auto flex flex-col">
          {children}
        </main>
        <SafeHavenModal />
        <CompassRadarModal />
        <BreadcrumbFlashbackModal />
      </div>
    </NavigationProvider>
  );
};
