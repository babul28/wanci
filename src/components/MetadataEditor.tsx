import React, { useState, useEffect } from "react";
import { OverlayMetadata } from "../types";
import { validateTimestamp, validateLocation } from "../utils/validation";

interface MetadataEditorProps {
  metadata: OverlayMetadata;
  onChange: (metadata: OverlayMetadata) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  onChange,
}) => {
  const [timestampError, setTimestampError] = useState<string | undefined>();
  const [locationError, setLocationError] = useState<string | undefined>();

  // Validate on change
  useEffect(() => {
    const tsValidation = validateTimestamp(metadata.timestamp);
    setTimestampError(tsValidation.error);

    const locValidation = validateLocation(metadata.location);
    setLocationError(locValidation.error);
  }, [metadata.timestamp, metadata.location]);

  const handleChange = (
    field: keyof OverlayMetadata,
    value: string | number,
  ) => {
    onChange({
      ...metadata,
      [field]: value,
    });
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
        Overlay Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timestamp
          </label>
          <input
            type="text"
            value={metadata.timestamp}
            onChange={(e) => handleChange("timestamp", e.target.value)}
            placeholder="e.g. 2026-05-19 14:30:00"
            className={`w-full px-3 py-2 h-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              timestampError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {timestampError && (
            <p className="mt-1 text-sm text-red-500">{timestampError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={metadata.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="e.g. 40.7128° N, 74.0060° W"
            className={`w-full px-3 py-2 h-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              locationError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {locationError && (
            <p className="mt-1 text-sm text-red-500">{locationError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              value={metadata.position}
              onChange={(e) => handleChange("position", e.target.value as any)}
              className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Size (px)
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={metadata.fontSize}
              onChange={(e) =>
                handleChange("fontSize", parseInt(e.target.value) || 24)
              }
              className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={metadata.color}
              onChange={(e) => handleChange("color", e.target.value)}
              className="h-8 w-14 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600 uppercase font-mono">
              {metadata.color}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
