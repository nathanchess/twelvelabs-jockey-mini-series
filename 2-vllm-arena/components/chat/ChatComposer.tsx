"use client";

import { useState } from "react";
import { StrandButton } from "@/components/strand/StrandButton";
import { StrandIcon } from "@/components/strand/StrandIcon";

type ChatComposerProps = {
  onSend: (prompt: string) => void;
  disabled?: boolean;
};

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 bg-surface px-6 py-4"
    >
      <div className="rainbow-input-wrap min-h-[44px] min-w-0 flex-1">
        <div className="flex min-h-[44px] items-center rounded-full bg-surface px-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe what you want to know about the videos…"
            disabled={disabled}
            className="min-h-[40px] w-full bg-transparent text-sm font-medium text-text-primary placeholder:font-normal placeholder:text-text-tertiary disabled:opacity-50"
          />
        </div>
      </div>
      <StrandButton
        type="submit"
        variant="black"
        size="medium"
        disabled={disabled}
        className="h-11 shrink-0 gap-2 px-5"
      >
        Send
        <StrandIcon name="arrow-box-right" className="h-4 w-4" />
      </StrandButton>
    </form>
  );
}
