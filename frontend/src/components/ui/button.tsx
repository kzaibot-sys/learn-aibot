"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent)] text-white shadow-[0_12px_30px_-18px_rgba(15,118,110,0.75)] hover:bg-[var(--accent-strong)] hover:shadow-[0_18px_34px_-20px_rgba(15,118,110,0.8)]",
        outline:
          "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] shadow-sm hover:border-[var(--line-strong)] hover:bg-[var(--soft)]",
        ghost:
          "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--soft)] hover:text-[var(--text)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-5",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
