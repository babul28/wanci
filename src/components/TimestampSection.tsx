import { Calendar, Camera, Info } from 'lucide-react';
import { OverlayMetadata, Patch, TimestampSource } from '../types';
import { normalizeLocalInput, toLocalInput } from '../utils/metadata';
import { Segmented } from './ui/Segmented';

interface TimestampSectionProps {
  metadata: OverlayMetadata;
  capturedAt?: string;
  onChange(patch: Patch): void;
}

export const TimestampSection = ({ metadata, capturedAt, onChange }: TimestampSectionProps) => {
  const source = metadata.timestampSource;

  const pick = (s: TimestampSource) => {
    if (s === 'capture' && capturedAt) onChange({ timestamp: capturedAt, timestampSource: 'capture' });
    else if (s === 'now') onChange({ timestamp: toLocalInput(new Date()), timestampSource: 'now' });
    else if (s === 'custom') onChange({ timestampSource: 'custom' });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Timestamp</h2>
        {source === 'capture' && (
          <span className="flex items-center gap-1.5 text-xs text-ink-3">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            Read from EXIF
          </span>
        )}
      </div>
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          type="datetime-local"
          step="1"
          aria-label="Timestamp"
          value={metadata.timestamp}
          onChange={(e) => onChange({ timestamp: normalizeLocalInput(e.target.value), timestampSource: 'custom' })}
          className="field pl-9"
        />
      </div>
      {!capturedAt && source === 'now' && (
        <p className="flex items-start gap-1.5 text-xs text-ink-2">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          No capture time in photo. Using current time.
        </p>
      )}
      <Segmented<TimestampSource>
        label="Timestamp source"
        value={source}
        onChange={pick}
        options={[
          { value: 'capture', label: 'Capture time', disabled: !capturedAt },
          { value: 'now', label: 'Now' },
          { value: 'custom', label: 'Custom' },
        ]}
      />
    </div>
  );
};
