'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface LiveChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

export function LiveChatProvider({ children }: { readonly children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openChat: () => setIsOpen(true),
      closeChat: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return (
    <LiveChatContext.Provider value={value}>
      {children}
    </LiveChatContext.Provider>
  );
}

export function useLiveChat() {
  const context = useContext(LiveChatContext);
  if (!context) {
    throw new Error('useLiveChat must be used within LiveChatProvider');
  }
  return context;
}
