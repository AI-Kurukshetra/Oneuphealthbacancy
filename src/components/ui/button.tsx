"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "ghost" | "outline" | "primary";
};

export function Button({ children, className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  const variantClassName =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      : variant === "ghost"
        ? "bg-transparent text-slate-700 hover:bg-slate-100"
        : "bg-cyan-700 text-white hover:bg-cyan-800";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClassName} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
