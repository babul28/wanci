import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PreviewCanvas } from './components/PreviewCanvas';
import { TopBar } from './components/TopBar';
import { ExportButton } from './components/ExportButton';
import { Inspector } from './components/Inspector';
import { TimestampSection } from './components/TimestampSection';
import { LocationSection } from './components/LocationSection';
import { StyleSection } from './components/StyleSection';
import { MapPickerModal } from './components/MapPickerModal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { usePlaceName } from './hooks/usePlaceName';
import { OverlayMetadata, Patch, SectionId, UploadedPhoto } from './types';
import { carryOver, defaultMetadata } from './utils/metadata';
import { loadPhoto } from './utils/loadPhoto';

const KEEP_KEY = 'stamp.keepSettings';

const readKeep = () => {
  try {
    return localStorage.getItem(KEEP_KEY) !== 'false';
  } catch {
    return true;
  }
};

function App() {
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [metadata, setMetadata] = useState<OverlayMetadata>(() => defaultMetadata(undefined, new Date()));
  const [keepSettings, setKeepSettings] = useState(readKeep);
  const [activeSection, setActiveSection] = useState<SectionId>('location');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const placeStatus = usePlaceName(metadata.location, (n) => setMetadata((m) => ({ ...m, placeName: n })));

  const patch = (p: Patch) => setMetadata((m) => ({ ...m, ...p }));

  const handleFile = async (f: File) => {
    setUploadError(null);
    try {
      const p = await loadPhoto(f);
      const now = new Date();
      setMetadata((prev) => (photo && keepSettings ? carryOver(prev, p.exif, now) : defaultMetadata(p.exif, now)));
      setPhoto(p);
      if (photo) {
        URL.revokeObjectURL(photo.srcUrl);
        photo.bitmap?.close();
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    }
  };

  const changeKeep = (v: boolean) => {
    setKeepSettings(v);
    try {
      localStorage.setItem(KEEP_KEY, String(v));
    } catch {
      // ponytail: storage blocked (private mode); the choice lasts for this session only
    }
  };

  const onBlocked = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView?.({ block: 'start' });
  };

  if (!photo) {
    return (
      <div className="min-h-[100dvh]">
        <TopBar photo={null} onFile={handleFile} onReset={() => {}} />
        <ImageUploader onFile={handleFile} error={uploadError} />
      </div>
    );
  }

  const exportButton = <ExportButton photo={photo} metadata={metadata} onBlocked={onBlocked} fullWidth={!isDesktop} />;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_380px] lg:grid-rows-[56px_1fr]">
      <TopBar
        photo={photo}
        onFile={handleFile}
        onReset={() => setMetadata(defaultMetadata(photo.exif, new Date()))}
        exportSlot={isDesktop ? exportButton : undefined}
      />
      {uploadError && (
        <p role="alert" className="bg-danger/10 px-4 py-2 text-sm text-danger lg:col-span-2">{uploadError}</p>
      )}
      <main className="h-[40vh] shrink-0 lg:h-auto lg:min-h-0">
        <PreviewCanvas photo={photo} metadata={metadata} />
      </main>
      <Inspector
        active={activeSection}
        onTab={setActiveSection}
        sections={[
          { id: 'time', label: 'Time', node: <TimestampSection metadata={metadata} capturedAt={photo.exif?.capturedAt} onChange={patch} /> },
          { id: 'location', label: 'Location', node: (
              <LocationSection metadata={metadata} onChange={patch} placeStatus={placeStatus} onOpenPicker={() => setPickerOpen(true)} />
            ),
          },
          {
            id: 'style',
            label: 'Style',
            node: <StyleSection metadata={metadata} onChange={patch} keepSettings={keepSettings} onKeepSettings={changeKeep} />,
          },
        ]}
      />
      {!isDesktop && <div className="shrink-0 border-t border-line bg-bg p-3">{exportButton}</div>}
      {pickerOpen && (
        <MapPickerModal
          initial={metadata.location}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(p) => {
            patch({ location: p, placeName: null });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
