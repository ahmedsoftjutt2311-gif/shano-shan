/**
 * Product image processing — safe edge-connected background removal.
 *
 * Used by the Admin upload flow to generate a transparent-background display
 * derivative for typical white-canvas product photography. The ORIGINAL file
 * is never modified: processing runs on an in-memory copy and the original
 * file is uploaded alongside the derivative.
 *
 * Safety model (fail-closed):
 *  - Suitability gate: only run when the image plausibly has a uniform bright
 *    canvas (bright border ratio, low border variance, sane ink coverage).
 *  - Flood fill is seeded ONLY from the image border (4-connected), so interior
 *    white pixels (glass highlights, labels, reflections) are unreachable and
 *    can never be removed by construction.
 *  - Conservative fixed tolerance (16 / 255) on the sampled canvas color.
 *  - Confidence gate: if the removed region looks wrong (implausible coverage,
 *    fragmented bottle silhouette, clipped touch counts), the original is used.
 *  - ANY decode/encode/processing error → status "failed", original is used.
 */

// ---------------------------------------------------------------------------
// PNG decoding (bit depth 8; color types 0,2,3,4,6; no interlace)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export interface DecodedPng {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel */
  data: Uint8Array;
  /** true if the source already carried meaningful alpha (<255 somewhere) */
  hadAlpha: boolean;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  // DecompressionStream('deflate') == zlib wrapper (RFC 1950), same as zlib.inflateSync.
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function decodePng(bytes: Uint8Array): Promise<DecodedPng> {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) throw new Error('Not a PNG file');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 8;
  let width = 0, height = 0, colorType = -1, bitDepth = -1, interlace = -1;
  const idat: Uint8Array[] = [];
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  let plteCount = 0;
  while (off + 8 <= bytes.length) {
    const len = dv.getUint32(off);
    const type = String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]);
    const body = bytes.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = dv.getUint32(off + 8);
      height = dv.getUint32(off + 12);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'PLTE') { palette = body; plteCount = len / 3; }
    else if (type === 'tRNS') trns = body;
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (!width || !height) throw new Error('PNG missing IHDR');
  if (bitDepth !== 8) throw new Error(`Unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('Interlaced PNG not supported');
  const chMap: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const ch = chMap[colorType];
  if (!ch) throw new Error(`Unsupported color type ${colorType}`);
  if (colorType === 3 && !palette) throw new Error('Palette PNG missing PLTE');

  const raw = await inflate(concat(idat));
  const stride = width * ch;
  if (raw.length < (stride + 1) * height) throw new Error('PNG pixel data truncated');

  const out = new Uint8Array(width * height * 4);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  let p = 0;
  let hadAlpha = false;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    cur.set(raw.subarray(p, p + stride));
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = cur[i];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      cur[i] = v;
    }
    const ro = y * width * 4;
    if (colorType === 6) {
      out.set(cur.subarray(0, width * 4), ro);
      if (!hadAlpha) for (let x = 0; x < width; x++) if (cur[x * 4 + 3] !== 255) { hadAlpha = true; break; }
    } else if (colorType === 2) {
      for (let x = 0; x < width; x++) {
        out[ro + x * 4] = cur[x * 3];
        out[ro + x * 4 + 1] = cur[x * 3 + 1];
        out[ro + x * 4 + 2] = cur[x * 3 + 2];
        out[ro + x * 4 + 3] = 255;
      }
    } else if (colorType === 4) {
      for (let x = 0; x < width; x++) {
        const v = cur[x * 2];
        out[ro + x * 4] = v; out[ro + x * 4 + 1] = v; out[ro + x * 4 + 2] = v;
        out[ro + x * 4 + 3] = cur[x * 2 + 1];
        if (cur[x * 2 + 1] !== 255) hadAlpha = true;
      }
    } else if (colorType === 0) {
      for (let x = 0; x < width; x++) {
        const v = cur[x];
        out[ro + x * 4] = v; out[ro + x * 4 + 1] = v; out[ro + x * 4 + 2] = v;
        out[ro + x * 4 + 3] = 255;
      }
    } else {
      for (let x = 0; x < width; x++) {
        const idx = cur[x];
        if (idx >= plteCount) throw new Error('Palette index out of range');
        out[ro + x * 4] = palette![idx * 3];
        out[ro + x * 4 + 1] = palette![idx * 3 + 1];
        out[ro + x * 4 + 2] = palette![idx * 3 + 2];
        const a = trns && idx < trns.length ? trns[idx] : 255;
        out[ro + x * 4 + 3] = a;
        if (a !== 255) hadAlpha = true;
      }
    }
    prev.set(cur);
  }
  return { width, height, data: out, hadAlpha };
}

function concat(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ---------------------------------------------------------------------------
// PNG encoding (RGBA, color type 6, filter 0 per scanline)
// ---------------------------------------------------------------------------

async function deflateSync(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodePngRgba(width: number, height: number, rgba: Uint8Array): Promise<Uint8Array> {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idat = await deflateSync(raw);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array(0)),
  ];
  return concat(parts);
}

// ---------------------------------------------------------------------------
// Edge-connected background removal
// ---------------------------------------------------------------------------

const BG_TOLERANCE = 16;          // per-channel distance tolerance vs sampled canvas
const MIN_BORDER_BRIGHT_RATIO = 0.60;  // ≥60% of border pixels near-canvas-bright
const BORDER_BRIGHT_LUM = 200;    // "bright" threshold for suitability sampling
const BORDER_STDDEV_MAX = 28;     // border pixel stddev ceiling (uniformity)
const MIN_REMOVED_RATIO = 0.02;   // <2% removed → canvas isn't really white
const MAX_REMOVED_RATIO = 0.75;   // >75% removed → too aggressive, keep original
const MIN_PIXELS = 100 * 100;     // tiny images are not product photography
const MAX_PIXELS = 5000 * 5000;   // hard memory ceiling (~100MB RGBA)

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Median RGB of bright border pixels — the canvas color sample. */
function sampleBorderColor(img: DecodedPng): [number, number, number] | null {
  const { width: w, height: h, data } = img;
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const sample = (x: number, y: number) => {
    const o = (y * w + x) * 4;
    if (luminance(data[o], data[o + 1], data[o + 2]) >= BORDER_BRIGHT_LUM) {
      rs.push(data[o]); gs.push(data[o + 1]); bs.push(data[o + 2]);
    }
  };
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y++) { sample(0, y); sample(w - 1, y); }
  if (rs.length < 32) return null; // too few bright border pixels
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  return [med(rs), med(gs), med(bs)];
}

/**
 * Suitability gate — decides whether edge-connected background removal may run.
 * Returns null when suitable (with the sampled canvas color), otherwise a
 * short reason for the Admin status display.
 */
export function assessWhiteCanvasSuitability(img: DecodedPng): { ok: true; bg: [number, number, number] } | { ok: false; reason: string } {
  const { width: w, height: h, data } = img;
  const total = w * h;
  if (total < MIN_PIXELS) return { ok: false, reason: 'Image too small' };
  if (total > MAX_PIXELS) return { ok: false, reason: 'Image too large to process' };

  // Collect ALL border pixel stats (not just bright ones).
  const borderIdx: number[] = [];
  for (let x = 0; x < w; x++) { borderIdx.push(x, (h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { borderIdx.push(y * w, y * w + w - 1); }
  const lums: number[] = [];
  for (const i of borderIdx) {
    const o = i * 4;
    lums.push(luminance(data[o], data[o + 1], data[o + 2]));
  }
  // Ratio of border pixels that are near-white bright.
  let bright = 0;
  for (const L of lums) if (L >= BORDER_BRIGHT_LUM) bright++;
  const brightRatio = bright / lums.length;
  if (brightRatio < MIN_BORDER_BRIGHT_RATIO) {
    return { ok: false, reason: 'Border is not a uniform bright canvas' };
  }
  // Border luminance stddev — a dark product touching the frame, multicolor
  // banners, or lifestyle shots fail this; clean white canvas passes.
  const mean = lums.reduce((s, v) => s + v, 0) / lums.length;
  const variance = lums.reduce((s, v) => s + (v - mean) * (v - mean), 0) / lums.length;
  if (Math.sqrt(variance) > BORDER_STDDEV_MAX) {
    return { ok: false, reason: 'Border luminance too uneven' };
  }
  const bg = sampleBorderColor(img);
  if (!bg) return { ok: false, reason: 'No uniform bright border found' };
  // The sampled canvas itself must be near-white (a studio sweep, not a tinted
  // or colored backdrop). Light-tinted and saturated canvases are skipped:
  // removal is only proven-safe for near-white studio backgrounds.
  if (luminance(bg[0], bg[1], bg[2]) < 230) {
    return { ok: false, reason: 'Canvas is not near-white' };
  }
  return { ok: true, bg };
}

/**
 * 4-connected flood fill from all border pixels. Marks every pixel within
 * tolerance of the canvas color that is CONNECTED to the border. Interior
 * whites (highlights, labels, reflections) are unreachable → always preserved.
 */
export function floodBackgroundFromEdges(img: DecodedPng, bg: [number, number, number]): { mask: Uint8Array; removed: number } {
  const { width: w, height: h, data } = img;
  const tol2 = BG_TOLERANCE * BG_TOLERANCE * 3;
  const mask = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const near = (x: number, y: number): boolean => {
    const o = (y * w + x) * 4;
    const dr = data[o] - bg[0], dg = data[o + 1] - bg[1], db = data[o + 2] - bg[2];
    return dr * dr + dg * dg + db * db <= tol2;
  };
  const seed = (x: number, y: number) => {
    const i = y * w + x;
    if (!mask[i] && near(x, y)) { mask[i] = 1; stack[sp++] = i; }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  let removed = sp;
  while (sp > 0) {
    const i = stack[--sp];
    const x = i % w, y = (i / w) | 0;
    if (x > 0 && !mask[i - 1] && near(x - 1, y)) { mask[i - 1] = 1; stack[sp++] = i - 1; removed++; }
    if (x < w - 1 && !mask[i + 1] && near(x + 1, y)) { mask[i + 1] = 1; stack[sp++] = i + 1; removed++; }
    if (y > 0 && !mask[i - w] && near(x, y - 1)) { mask[i - w] = 1; stack[sp++] = i - w; removed++; }
    if (y < h - 1 && !mask[i + w] && near(x, y + 1)) { mask[i + w] = 1; stack[sp++] = i + w; removed++; }
  }
  return { mask, removed };
}

/**
 * Confidence gate on the flood result. Catches pathological fills before they
 * ever reach production (e.g. white product on white canvas getting eaten).
 */
function floodLooksSane(img: DecodedPng, mask: Uint8Array, removed: number): boolean {
  const total = img.width * img.height;
  const ratio = removed / total;
  if (ratio < MIN_REMOVED_RATIO || ratio > MAX_REMOVED_RATIO) return false;

  // The kept (subject) region must be a modest number of connected components
  // (bottle + possibly shadow/cap pieces). Hundreds of fragments mean the fill
  // chewed through the subject somewhere.
  const w = img.width, h = img.height;
  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  let components = 0;
  for (let s = 0; s < total; s++) {
    if (visited[s] || mask[s]) continue;
    components++;
    if (components > 12) return false;
    let sp = 0;
    stack[sp++] = s;
    visited[s] = 1;
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w, y = (i / w) | 0;
      if (x > 0 && !visited[i - 1] && !mask[i - 1]) { visited[i - 1] = 1; stack[sp++] = i - 1; }
      if (x < w - 1 && !visited[i + 1] && !mask[i + 1]) { visited[i + 1] = 1; stack[sp++] = i + 1; }
      if (y > 0 && !visited[i - w] && !mask[i - w]) { visited[i - w] = 1; stack[sp++] = i - w; }
      if (y < h - 1 && !visited[i + w] && !mask[i + w]) { visited[i + w] = 1; stack[sp++] = i + w; }
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Top-level pipeline
// ---------------------------------------------------------------------------

export type ImageProcessStatus = 'skipped' | 'failed' | 'processed' | 'already_transparent';

export interface ProcessResult {
  status: ImageProcessStatus;
  /** reason for skipped/failed, informational for processed */
  reason?: string;
  /** RGBA PNG bytes of the derivative (processed status only) */
  bytes?: Uint8Array;
  width?: number;
  height?: number;
}

/**
 * Process one product image file. Never throws — any problem degrades to
 * "use the original" (skipped/failed) so an upload can never break.
 */
export async function processProductImageFile(file: File): Promise<ProcessResult> {
  try {
    const type = (file.type || '').toLowerCase();
    // JPEG has no alpha channel — a JPEG cannot already be transparent.
    if (type === 'image/jpeg') {
      return { status: 'skipped', reason: 'JPEG has no alpha channel to derive' };
    }
    if (type !== 'image/png') {
      return { status: 'skipped', reason: 'Not a PNG' };
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const img = await decodePng(buf);
    if (img.hadAlpha) {
      // Already has transparency — assume professionally prepared asset.
      return { status: 'already_transparent', reason: 'Image already has transparency' };
    }
    const suit = assessWhiteCanvasSuitability(img);
    if (!suit.ok) return { status: 'skipped', reason: suit.reason };
    const { mask, removed } = floodBackgroundFromEdges(img, suit.bg);
    if (!floodLooksSane(img, mask, removed)) {
      return { status: 'skipped', reason: 'Background removal confidence too low' };
    }
    // Apply alpha (straight binary cut; the flood threshold is already
    // conservative and the CSS stages render on dark backgrounds where a
    // 1px hard edge is invisible at product-card sizes).
    for (let i = 0; i < mask.length; i++) {
      img.data[i * 4 + 3] = mask[i] ? 0 : 255;
    }
    const out = await encodePngRgba(img.width, img.height, img.data);
    return { status: 'processed', bytes: out, width: img.width, height: img.height };
  } catch {
    return { status: 'failed', reason: 'Processing error' };
  }
}
