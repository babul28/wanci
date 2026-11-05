import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactNode } from 'react';
import { MapPickerModal } from '../../src/components/MapPickerModal';
import { searchPlaces, reverseGeocode, cachedPlaceName } from '../../src/services/location';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  ZoomControl: () => null,
  AttributionControl: () => null,
  useMap: () => ({ flyTo: vi.fn() }),
  useMapEvents: () => null,
}));
vi.mock('../../src/services/location', async (orig) => ({
  ...(await orig<typeof import('../../src/services/location')>()),
  searchPlaces: vi.fn(),
  reverseGeocode: vi.fn(),
  cachedPlaceName: vi.fn(),
}));

const UBUD = { name: 'Ubud, Gianyar, Bali', lat: -8.5069, lng: 115.2625 };
const search = () => screen.getByRole('searchbox', { name: 'Search places' });
const submit = (q: string) => {
  fireEvent.change(search(), { target: { value: q } });
  fireEvent.submit(search().closest('form')!);
};

beforeEach(() => {
  vi.mocked(searchPlaces).mockReset().mockResolvedValue([UBUD]);
  vi.mocked(reverseGeocode).mockResolvedValue(null);
  vi.mocked(cachedPlaceName).mockReturnValue(undefined);
});

describe('MapPickerModal', () => {
  it('searches on submit, never while typing', () => {
    render(<MapPickerModal initial={null} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    fireEvent.change(search(), { target: { value: 'ubud' } });
    expect(searchPlaces).not.toHaveBeenCalled();
    fireEvent.submit(search().closest('form')!);
    expect(searchPlaces).toHaveBeenCalledTimes(1);
    expect(searchPlaces).toHaveBeenCalledWith('ubud');
  });

  it('a picked result is what Use this location confirms', async () => {
    const onConfirm = vi.fn();
    render(<MapPickerModal initial={null} onCancel={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByRole('button', { name: 'Use this location' })).toBeDisabled();
    submit('ubud');
    fireEvent.click(await screen.findByRole('button', { name: /Ubud, Gianyar, Bali/ }));
    expect(screen.getByText('-8.50690, 115.26250')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Use this location' }));
    expect(onConfirm).toHaveBeenCalledWith({ lat: UBUD.lat, lng: UBUD.lng, source: 'map' });
  });

  it('confirming an unmoved initial point labels it as picked on the map', () => {
    const onConfirm = vi.fn();
    render(<MapPickerModal initial={{ lat: 1, lng: 2, source: 'exif' }} onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Use this location' }));
    expect(onConfirm).toHaveBeenCalledWith({ lat: 1, lng: 2, source: 'map' });
  });

  it('shows search failures and empty results', async () => {
    vi.mocked(searchPlaces).mockRejectedValueOnce(new Error('offline'));
    render(<MapPickerModal initial={null} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    submit('ubud');
    expect(await screen.findByText('Search failed. Try again.')).toBeInTheDocument();
    vi.mocked(searchPlaces).mockResolvedValueOnce([]);
    submit('nowhere');
    expect(await screen.findByText('No places found.')).toBeInTheDocument();
  });

  it('a drag that ends over the backdrop does not close the picker; a real backdrop click does', () => {
    const onCancel = vi.fn();
    render(<MapPickerModal initial={null} onCancel={onCancel} onConfirm={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement!;
    fireEvent.mouseDown(dialog);
    fireEvent.click(backdrop); // Chrome targets the common ancestor when down/up land on different elements
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Cancel and Escape both cancel', () => {
    const onCancel = vi.fn();
    render(<MapPickerModal initial={null} onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
