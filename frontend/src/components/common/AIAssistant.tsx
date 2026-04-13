"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FAQItem {
  id: string;
  category: "login" | "signup" | "subscriptions" | "general";
  question: string;
  answer: string;
  keywords: string[];
}

const FAQ_DATA: FAQItem[] = [
  // Login FAQs
  {
    id: "login-1",
    category: "login",
    question: "How do I log in?",
    answer: "Enter your email and password in the login form. Click 'Sign In' to access your dashboard. If you don't have an account, you can sign up instead.",
    keywords: ["login", "sign in", "access", "account"],
  },
  {
    id: "login-2",
    category: "login",
    question: "I forgot my password. What should I do?",
    answer: "We're currently working on a password recovery feature. For now, please contact our support team at support@intellireserve.com, and we'll help you reset your password.",
    keywords: ["forgot", "password", "reset", "recovery"],
  },
  {
    id: "login-3",
    category: "login",
    question: "What are the demo credentials for testing?",
    answer: "Host Account: host@demo.com (Password: Demo@123)\nClient Account: client@demo.com (Password: Demo@123)\nThese are for development/testing only.",
    keywords: ["demo", "test", "credentials", "test account"],
  },
  {
    id: "login-4",
    category: "login",
    question: "Is my login information secure?",
    answer: "Yes! We use industry-standard security measures:\n• Passwords are hashed with bcrypt (12 rounds)\n• JWT tokens stored in HTTP-only cookies\n• CSRF protection enabled\n• All data encrypted in transit (HTTPS)",
    keywords: ["secure", "security", "safe", "privacy", "protection"],
  },

  // Signup FAQs
  {
    id: "signup-1",
    category: "signup",
    question: "How do I create an account?",
    answer: "Click 'Sign up' from the login page. Fill in your details:\n1. Full Name\n2. Email address\n3. Password (minimum 8 characters)\n4. Select your role (Host or Client)\n5. Click 'Create Account'",
    keywords: ["signup", "register", "create account", "account creation"],
  },
  {
    id: "signup-2",
    category: "signup",
    question: "What's the difference between Host and Client?",
    answer: "Host: Provide services, manage bookings, and receive payments for your services\nClient: Book services from hosts, make payments, and manage your bookings",
    keywords: ["host", "client", "role", "difference", "provider"],
  },
  {
    id: "signup-3",
    category: "signup",
    question: "Can I change my account type after signing up?",
    answer: "Currently, your account type (Host or Client) is set during signup. If you need to switch, please contact our support team at support@intellireserve.com.",
    keywords: ["change", "switch", "account type", "role change"],
  },
  {
    id: "signup-4",
    category: "signup",
    question: "Is my email verified automatically?",
    answer: "Email verification is currently under development. For now, your account is active immediately after signup. You can start using IntelliReserve right away!",
    keywords: ["email", "verify", "verification", "confirm"],
  },

  // Subscription FAQs
  {
    id: "sub-1",
    category: "subscriptions",
    question: "What are the subscription plans available?",
    answer: "We offer three plans:\n\n1. STARTER (R0/month) - Perfect for getting started\n   • Up to 10 bookings/month\n   • Basic analytics\n   • Email support\n\n2. PROFESSIONAL (R99/month) - Most Popular\n   • Unlimited bookings\n   • Advanced analytics & reports\n   • Priority support\n   • Custom branding\n   • API access\n\n3. ENTERPRISE (Custom pricing)\n   • Everything in Professional\n   • Dedicated account manager\n   • White-label solution\n   • Custom integrations\n   • SLA guarantee",
    keywords: ["plans", "pricing", "subscription", "package", "tier"],
  },
  {
    id: "sub-2",
    category: "subscriptions",
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes! You can change your plan anytime from your dashboard settings. Changes take effect immediately. If upgrading, you'll be charged the difference for the current month.",
    keywords: ["upgrade", "downgrade", "change plan", "switch"],
  },
  {
    id: "sub-3",
    category: "subscriptions",
    question: "Do I need a subscription to start?",
    answer: "No! Everyone starts with our FREE Starter plan (R0/month). You can upgrade to Professional anytime to unlock advanced features. The Starter plan is perfect for testing and small-scale use.",
    keywords: ["free", "cost", "price", "starter", "paid"],
  },
  {
    id: "sub-4",
    category: "subscriptions",
    question: "What's included in Professional vs Starter?",
    answer: "Professional adds:\n✓ Unlimited bookings (Starter: 10/month)\n✓ Advanced analytics with custom reports\n✓ Priority email support (48h response)\n✓ Custom branding options\n✓ Full API access for integrations\n✓ Advanced payment features",
    keywords: ["professional", "features", "comparison", "included"],
  },

  // General FAQs
  {
    id: "general-1",
    category: "general",
    question: "What is IntelliReserve?",
    answer: "IntelliReserve is a modern, fintech-grade booking platform that combines real-time reservation management with intelligent escrow payments. Whether you're offering services or booking them, IntelliReserve simplifies the entire process.",
    keywords: ["what", "intellireserve", "platform", "about"],
  },
  {
    id: "general-2",
    category: "general",
    question: "How do I contact customer support?",
    answer: "You can reach our support team:\n📧 Email: support@intellireserve.com\n💬 Chat: Available 24/7 in-app (coming soon)\n📞 Phone: +27 11 555 0100\n⏰ Response time: 24-48 hours",
    keywords: ["support", "help", "contact", "assistance"],
  },
  {
    id: "general-3",
    category: "general",
    question: "Is IntelliReserve available in my country?",
    answer: "IntelliReserve is currently available in South Africa. We're expanding to more countries soon! If you're outside South Africa, please sign up on our waitlist at intellireserve.com/early-access.",
    keywords: ["country", "region", "location", "available"],
  },
  {
    id: "general-4",
    category: "general",
    question: "What payment methods do you accept?",
    answer: "We accept:\n✓ Credit/Debit Cards (Visa, Mastercard)\n✓ EFT/Bank Transfer\n✓ Instant EFT (SnapScan, Ozow)\n✓ Digital Wallets (Apple Pay, Google Pay)\nAll transactions are secured with PCI DSS compliance.",
    keywords: ["payment", "card", "method", "accept"],
  },
];

const QUICK_TOPICS = [
  { id: "login", label: "Login Help", icon: "🔐" },
  { id: "signup", label: "Signup Help", icon: "📝" },
  { id: "subscriptions", label: "Plans & Pricing", icon: "💳" },
  { id: "general", label: "General", icon: "❓" },
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! 👋 I'm your IntelliReserve Assistant. I can help you with:\n\n• Login and account issues\n• Signup and account creation\n• Subscription plans and pricing\n• General questions about the platform\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const findRelevantFAQ = (query: string): FAQItem | null => {
    const lowerQuery = query.toLowerCase();
    const categoryFilter = selectedCategory
      ? FAQ_DATA.filter((faq) => faq.category === selectedCategory)
      : FAQ_DATA;

    // Find FAQ with matching keywords or question
    return (
      categoryFilter.find(
        (faq) =>
          faq.keywords.some((keyword) => lowerQuery.includes(keyword)) ||
          faq.question.toLowerCase().includes(lowerQuery)
      ) || null
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate thinking time
    setTimeout(() => {
      const faq = findRelevantFAQ(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: faq
          ? faq.answer
          : "I'm not sure about that. Could you rephrase your question or choose one of the quick topics below? Or contact us at support@intellireserve.com for more help.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleQuickTopic = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const topicName = QUICK_TOPICS.find((t) => t.id === categoryId)?.label || categoryId;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `Tell me about ${topicName}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Show relevant FAQs for category
    setTimeout(() => {
      const categoryFAQs = FAQ_DATA.filter((faq) => faq.category === categoryId);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Here are the top questions about ${topicName}:\n\n${categoryFAQs
          .slice(0, 3)
          .map((faq, idx) => `${idx + 1}. ${faq.question}`)
          .join("\n")}\n\nFeel free to ask any of these or type your own question!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-lg w-14 h-14 p-0 gap-0"
          title="Open AI Assistant"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 max-h-[600px] shadow-2xl flex flex-col border-2">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-gradient-to-r from-primary/10 to-rose-600/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm">IntelliReserve Assistant</CardTitle>
                <CardDescription className="text-xs">Always here to help</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setSelectedCategory(null);
              }}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 p-4 min-h-80 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", msg.type === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="flex gap-1 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Topics */}
          {!selectedCategory && messages.length <= 1 && (
            <div className="px-4 py-3 border-t bg-card/50">
              <p className="text-xs font-semibold mb-2">Quick Topics:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TOPICS.map((topic) => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTopic(topic.id)}
                    className="text-xs h-8"
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
