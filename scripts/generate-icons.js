import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(toCrc), 8 + len);
  return buf;
}

function generatePng(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter byte: None

    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const pixelOffset = rowOffset + 1 + x * 4;

      // Dark background: #0a0a0c to #14161f
      let r = Math.round(10 + ny * 8);
      let g = Math.round(10 + ny * 10);
      let b = Math.round(12 + ny * 16);
      let a = 255;

      // Scaled coordinates 0..100
      const sx = nx * 100;
      const sy = ny * 100;

      // Outer border glow
      const borderDist = Math.min(Math.min(sx, 100 - sx), Math.min(sy, 100 - sy));
      if (borderDist > 2 && borderDist < 3.5) {
        r = 34;
        g = 197;
        b = 94;
        a = 180;
      }

      // Check distance to 'K' letter shapes:
      // 1. Spine: (34, 25) to (34, 75), radius 5.5
      const dSpine = distToSegment(sx, sy, 34, 28, 34, 72);
      // 2. Top arm: (34, 50) to (68, 28), radius 5.5
      const dArm = distToSegment(sx, sy, 34, 50, 68, 28);
      // 3. Bottom leg: (40, 52) to (68, 72), radius 5.5
      const dLeg = distToSegment(sx, sy, 40, 52, 68, 72);

      const minDist = Math.min(dSpine, Math.min(dArm, dLeg));

      if (minDist <= 5.8) {
        // Core K fill: Neon Green gradient #00E676 to #22c55e
        const kRatio = (sx + sy) / 200;
        r = Math.round(0 * (1 - kRatio) + 34 * kRatio);
        g = Math.round(230 * (1 - kRatio) + 197 * kRatio);
        b = Math.round(118 * (1 - kRatio) + 94 * kRatio);
        a = 255;
      } else if (minDist <= 10.0) {
        // Soft neon glow surrounding the K
        const glowFactor = 1 - (minDist - 5.8) / 4.2;
        r = Math.round(r * (1 - glowFactor) + 0 * glowFactor);
        g = Math.round(g * (1 - glowFactor) + 230 * glowFactor);
        b = Math.round(b * (1 - glowFactor) + 118 * glowFactor);
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate standard icons
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generatePng(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generatePng(512));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), generatePng(192));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), generatePng(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64));
console.log('Successfully generated all PWA icons in /public.');
