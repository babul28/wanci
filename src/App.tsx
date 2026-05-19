import { useState } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { MetadataEditor } from "./components/MetadataEditor";
import { DownloadControls } from "./components/DownloadControls";
import { UploadedPhoto, OverlayMetadata } from "./types";
import { validateLocation, validateTimestamp } from "./utils/validation";

function App() {
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);

  // Default metadata
  const [metadata, setMetadata] = useState<OverlayMetadata>({
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    location: "0.0000° N, 0.0000° E",
    fontSize: 48,
    color: "#ffffff",
    position: "bottom-right",
  });

  const isMetadataValid =
    validateTimestamp(metadata.timestamp).isValid &&
    validateLocation(metadata.location).isValid;

  const resetPhoto = () => {
    setPhoto(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Photo Metadata Editor
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Add timestamps and location data to your photos without losing
            quality.
          </p>
        </div>

        {!photo ? (
          <div className="max-w-2xl mx-auto">
            <ImageUploader onUpload={setPhoto} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <PreviewCanvas photo={photo} metadata={metadata} />
              <div className="flex justify-between items-center">
                <button
                  onClick={resetPhoto}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Upload a different photo
                </button>
                <div className="text-sm text-gray-500">
                  {photo.name} • {(photo.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <MetadataEditor metadata={metadata} onChange={setMetadata} />

              {isMetadataValid ? (
                <DownloadControls photo={photo} metadata={metadata} />
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Please fix the errors in the overlay settings before
                    exporting.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
