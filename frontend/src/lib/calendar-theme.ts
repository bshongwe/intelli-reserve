/**
 * Calendar Theme Configuration
 * 
 * This centralized configuration ensures consistent calendar styling across the platform
 * and makes it easy to:
 * - Update colors globally without touching component code
 * - Create alternative themes (e.g., dark mode, accessibility mode)
 * - A/B test different visual hierarchies
 * - Maintain brand consistency as the platform grows
 */

export const CALENDAR_THEME = {
  // Weekday header styling
  weekdayHeader: {
    light: "bg-blue-100 text-blue-900 border-blue-200",
    dark: "dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700",
  },

  // Month/Year caption styling
  caption: {
    container: "bg-white dark:bg-slate-900 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700",
    label: "text-base font-bold text-slate-900 dark:text-white",
  },

  // Navigation buttons (previous/next month)
  navigation: {
    button: "text-white bg-blue-600 hover:bg-blue-700 h-8 w-8",
    icon: "text-white",
  },

  // Day cells - the main interactive elements
  dayCell: {
    // Base state - visible at all times (no hover needed)
    base: "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600",
    
    // Hover/focus state - indicates interactivity
    interactive: "hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-slate-600 hover:shadow-md hover:scale-105 active:scale-95 active:shadow-lg",
    
    // Disabled state - grayed out, not clickable
    disabled: "opacity-50 cursor-not-allowed hover:scale-100",
    
    // Outside current month - subtle appearance
    outside: "text-slate-400 dark:text-slate-500 opacity-50",
  },

  // Selected date styling
  selected: {
    background: "bg-gradient-to-b from-emerald-500 to-emerald-600",
    text: "text-white font-bold",
    border: "border-2 border-emerald-600 dark:border-emerald-400",
    shadow: "shadow-lg shadow-emerald-500/50",
    interactive: "hover:shadow-xl hover:shadow-emerald-600/70 hover:scale-110 active:scale-95 active:shadow-2xl transition-all",
  },

  // Today's date styling
  today: {
    background: "bg-gradient-to-b from-amber-400 to-amber-500",
    text: "text-white font-bold",
    border: "border-2 border-amber-500",
    ring: "ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900",
    interactive: "hover:shadow-lg hover:shadow-amber-500/60 hover:scale-110 active:scale-95 active:shadow-xl transition-all",
  },
} as const;

/**
 * Accessibility Theme - High contrast for users with visual impairments
 * Can be toggled via user preferences
 */
export const CALENDAR_THEME_ACCESSIBLE = {
  ...CALENDAR_THEME,
  dayCell: {
    ...CALENDAR_THEME.dayCell,
    base: "bg-white dark:bg-slate-900 text-black dark:text-white border-4 border-black dark:border-white font-bold",
    interactive: "hover:bg-yellow-300 dark:hover:bg-yellow-600 hover:border-black dark:hover:border-white hover:scale-110 active:scale-95",
  },
  selected: {
    ...CALENDAR_THEME.selected,
    background: "bg-green-600 dark:bg-green-700",
    text: "text-white font-bold",
    border: "border-4 border-green-800 dark:border-green-300",
    shadow: "shadow-2xl shadow-green-600/70",
    interactive: "hover:bg-green-700 dark:hover:bg-green-800 hover:shadow-2xl hover:scale-110 active:scale-95 active:shadow-2xl transition-all",
  },
  today: {
    background: "bg-amber-600 dark:bg-amber-700",
    text: "text-white font-bold",
    border: "border-4 border-amber-800 dark:border-amber-300",
    ring: "ring-4 ring-amber-700 ring-offset-2 dark:ring-offset-slate-900",
    interactive: "hover:bg-amber-700 dark:hover:bg-amber-800 hover:shadow-2xl hover:scale-110 active:scale-95 active:shadow-2xl transition-all",
  },
} as const;

export type CalendarTheme = typeof CALENDAR_THEME;
