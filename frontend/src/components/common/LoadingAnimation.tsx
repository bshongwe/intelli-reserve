/**
 * Reusable Loading Animation Component
 * 
 * Displays an orbital animation with 4 orbiting dots, matching the Escrow button style.
 * Can be used for buttons, full-page loading, or inline loading states.
 * 
 * Usage:
 * - In buttons: <LoadingAnimation size="sm" /> with conditional rendering
 * - Full page: <LoadingAnimation size="lg" center />
 * - Inline: <LoadingAnimation size="xs" />
 */

import React from "react";

export interface LoadingAnimationProps {
  /** Size of the animation: xs (16px), sm (24px), md (32px), lg (48px) */
  readonly size?: "xs" | "sm" | "md" | "lg";
  /** Center the animation on the page */
  readonly center?: boolean;
  /** Show text label below animation */
  readonly label?: string;
  /** Text color for label */
  readonly labelClassName?: string;
}

export function LoadingAnimation({
  size = "md",
  center = false,
  label,
  labelClassName = "text-sm text-muted-foreground",
}: Readonly<LoadingAnimationProps>) {
  const sizeMap = {
    xs: { container: 16, dot: 3, radius: 5 },
    sm: { container: 24, dot: 4, radius: 7 },
    md: { container: 32, dot: 5, radius: 10 },
    lg: { container: 48, dot: 6, radius: 14 },
  };

  const config = sizeMap[size];

  const containerClass = center ? "flex flex-col items-center justify-center" : "";

  return (
    <div className={containerClass}>
      <div
        className="relative inline-flex items-center justify-center"
        style={{
          width: `${config.container}px`,
          height: `${config.container}px`,
        }}
      >
        {/* Orbital dots */}
        {[0, 1, 2, 3].map((i) => {
          // Calculate position for each dot (corners of a square)
          let topValue: string | number = "auto";
          let bottomValue: string | number = "auto";
          let leftValue: string | number = "50%";
          let rightValue: string | number = "auto";

          if (i === 2) bottomValue = 0;
          else if (i === 0) topValue = 0;

          if (i === 3) leftValue = 0;
          else if (i === 1) leftValue = "auto";

          if (i === 1) rightValue = 0;

          return (
            <span
              key={i}
              className="absolute rounded-full bg-primary"
              style={{
                width: `${config.dot}px`,
                height: `${config.dot}px`,
                top: topValue,
                bottom: bottomValue,
                left: leftValue,
                right: rightValue,
                transform: "translate(-50%, -50%)",
                animation: `orbit 1.2s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          );
        })}
        <style>{`
          @keyframes orbit {
            0%, 100% { 
              opacity: 0.25; 
              transform: translate(-50%, -50%) scale(0.75); 
            }
            50% { 
              opacity: 1; 
              transform: translate(-50%, -50%) scale(1); 
            }
          }
        `}</style>
      </div>
      {label && <p className={`mt-2 ${labelClassName}`}>{label}</p>}
    </div>
  );
}
