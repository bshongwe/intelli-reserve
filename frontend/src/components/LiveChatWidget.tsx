'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useLiveChat } from '@/contexts/LiveChatContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function LiveChatWidget() {
  const { isOpen, closeChat } = useLiveChat();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! 👋 Welcome to IntelliReserve. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('pricing') || input.includes('cost') || input.includes('plan')) {
      return 'We offer three plans: Starter (free), Professional (R299/month), and Enterprise (custom). Would you like more details about any of these?';
    }
    if (input.includes('booking') || input.includes('reserve')) {
      return 'Our platform makes booking management easy! You can create bookings, manage availability, and track payments all from one dashboard. Need help getting started?';
    }
    if (input.includes('security') || input.includes('safe') || input.includes('escrow')) {
      return 'Security is our top priority. We use bank-level encryption, PCI DSS compliance, and secure escrow payments to protect both clients and service providers.';
    }
    if (input.includes('support') || input.includes('help')) {
      return 'We offer 24/7 customer support! You can reach us via email (support@intellireserve.com), phone, or live chat. How can we assist you?';
    }
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hi there! 👋 Thanks for your interest in IntelliReserve. What would you like to know?';
    }
    if (input.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }

    return "That's a great question! For more detailed information, please reach out to our support team at support@intellireserve.com or call +27 (0) 12 345 6789. Our team is always happy to help!";
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-24px)] bg-card border border-border rounded-lg shadow-xl flex flex-col h-[600px] sm:h-[500px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-rose-600 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">IntelliReserve Support</h3>
            <p className="text-xs text-white/80">Usually replies instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => {
              closeChat();
              setIsMinimized(false);
            }}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-primary to-rose-600 text-white rounded-br-none'
                      : 'bg-card border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border px-4 py-2.5 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3 shrink-0 bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-gradient-to-r from-primary to-rose-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
