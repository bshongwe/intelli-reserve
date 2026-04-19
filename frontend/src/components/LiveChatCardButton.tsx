'use client';

import { useLiveChat } from '@/contexts/LiveChatContext';

export function LiveChatCardButton() {
  const { openChat } = useLiveChat();

  return (
    <button
      onClick={openChat}
      className="text-primary font-semibold text-sm hover:underline"
    >
      Start a conversation
    </button>
  );
}
