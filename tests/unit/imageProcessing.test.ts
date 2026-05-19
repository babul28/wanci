import { describe, it, expect, vi, beforeAll } from 'vitest';
import { processImage } from '../../src/utils/imageProcessing';

beforeAll(() => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
    width: 800,
    height: 600,
    close: vi.fn(),
  }));
  
  const mockUrl = {
    createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
    revokeObjectURL: vi.fn()
  };
  vi.stubGlobal('URL', mockUrl);
  
  HTMLCanvasElement.prototype.toBlob = function(callback: any, type: string) {
    callback(new Blob(['test'], { type }));
  };
  
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
  }) as any;
});

describe('processImage', () => {
  it('should process image and return export result with correct mimeType', async () => {
    const photo: any = {
      file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
      name: 'test.jpg',
      type: 'image/jpeg',
      width: 800,
      height: 600,
      size: 1000,
      srcUrl: 'blob:test',
    };
    
    const metadata: any = {
      timestamp: '2026',
      location: '0,0',
      fontSize: 48,
      color: '#fff',
      position: 'bottom-right',
    };
    
    const result = await processImage(photo, metadata);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.fileName).toBe('test_edited.jpg');
    expect(result.downloadUrl).toBe('blob:test-url');
  });
});
