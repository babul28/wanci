import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { OverlayMetadata, SectionId, UploadedPhoto } from '../types';
import { BLOCK_REASON, BLOCK_SECTION, exportBlocker } from '../utils/exportGate';
import { processImage } from '../utils/imageProcessing';

interface ExportButtonProps {
  photo: UploadedPhoto;
  metadata: OverlayMetadata;
  onBlocked(section: SectionId): void;
  fullWidth?: boolean;
}

export const ExportButton = ({ photo, metadata, onBlocked, fullWidth }: ExportButtonProps) => {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false); // guards a double click that lands before the re-render
  const block = exportBlocker(metadata);

  const run = async () => {
    if (busyRef.current || block) return;
    busyRef.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const result = await processImage(photo, metadata);
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(result.downloadUrl), 1000); // let the download start first
    } catch (error) {
      console.error('Failed to export image:', error);
      setFailed(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const note = block ? (
    <button type="button" onClick={() => onBlocked(BLOCK_SECTION[block])} className="text-xs text-accent underline-offset-2 hover:underline">
      {BLOCK_REASON[block]}
    </button>
  ) : failed ? (
    <span role="alert" className="text-xs text-danger">Export failed. Try again.</span>
  ) : null;

  return (
    <div className={fullWidth ? 'flex flex-col-reverse items-center gap-2' : 'flex items-center gap-3'}>
      {note}
      <button type="button" onClick={run} disabled={!!block || busy} className={`btn-primary ${fullWidth ? 'h-11 w-full' : ''}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        {busy ? 'Exporting…' : `Export ${photo.type === 'image/png' ? 'PNG' : 'JPG'}`}
      </button>
    </div>
  );
};
