import { useRef, useState } from 'react';
import { Crosshair, ImagePlus, Maximize, ScanSearch, Upload } from 'lucide-react';

interface ImageUploaderProps {
  onFile(f: File): void;
  error?: string | null;
}

const FACTS = [
  { icon: ScanSearch, text: 'Reads capture time and GPS from EXIF' },
  { icon: Crosshair, text: 'Finds where you are in one tap' },
  { icon: Maximize, text: 'Keeps original resolution and format' },
];

export const ImageUploader = ({ onFile, error }: ImageUploaderProps) => {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-10 text-center lg:py-20">
      <div className="flex flex-col items-center gap-3">
        <span className="font-mono text-[15px] text-accent">'26 11 05</span>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-[40px] lg:leading-tight">Put the when and where on your photo.</h1>
        <p className="text-ink-2">Timestamp and location, stamped at full resolution. Your photo never leaves the browser.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className={`flex w-full flex-col items-center gap-3 rounded-[14px] border border-dashed px-6 py-12 transition-colors ${
          over ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-surface-2 text-ink-2">
          <ImagePlus className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-[17px] font-medium">Drop a photo here</p>
        <p className="text-[13px] text-ink-3">JPEG or PNG, any size</p>
        <button type="button" className="btn-primary mt-2" onClick={() => input.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden />
          Choose photo
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>

      <ul className="flex flex-col gap-3 text-[13px] text-ink-2 sm:flex-row sm:gap-8">
        {FACTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
};
