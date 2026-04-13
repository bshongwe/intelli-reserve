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
  category: "bookings" | "analytics" | "profile" | "services" | "payments" | "general";
  question: string;
  answer: string;
  keywords: string[];
}

const FAQ_DATA: FAQItem[] = [
  // Bookings FAQs
  {
    id: "booking-1",
    category: "bookings",
    question: "How do I view my bookings?",
    answer: "Click 'Book Now' from the sidebar to see available services and view your booking history. For hosts, go to 'Host Dashboard' to see pending and confirmed bookings.",
    keywords: ["booking", "view", "history", "pending", "confirmed"],
  },
  {
    id: "booking-2",
    category: "bookings",
    question: "How do I confirm or reject a booking?",
    answer: "As a host, go to Host Dashboard → Pending Bookings. Click the booking to see details, then use the 'Confirm' or 'Reject' buttons. You can also add notes or request reschedule.",
    keywords: ["confirm", "reject", "approve", "decision", "accept"],
  },
  {
    id: "booking-3",
    category: "bookings",
    question: "Can I cancel a booking after confirming it?",
    answer: "Yes, you can cancel confirmed bookings with at least 24 hours notice. Go to your booking and click 'Cancel'. Clients receive a refund within 3-5 business days.",
    keywords: ["cancel", "cancellation", "refund", "withdraw"],
  },
  {
    id: "booking-4",
    category: "bookings",
    question: "What's the status of my current bookings?",
    answer: "Check 'Book Now' (for clients) or 'Host Dashboard' (for hosts). Booking statuses include:\n• Pending: Awaiting host confirmation\n• Confirmed: Approved and scheduled\n• Completed: Service finished\n• Cancelled: Booking cancelled",
    keywords: ["status", "state", "pending", "confirmed", "completed"],
  },

  // Analytics FAQs
  {
    id: "analytics-1",
    category: "analytics",
    question: "Where can I view my analytics?",
    answer: "Click 'Analytics' in the sidebar to access your dashboard. You'll see:\n• Booking statistics\n• Revenue trends\n• Occupancy rates\n• Customer ratings\n• Performance metrics",
    keywords: ["analytics", "dashboard", "metrics", "reports", "statistics"],
  },
  {
    id: "analytics-2",
    category: "analytics",
    question: "How do I export my analytics report?",
    answer: "From the Analytics page, click the 'Export' button in the top right. Choose your format (PDF or CSV) and date range. The report will download to your computer.",
    keywords: ["export", "report", "download", "pdf", "csv"],
  },
  {
    id: "analytics-3",
    category: "analytics",
    question: "What does 'occupancy rate' mean?",
    answer: "Occupancy rate is the percentage of your available time slots that are booked. For example, 75% occupancy means 3 out of 4 available slots are reserved. Higher occupancy = better utilization.",
    keywords: ["occupancy", "rate", "percentage", "available", "utilization"],
  },
  {
    id: "analytics-4",
    category: "analytics",
    question: "Can I filter analytics by date range?",
    answer: "Yes! Use the date range selector at the top of the Analytics page. Select 'This Month', 'Last 30 Days', 'Custom' or other options. Data updates in real-time.",
    keywords: ["filter", "date", "range", "period", "custom"],
  },

  // Profile FAQs
  {
    id: "profile-1",
    category: "profile",
    question: "How do I update my profile information?",
    answer: "Go to 'Profile' in the sidebar. Click 'Edit' to update:\n• Full name\n• Email\n• Phone number\n• Bio/description\n• Business name (for hosts)\n• Profile picture\nClick 'Save' when done.",
    keywords: ["profile", "update", "edit", "change", "information"],
  },
  {
    id: "profile-2",
    category: "profile",
    question: "Can I change my profile picture?",
    answer: "Yes! Go to Profile → Edit. Click 'Change Photo' to upload a new picture. We accept JPG, PNG, and GIF files up to 5MB. Recommended size: 400×400px.",
    keywords: ["picture", "photo", "avatar", "image", "upload"],
  },
  {
    id: "profile-3",
    category: "profile",
    question: "How do I verify my account or add a badge?",
    answer: "Account verification is managed through our Verification Center. Submit your documents (ID, business registration, etc.) for manual review. Approval takes 3-5 business days. Verified accounts get a special badge.",
    keywords: ["verify", "verification", "badge", "certified", "authentic"],
  },
  {
    id: "profile-4",
    category: "profile",
    question: "Can I have multiple profiles?",
    answer: "Currently, each email can only have one active profile. If you need multiple profiles (e.g., personal and business), contact our support team at support@intellireserve.com.",
    keywords: ["multiple", "profiles", "accounts", "separate"],
  },

  // Services FAQs (for hosts)
  {
    id: "services-1",
    category: "services",
    question: "How do I add a new service?",
    answer: "As a host, go to 'My Services' in the sidebar. Click 'Add Service' and fill in:\n• Service name\n• Description\n• Category\n• Duration\n• Base price\n• Max participants\nClick 'Save' to publish.",
    keywords: ["service", "add", "create", "new", "publish"],
  },
  {
    id: "services-2",
    category: "services",
    question: "How do I manage my service availability?",
    answer: "Go to 'My Services' → Click your service → 'Manage Availability'. Set your working hours, days off, and time slots. You can also set different prices for different time periods.",
    keywords: ["availability", "time", "slot", "schedule", "hours"],
  },
  {
    id: "services-3",
    category: "services",
    question: "Can I pause a service temporarily?",
    answer: "Yes! Go to 'My Services', select the service, and click 'Pause Service'. Existing bookings remain active, but new bookings cannot be made. Unpause anytime to resume.",
    keywords: ["pause", "pause service", "stop", "suspend", "inactive"],
  },
  {
    id: "services-4",
    category: "services",
    question: "What categories are available for services?",
    answer: "IntelliReserve supports:\n• Photography\n• Consulting\n• Workshop\n• Coaching\n• Maintenance\n• Other\nChoose the category that best matches your service.",
    keywords: ["category", "type", "service type", "classification"],
  },

  // Payments FAQs
  {
    id: "payment-1",
    category: "payments",
    question: "How do payments work on IntelliReserve?",
    answer: "When a booking is confirmed:\n1. Client pays upfront\n2. Payment held in secure escrow\n3. Service is completed\n4. Payment released to host (minus platform fee)\nPayment is secure and protected by escrow.",
    keywords: ["payment", "pay", "how payment works", "escrow", "transaction"],
  },
  {
    id: "payment-2",
    category: "payments",
    question: "When do I receive my payout?",
    answer: "Payouts are processed within 3-5 business days after the booking is marked as completed. Check your bank account or the 'Earnings' section in your Profile for transaction history.",
    keywords: ["payout", "earning", "withdraw", "receive", "transfer"],
  },
  {
    id: "payment-3",
    category: "payments",
    question: "What's the platform fee?",
    answer: "IntelliReserve charges a 5% platform fee on each completed booking. This covers:\n• Secure payment processing\n• Customer support\n• Platform maintenance\n• Fraud protection",
    keywords: ["fee", "commission", "charge", "percentage", "cost"],
  },
  {
    id: "payment-4",
    category: "payments",
    question: "How do I update my payout method?",
    answer: "Go to Settings → Payment Methods. Add or update your:\n• Bank account (EFT)\n• Card details\n• Digital wallet\nEnsure your account name matches your IntelliReserve profile.",
    keywords: ["payout", "method", "bank", "account", "update"],
  },

  // General Dashboard FAQs
  {
    id: "general-1",
    category: "general",
    question: "How do I navigate the dashboard?",
    answer: "The sidebar on the left contains all main sections:\n• Book Now - Browse and book services\n• Host Dashboard - Manage your bookings\n• My Services - Create and manage services\n• Analytics - View performance metrics\n• Profile - Update your information\n• Settings - Configure preferences",
    keywords: ["navigate", "menu", "sidebar", "sections", "help"],
  },
  {
    id: "general-2",
    category: "general",
    question: "Can I switch between Host and Client modes?",
    answer: "Your account is created as either Host or Client (set during signup). To switch roles, you need a separate account. Contact support at support@intellireserve.com if you need assistance.",
    keywords: ["switch", "mode", "host", "client", "role"],
  },
  {
    id: "general-3",
    category: "general",
    question: "How do I change my dashboard theme?",
    answer: "Click the theme toggle button in the top right of your dashboard header. Choose between Light Mode and Dark Mode. Your preference is saved automatically.",
    keywords: ["theme", "dark", "light", "mode", "appearance"],
  },
  {
    id: "general-4",
    category: "general",
    question: "What should I do if I encounter a technical issue?",
    answer: "Try these steps:\n1. Refresh the page (F5)\n2. Clear browser cache\n3. Try a different browser\n4. Log out and log back in\nIf issues persist, contact support@intellireserve.com with a description and screenshot.",
    keywords: ["issue", "problem", "error", "bug", "technical"],
  },
];

const QUICK_TOPICS = [
  { id: "bookings", label: "Bookings", icon: "📅" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "services", label: "Services", icon: "🔧" },
  { id: "payments", label: "Payments", icon: "💰" },
];

export function DashboardAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! 👋 I'm your Dashboard Assistant. I can help you with:\n\n• Managing bookings\n• Viewing analytics & reports\n• Managing services (for hosts)\n• Payment & payout info\n• Profile and settings\n• General navigation\n\nWhat would you like help with?",
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

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      const faq = findRelevantFAQ(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: faq
          ? faq.answer
          : "I'm not sure about that. Try selecting one of the quick topics or rephrase your question. You can also reach out to support@intellireserve.com for more detailed help.",
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
          title="Open Dashboard Assistant"
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
                <CardTitle className="text-sm">Dashboard Assistant</CardTitle>
                <CardDescription className="text-xs">Here to guide you</CardDescription>
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
