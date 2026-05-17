"use client";

import { useEffect, useState } from "react";

type StrandIconProps = {
  name: string;
  className?: string;
  label?: string;
};

export function StrandIcon({
  name,
  className = "h-4 w-4",
  label,
}: StrandIconProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/strand/icons/${name}.svg`)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (!cancelled && text) setSvg(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!svg) {
    return (
      <span
        className={`inline-block shrink-0 rounded-sm bg-border-light ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
