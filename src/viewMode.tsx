import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ViewMode = 'clinician' | 'plain';

const STORAGE_KEY = 'psychmeds:viewMode';

const ViewModeContext = createContext<{ mode: ViewMode; setMode: (m: ViewMode) => void }>({
  mode: 'clinician',
  setMode: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>(() =>
    localStorage.getItem(STORAGE_KEY) === 'plain' ? 'plain' : 'clinician',
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);
  return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);
