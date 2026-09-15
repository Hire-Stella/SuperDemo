import Link from "next/link";
import type { ReactNode } from "react";

/* The site has exactly two button treatments: a solid black pill-less
   rectangle for the primary action, and a hairline-bordered white one
   for the secondary. Both are 13px, 38px tall. */
type Variant = "primary" | "secondary";

const base =
  "inline-flex h-[38px] items-center justify-center gap-2 px-4 text-[13px] leading-none transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--sg-black)] text-[var(--sg-white)] hover:bg-[#1f1f1f]",
  secondary:
    "sg-hair bg-[var(--sg-white)] text-[var(--sg-text)] hover:bg-[var(--sg-surface)]",
};

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/** Same skin, used where the action submits a form instead of navigating. */
export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
