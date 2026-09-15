import type { ReactNode } from "react";

/* The site's single content measure: 1180px with a 28px gutter, both
   read off the live layout and stored as tokens in globals.css. */
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full ${className}`}
      style={{
        maxWidth: "var(--sg-max)",
        paddingLeft: "var(--sg-gutter)",
        paddingRight: "var(--sg-gutter)",
      }}
    >
      {children}
    </div>
  );
}
