"use client";

type FadeInProps = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FadeIn({ show, children, className = "" }: FadeInProps) {
  if (!show) return null;

  return (
    <div className={`animate-fade-in ${className}`.trim()}>{children}</div>
  );
}
