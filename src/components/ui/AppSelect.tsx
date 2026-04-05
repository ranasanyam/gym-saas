// src/components/ui/AppSelect.tsx
// Dark-themed select component using Radix UI — replaces raw <select> across owner pages.
// Options render in a custom dark dropdown, consistent with the app's dark theme.

"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface AppSelectProps {
  value:       string
  onChange:    (value: string) => void
  options:     SelectOption[]
  placeholder?: string
  className?:  string
  disabled?:   boolean
}

const APP_SELECT_EMPTY_VALUE = "__appselect_empty_value__"

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
}: AppSelectProps) {
  const normalizedOptions = options.map((opt, index) => ({
    ...opt,
    value: opt.value === "" ? `${APP_SELECT_EMPTY_VALUE}:${index}` : opt.value,
  }))

  const normalizedValue = value === ""
    ? normalizedOptions.find(opt => opt.value.startsWith(`${APP_SELECT_EMPTY_VALUE}:`))?.value ?? value
    : value

  return (
    <SelectPrimitive.Root
      value={normalizedValue}
      onValueChange={val => onChange(val.startsWith(`${APP_SELECT_EMPTY_VALUE}:`) ? "" : val)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "relative flex items-center justify-between gap-2 w-full",
          "px-3 py-2 rounded-xl text-sm",
          "bg-white/5 border border-white/10 text-white",
          "hover:bg-white/8 hover:border-white/15 transition-all",
          "focus:outline-none focus:ring-1 focus:ring-white/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "[&>span]:line-clamp-1 [&>span]:text-left",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={
          <span className="text-white/30">{placeholder}</span>
        } />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[var(--radix-select-trigger-width)] max-h-64 overflow-hidden",
            "rounded-xl border border-white/10 shadow-xl",
            "bg-[hsl(220_25%_10%)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-white/30">
            <ChevronDown className="w-3 h-3 rotate-180" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {normalizedOptions.map(opt => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer select-none",
                  "text-white/70 outline-none transition-colors",
                  "data-[highlighted]:bg-white/8 data-[highlighted]:text-white",
                  "data-[state=checked]:text-white data-[state=checked]:font-medium",
                  "data-[disabled]:opacity-40 data-[disabled]:pointer-events-none",
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-white/30">
            <ChevronDown className="w-3 h-3" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
