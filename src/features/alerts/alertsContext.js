import { createContext, useContext } from 'react';

export const AlertsContext = createContext(null);

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used inside AlertsProvider');
  return context;
}
