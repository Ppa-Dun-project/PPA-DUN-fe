import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
  delayMs?: number;
}>;

export default function FadeIn({ children, className = "", delayMs = 0 }: Props) {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}