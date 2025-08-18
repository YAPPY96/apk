// app/(tabs)/index.tsx
import { InteractiveMap } from '@/components/map/InteractiveMap';
import React from 'react';

export const options = {
  gestureEnabled: false,
};

export default function HomeScreen() {
  return <InteractiveMap />;
}