'use client';

import * as React from 'react';
import * as Select from '@radix-ui/react-select';

type Option = { value: string; label: string };

export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className = '', // <- no fixed width here
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string; // allow passing grid/span classes from parent
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={[
          // let the parent decide the width; fill it
          'w-full inline-flex items-center justify-between rounded-md',
          'border border-white/10 bg-zinc-900 text-zinc-100',
          'px-3 py-2 text-sm shadow-sm hover:bg-zinc-800',
          // keep focus inside the box; no OS outline
          'outline-none focus:outline-none focus-visible:outline-none',
          'focus:ring-1 focus:ring-blue-500 ring-inset focus:ring-offset-0 focus:shadow-none',
          'focus:border-blue-500',
          'appearance-none',
          'min-w-0', // allow shrinking inside grid cell
          className,
        ].join(' ')}
        aria-label={placeholder}
      >
        <Select.Value placeholder={placeholder} />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden
          className="ml-2 opacity-80 shrink-0"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 rounded-md border border-white/10 bg-zinc-900 text-zinc-100 shadow-xl"
        >
          {/* make dropdown at least as wide as the trigger */}
          <Select.Viewport className="p-1 min-w-[var(--radix-select-trigger-width)]">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({ children, value }: React.PropsWithChildren<{ value: string }>) {
  return (
    <Select.Item
      value={value}
      className={[
        'relative flex cursor-pointer select-none items-center rounded',
        'px-3 py-2 text-sm outline-none',
        'data-[highlighted]:bg-zinc-800 data-[highlighted]:text-white',
      ].join(' ')}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </Select.ItemIndicator>
    </Select.Item>
  );
}
