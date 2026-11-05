interface SwitchProps {
  checked: boolean;
  onChange(v: boolean): void;
  label: string;
  disabled?: boolean;
}

/** A labelled row with a toggle on the right. */
export const Switch = ({ checked, onChange, label, disabled }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-3 py-1 text-left text-sm text-ink-2 disabled:opacity-50"
  >
    <span>{label}</span>
    <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'}`}>
      <span
        className={`absolute top-1 h-4 w-4 rounded-full transition-all ${checked ? 'left-5 bg-accent-ink' : 'left-1 bg-ink-3'}`}
      />
    </span>
  </button>
);
