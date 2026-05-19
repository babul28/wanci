import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { UploadedPhoto } from '../types';

interface ImageUploaderProps {
  onUpload: (photo: UploadedPhoto) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('Please upload a valid JPEG or PNG image.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const srcUrl = URL.createObjectURL(file);
      
      onUpload({
        file,
        name: file.name,
        type: file.type as 'image/jpeg' | 'image/png',
        width: bitmap.width,
        height: bitmap.height,
        size: file.size,
        srcUrl,
        bitmap
      });
    } catch (err) {
      setError('Failed to process image. Please try another file.');
      console.error(err);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Click to upload photo</p>
        <p className="text-gray-400 text-sm">Supports JPEG, PNG</p>
        <input 
          type="file"
          accept="image/jpeg, image/png"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
};
