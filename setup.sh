#!/bin/bash
mkdir -p src/styles src/components src/utils src/types tests/unit tests/integration

cat << 'EOF' > package.json
{
  "name": "photo-metadata-editor",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.378.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.3.4",
    "vitest": "^2.0.2",
    "@testing-library/react": "^16.0.0",
    "jsdom": "^24.1.0"
  }
}
EOF

npm install

cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
EOF

cat << 'EOF' > vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  }
});
EOF

cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat << 'EOF' > postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat << 'EOF' > index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Photo Metadata Editor</title>
  </head>
  <body class="bg-gray-50 text-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat << 'EOF' > src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat << 'EOF' > src/App.tsx
import React from 'react';

function App() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Photo Metadata Editor</h1>
    </div>
  );
}

export default App;
EOF

cat << 'EOF' > src/styles/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
  }
}
EOF

cat << 'EOF' > src/types/index.ts
export interface UploadedPhoto {
  file: File;
  name: string;
  type: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  size: number;
  srcUrl: string;
  bitmap?: ImageBitmap;
}

export interface OverlayMetadata {
  timestamp: string;
  location: string;
  fontSize: number;
  color: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export interface ExportResult {
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  mimeType: string;
}
EOF

cat << 'EOF' > src/utils/imageProcessing.ts
// imageProcessing.ts placeholder
export {};
EOF

cat << 'EOF' > src/utils/validation.ts
// validation.ts placeholder
export {};
EOF

cat << 'EOF' > src/components/ImageUploader.tsx
import React from 'react';

export const ImageUploader: React.FC = () => {
  return <div>ImageUploader</div>;
};
EOF

cat << 'EOF' > src/components/MetadataEditor.tsx
import React from 'react';

export const MetadataEditor: React.FC = () => {
  return <div>MetadataEditor</div>;
};
EOF

cat << 'EOF' > src/components/PreviewCanvas.tsx
import React from 'react';

export const PreviewCanvas: React.FC = () => {
  return <div>PreviewCanvas</div>;
};
EOF

cat << 'EOF' > src/components/DownloadControls.tsx
import React from 'react';

export const DownloadControls: React.FC = () => {
  return <div>DownloadControls</div>;
};
EOF
