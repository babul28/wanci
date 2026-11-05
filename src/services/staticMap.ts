export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const PIN_STYLE = { color: '#FFFFFF', weight: 2, fillColor: '#FF7A1A', fillOpacity: 1 };

export const ZOOM = 17; // ~600 m across: a few streets, enough to confirm the area at a glance
const TILE = 256;
/** Rendered map size in source pixels, landscape 8:5. */
export const MAP_W = 512;
export const MAP_H = 320;

/** OSM tiles (and where to draw them) covering a MAP_W × MAP_H rectangle centred on the point. */
export const mapTiles = (lat: number, lng: number) => {
  const n = 2 ** ZOOM;
  const px = ((lng + 180) / 360) * n * TILE;
  const py = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n * TILE;
  const left = px - MAP_W / 2;
  const top = py - MAP_H / 2;
  const tiles: { url: string; dx: number; dy: number }[] = [];
  for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + MAP_H - 1) / TILE); ty++) {
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + MAP_W - 1) / TILE); tx++) {
      const url = OSM_TILE_URL.replace('{z}', String(ZOOM))
        .replace('{x}', String(((tx % n) + n) % n))
        .replace('{y}', String(ty));
      tiles.push({ url, dx: tx * TILE - left, dy: ty * TILE - top });
    }
  }
  return tiles;
};

const render = async (lat: number, lng: number): Promise<HTMLCanvasElement | null> => {
  try {
    const images = await Promise.all(
      mapTiles(lat, lng).map(async (t) => {
        const res = await fetch(t.url);
        if (!res.ok) throw new Error(`tile ${res.status}`);
        return { ...t, img: await createImageBitmap(await res.blob()) };
      }),
    );
    const canvas = document.createElement('canvas');
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    images.forEach((t) => ctx.drawImage(t.img, t.dx, t.dy));
    ctx.beginPath();
    ctx.arc(MAP_W / 2, MAP_H / 2, 14, 0, Math.PI * 2);
    ctx.fillStyle = PIN_STYLE.fillColor;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = PIN_STYLE.color;
    ctx.stroke();
    return canvas;
  } catch {
    return null;
  }
};

// ponytail: unbounded per-session cache (one entry per point stamped); add LRU if sessions get long
const cache = new Map<string, Promise<HTMLCanvasElement | null>>();

/** Map rectangle centred on the point, or null when tiles can't be loaded (offline, blocked). Never rejects. */
export const loadStaticMap = (lat: number, lng: number): Promise<HTMLCanvasElement | null> => {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  let p = cache.get(key);
  if (!p) {
    p = render(lat, lng).then((c) => {
      if (!c) cache.delete(key); // retry next time, e.g. once back online
      return c;
    });
    cache.set(key, p);
  }
  return p;
};

export const _resetStaticMapForTests = () => cache.clear();
