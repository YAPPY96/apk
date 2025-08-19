// components/map/LocationContext.tsx
import { LocationProvider } from '@/components/map/LocationContext';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export default function RootLayout() {
  return (
    <LocationProvider>
      {/* ...既存のナビゲーションやレイアウト... */}
    </LocationProvider>
  );
}
export interface LocationState {
  isLoading: boolean;
  isEnabled: boolean;
  error: string | null;
  hasPermission: boolean;
  lastUpdate: Date | null;
}

interface LocationContextValue {
  locationState: LocationState;
  setLocationState: React.Dispatch<React.SetStateAction<LocationState>>;
  updateLocationStatus: (status: Partial<LocationState>) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locationState, setLocationState] = useState<LocationState>({
    isLoading: false,
    isEnabled: false,
    error: null,
    hasPermission: false,
    lastUpdate: null,
  });

  const updateLocationStatus = (status: Partial<LocationState>) => {
    setLocationState(prev => ({
      ...prev,
      ...status,
      lastUpdate: new Date(),
    }));
  };

  return (
    <LocationContext.Provider value={{ locationState, setLocationState, updateLocationStatus }}>
      {children}
    </LocationContext.Provider>
  );
};