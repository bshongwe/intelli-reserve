import * as React from "react"

import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success"
  size?: "default" | "sm" | "lg" | "icon"
}

const buttonVariants = (props?: { variant?: string; size?: string }) => {
  const variant = props?.variant || "default"
  const size = props?.size || "default"

  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
  
  const variants = {
    default: "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/50 active:from-blue-800 active:to-blue-900",
    destructive: "bg-gradient-to-b from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/50 active:from-red-800 active:to-red-900",
    outline: "border-2 border-blue-600 bg-background text-blue-600 hover:bg-blue-50 hover:border-blue-700 dark:hover:bg-blue-950 hover:shadow-md active:bg-blue-100 dark:active:bg-blue-900",
    secondary: "bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-md hover:from-slate-700 hover:to-slate-800 hover:shadow-lg hover:shadow-slate-500/50 active:from-slate-800 active:to-slate-900",
    ghost: "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md active:bg-accent/80 border border-transparent hover:border-accent",
    link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline hover:text-blue-700 dark:hover:text-blue-300 font-semibold",
    success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/50 active:from-emerald-700 active:to-emerald-800",
  } as Record<string, string>

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-12 rounded-lg px-6 text-base",
    icon: "h-10 w-10 p-0",
  } as Record<string, string>

  return cn(baseStyles, variants[variant], sizes[size])
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
