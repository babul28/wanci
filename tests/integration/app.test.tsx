import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import { processImage } from '../../src/utils/imageProcessing';

import { readExif } from '../../src/services/exif';

vi.mock('../../src/utils/imageProcessing', () => ({ processImage: vi.fn() }));
vi.mock('../../src/services/exif', () => ({ readExif: vi.fn() }));

const FULL_EXIF = { capturedAt: '2026-11-04T14:32:08', gps: { lat: -8.43221, lng: 115.27904 } };

// restoreAllMocks resets vi.fn() implementations, so every stub is (re)installed per test.
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 800, height: 600, close: vi.fn() }));
  vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:test-url'), revokeObjectURL: vi.fn() });
  vi.stubGlobal('matchMedia', undefined); // phone layout
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn(), fillText: vi.fn() }) as any;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {}); // jsdom can't navigate to blob: URLs
  vi.mocked(readExif).mockResolvedValue({});
  vi.mocked(processImage).mockImplementation(async () => ({ blob: new Blob(), downloadUrl: 'blob:out', fileName: 'a_edited.jpg', mimeType: 'image/jpeg' }));
});
afterEach(() => vi.restoreAllMocks());

const upload = (name: string) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['x'], name, { type: 'image/jpeg' })] } });
};
const exportBtn = () => screen.getByRole('button', { name: /Export JPG/ });
const lat = () => screen.getByLabelText('Latitude') as HTMLInputElement;
const lng = () => screen.getByLabelText('Longitude') as HTMLInputElement;
const typeCoords = (a: string, b: string) => {
  fireEvent.change(lat(), { target: { value: a } });
  fireEvent.blur(lat());
  fireEvent.change(lng(), { target: { value: b } });
  fireEvent.blur(lng());
};
const ready = async () => {
  render(<App />);
  upload('a.jpg');
  await waitFor(() => expect(exportBtn()).toBeDisabled());
};

describe('App', () => {
  it('blocks export until a location is typed', async () => {
    await ready();
    expect(screen.getByText('Add a location to export')).toBeInTheDocument();
    expect(screen.getByText('No capture time in photo. Using current time.')).toBeInTheDocument();
    typeCoords('-8,43221', '115.27904');
    await waitFor(() => expect(exportBtn()).toBeEnabled());
  });

  it('blocks when both location lines are off', async () => {
    await ready();
    typeCoords('-8.43221', '115.27904');
    fireEvent.click(screen.getByRole('switch', { name: 'Show coordinates on photo' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Show place name on photo' }));
    expect(screen.getByText('Turn on coordinates or place name')).toBeInTheDocument();
    expect(exportBtn()).toBeDisabled();
  });

  it('clicking the reason switches to the right tab', async () => {
    await ready();
    fireEvent.click(screen.getByRole('tab', { name: 'Time' }));
    expect(document.getElementById('section-location')).toHaveClass('hidden');
    fireEvent.click(screen.getByText('Add a location to export'));
    expect(document.getElementById('section-location')).not.toHaveClass('hidden');
  });

  it('replace keeps settings; Reset clears them', async () => {
    await ready();
    typeCoords('-8,43221', '115.27904');
    upload('b.jpg');
    await waitFor(() => expect(screen.getByText(/b\.jpg/)).toBeInTheDocument());
    expect(lat().value).toBe('-8.43221');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(lat().value).toBe('');
  });

  it('replace starts fresh when Keep settings is off, and the choice persists', async () => {
    await ready();
    typeCoords('-8.43221', '115.27904');
    fireEvent.click(screen.getByRole('switch', { name: 'Keep settings for next photo' }));
    expect(localStorage.getItem('stamp.keepSettings')).toBe('false');
    upload('b.jpg');
    await waitFor(() => expect(screen.getByText(/b\.jpg/)).toBeInTheDocument());
    expect(lat().value).toBe('');
  });

  it('survives localStorage throwing', async () => { // Review Focus 5
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<App />);
    upload('a.jpg');
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Keep settings for next photo' })).toBeChecked());
    fireEvent.click(screen.getByRole('switch', { name: 'Keep settings for next photo' }));
    expect(screen.getByRole('switch', { name: 'Keep settings for next photo' })).not.toBeChecked();
  });

  it('a double click exports once', async () => {
    await ready();
    typeCoords('-8.43221', '115.27904');
    await waitFor(() => expect(exportBtn()).toBeEnabled());
    vi.mocked(processImage).mockClear();
    fireEvent.click(exportBtn());
    fireEvent.click(screen.getByRole('button', { name: /Export JPG|Exporting/ }));
    await waitFor(() => expect(exportBtn()).toBeEnabled());
    expect(processImage).toHaveBeenCalledTimes(1);
  });

  it('fills time and location from EXIF', async () => {
    vi.mocked(readExif).mockResolvedValue(FULL_EXIF);
    render(<App />);
    upload('a.jpg');
    await waitFor(() => expect(exportBtn()).toBeEnabled());
    expect(screen.getByLabelText('Timestamp')).toHaveValue(expect.stringMatching(/^2026-11-04T14:32:08(\.000)?$/)); // jsdom appends .000
    expect(screen.getByText('Read from EXIF')).toBeInTheDocument();
    expect(lat().value).toBe('-8.43221');
  });

  it('rejects a non-image upload inline', async () => {
    render(<App />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } });
    expect(await screen.findByText('Please upload a valid JPEG or PNG image.')).toBeInTheDocument();
  });
});
