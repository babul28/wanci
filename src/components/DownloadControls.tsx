import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { UploadedPhoto, OverlayMetadata } from '../types';
import { processImage } from '../utils/imageProcessing';

interface DownloadControlsProps {
  photo: UploadedPhoto;
  metadata: OverlayMetadata;
}

export const DownloadControls: React.FC<DownloadControlsProps> = ({ photo, metadata }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const result = await processImage(photo, metadata);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Wait a bit before revoking the URL to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(result.downloadUrl);
      }, 1000);
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full mt-6 flex justify-center">
      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Download Edited Photo
          </>
        )}
      </button>
    </div>
  );
};
