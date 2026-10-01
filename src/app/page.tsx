'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { HomeScreen } from '@/components/HomeScreen';
import { NavigateScreen } from '@/components/NavigateScreen';

export default function Page() {
  const { isNavigating } = useNavigation();

  return isNavigating ? <NavigateScreen /> : <HomeScreen />;
}
