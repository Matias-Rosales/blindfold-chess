import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANTS = {
  primary:
    "bg-primary text-white uppercase tracking-wide shadow-sm hover:brightness-110 dark:bg-primary-dk",
  secondary:
    "border border-line bg-linear-to-b from-[#fafafa] to-[#ebebeb] text-strong shadow-sm hover:from-white hover:to-[#f2f2f2] dark:border-line-dk dark:from-[#3c3934] dark:to-[#33312e] dark:text-strong-dk dark:hover:from-[#46423c] dark:hover:to-[#3a3733]",
  ghost:
    "text-primary hover:bg-primary/10 dark:text-primary-dk dark:hover:bg-primary-dk/10",
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm font-semibold transition disabled:cursor-default disabled:opacity-45 disabled:hover:brightness-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
