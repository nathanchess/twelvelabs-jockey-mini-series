"use client";

import { useEffect, useId, useRef, useState } from "react";
import { StrandIcon } from "./StrandIcon";

export type SelectOption = {
  id: string;
  label: string;
};

type MinimalSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  align?: "left" | "right";
};

export function MinimalSelect({
  options,
  value,
  onChange,
  className = "",
  align = "left",
}: MinimalSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative ${className.includes("w-full") ? "block w-full" : "inline-block"} ${className}`}
    >
      <button
        type="button"
        className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-border-light bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-[border-radius,background-color] duration-200 hover:rounded-lg hover:bg-card"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label}</span>
        <StrandIcon
          name="arrow-box-down"
          className={`h-3 w-3 text-text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-50 mt-1 min-w-[200px] animate-fade-in rounded-lg border border-border-light bg-surface py-1 shadow-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt) => (
            <li key={opt.id} role="option" aria-selected={opt.id === value}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-card ${
                  opt.id === value
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
