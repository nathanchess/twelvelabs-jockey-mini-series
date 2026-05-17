import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant =
  | "black"
  | "white"
  | "gray"
  | "black-outline"
  | "white-outline"
  | "highlight";

type ButtonSize = "small" | "regular" | "medium" | "large";

const variantClasses: Record<ButtonVariant, string> = {
  black:
    "bg-brand-charcoal text-brand-white hover:bg-brand-grey hover:text-brand-charcoal border border-transparent",
  white:
    "bg-surface text-text-primary border border-border-light hover:bg-brand-grey hover:text-brand-charcoal",
  gray: "bg-card text-text-primary hover:bg-border hover:text-text-primary border border-transparent",
  "black-outline":
    "bg-transparent text-text-primary border border-brand-charcoal hover:bg-brand-grey hover:text-brand-charcoal",
  "white-outline":
    "bg-transparent text-text-secondary border border-border hover:bg-card hover:text-text-primary",
  highlight:
    "bg-product-generate text-brand-charcoal border border-transparent hover:bg-product-generate-light hover:text-brand-charcoal",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-7 px-2 text-sm rounded-md gap-1 hover:rounded-lg",
  regular: "h-8 px-3 text-base rounded-[9.6px] gap-1 hover:rounded-lg",
  medium: "h-10 px-[18px] text-lg rounded-lg gap-1 hover:rounded-xl",
  large: "h-12 px-[18px] text-h5 rounded-xl gap-2 hover:rounded-[20px]",
};

type StrandButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function StrandButton({
  variant = "black",
  size = "regular",
  href,
  external,
  className = "",
  children,
  onClick,
  type = "button",
  disabled,
}: StrandButtonProps) {
  const classes = [
    "inline-flex items-center justify-center font-system font-medium",
    "transition-[background-color,border-radius,color] duration-200 ease-in-out",
    variantClasses[variant],
    sizeClasses[size],
    disabled ? "opacity-50 pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
