interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange(v: T): void;
  label: string;
}

export const Segmented = <T extends string>({ value, options, onChange, label }: SegmentedProps<T>) => (
  <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-bg p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={o.value === value}
        disabled={o.disabled}
        onClick={() => onChange(o.value)}
        className={`h-8 flex-1 rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          o.value === value ? 'border border-line bg-surface-2 font-medium text-ink' : 'text-ink-3 hover:text-ink-2'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);
