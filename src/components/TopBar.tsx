import { ReactNode, useRef } from "react";
import { Github, Image as ImageIcon, RefreshCw } from "lucide-react";
import { UploadedPhoto } from "../types";

interface TopBarProps {
  photo: UploadedPhoto | null;
  onFile(f: File): void;
  onReset(): void;
  exportSlot?: ReactNode;
}

export const TopBar = ({ photo, onFile, onReset, exportSlot }: TopBarProps) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-bg px-4 lg:col-span-2 lg:px-6">
      <div className="flex items-center gap-2">
        <img src="/icon-192.png" alt="wanci" className="h-7 w-7" />
        <span className="font-mono font-medium tracking-tight">wanci</span>
      </div>
      {photo && (
        <div className="hidden min-w-0 items-center gap-2 border-l border-line pl-4 text-sm lg:flex">
          <ImageIcon className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
          <span className="truncate">{photo.name}</span>
          <span className="whitespace-nowrap font-mono text-xs text-ink-3">
            {photo.width} × {photo.height} ·{" "}
            {(photo.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
            {photo.type === "image/png" ? "PNG" : "JPEG"}
          </span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <a
          href="https://github.com/babul28/wanci"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className="btn-ghost px-2"
        >
          <Github className="h-4 w-4" aria-hidden />
        </a>
        {photo && (
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => input.current?.click()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Replace photo</span>
            </button>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn-ghost" onClick={onReset}>
              Reset
            </button>
            {exportSlot}
          </>
        )}
      </div>
    </header>
  );
};
