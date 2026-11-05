import { Plus } from 'lucide-react';
import { OverlayMetadata, Patch } from '../types';
import { Switch } from './ui/Switch';

interface StyleSectionProps {
  metadata: OverlayMetadata;
  onChange(patch: Patch): void;
  keepSettings: boolean;
  onKeepSettings(v: boolean): void;
}

const CORNERS: { value: OverlayMetadata['position']; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
];
const SWATCHES = ['#FF7A1A', '#FFFFFF', '#FFD84D'];

export const StyleSection = ({ metadata, onChange, keepSettings, onKeepSettings }: StyleSectionProps) => {
  const color = metadata.color.toUpperCase();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="section-title">Overlay style</h2>
      <div className="flex gap-5">
        <div role="radiogroup" aria-label="Position" className="grid h-[104px] w-[140px] shrink-0 grid-cols-2 gap-1 rounded-[10px] border border-line bg-bg p-2">
          {CORNERS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={metadata.position === c.value}
              aria-label={c.label}
              onClick={() => onChange({ position: c.value })}
              className={`flex p-1 ${c.value.startsWith('top') ? 'items-start' : 'items-end'} ${c.value.endsWith('left') ? 'justify-start' : 'justify-end'}`}
            >
              <span className={`h-3 w-9 rounded-sm ${metadata.position === c.value ? 'bg-accent' : 'bg-surface-2 hover:bg-line'}`} />
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm text-ink-2">
            <span className="flex justify-between">
              Size <span className="font-mono text-ink">{metadata.fontSize} px</span>
            </span>
            <input
              type="range"
              min={10}
              max={200}
              value={metadata.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="accent-accent"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Color ${s}`}
                aria-pressed={color === s}
                onClick={() => onChange({ color: s })}
                className={`h-7 w-7 rounded-full border-2 ${color === s ? 'border-ink' : 'border-transparent'}`}
                style={{ backgroundColor: s }}
              />
            ))}
            <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-line text-ink-2 hover:text-ink">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              <input
                type="color"
                aria-label="Custom color"
                value={metadata.color.toLowerCase()}
                onChange={(e) => onChange({ color: e.target.value.toUpperCase() })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <span className="font-mono text-xs text-ink-3">{color}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line pt-3">
        <Switch label="Keep settings for next photo" checked={keepSettings} onChange={onKeepSettings} />
      </div>
    </div>
  );
};
