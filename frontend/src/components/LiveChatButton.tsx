'use client';

import { MessageCircle } from 'lucide-react';
import { useLiveChat } from '@/contexts/LiveChatContext';

export function LiveChatButton() {
  const { openChat } = useLiveChat();

  return (
    <button
      onClick={openChat}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-gradient-to-r from-primary to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
      title="Open Live Chat"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
