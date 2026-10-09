"use client";

import { Input } from "@/components/ui/input";

interface ProjectNameFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ProjectNameField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  autoFocus,
}: ProjectNameFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-copy-secondary">
        {label}
      </label>
      {/* shadcn Input's `text-base` resolves to the bg-base color here, so set the text color explicitly. */}
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        className="h-9 text-copy-primary"
      />
    </div>
  );
}
