import * as THREE from 'three';

// Procedural planet & sun textures drawn to a canvas — no image files needed.
// Each planet gets banded noise tinted by its base + accent colors, giving a
// distinct, colorful look that reads well for kids.

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export function makePlanetTexture(base: number, accent: number): THREE.Texture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);

  // Horizontal accent bands with soft wobble for a cloudy/striped surface.
  const baseC = new THREE.Color(base);
  const accentC = new THREE.Color(accent);
  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const mix = baseC.clone().lerp(accentC, Math.random() * 0.8);
    ctx.fillStyle = `rgba(${(mix.r * 255) | 0},${(mix.g * 255) | 0},${(mix.b * 255) | 0},0.5)`;
    const y = t * h + Math.sin(i) * 6;
    const bh = (h / bands) * (0.5 + Math.random());
    ctx.beginPath();
    ctx.ellipse(w / 2, y, w, bh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scatter lighter speckles (craters / clouds).
  for (let i = 0; i < 240; i++) {
    const r = Math.random() * 5 + 1;
    const light = Math.random() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function makeSunTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff8a1e';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const r = Math.random() * 18 + 4;
    const hot = Math.random() > 0.4;
    ctx.fillStyle = hot ? 'rgba(255,230,120,0.6)' : 'rgba(220,60,10,0.5)';
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// A billboarded text/emoji label drawn to a canvas. Canvas text uses system
// fonts (including color emoji) and needs no network, so labels always render —
// unlike webfont-based 3D text. Returns a Sprite plus its world aspect ratio so
// callers can scale it without distortion.
export function makeTextSprite(
  text: string,
  opts: { fontSize?: number; color?: string; outline?: string } = {}
): { sprite: THREE.Sprite; aspect: number } {
  const fontPx = opts.fontSize ?? 64;
  const pad = fontPx * 0.4;
  const measure = document.createElement('canvas').getContext('2d')!;
  const font = `700 ${fontPx}px 'Trebuchet MS', system-ui, sans-serif`;
  measure.font = font;
  const textW = Math.max(measure.measureText(text).width, fontPx);

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(textW + pad * 2);
  canvas.height = Math.ceil(fontPx + pad * 2);
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = fontPx * 0.14;
  ctx.strokeStyle = opts.outline ?? '#000000';
  ctx.fillStyle = opts.color ?? '#ffffff';
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeText(text, cx, cy);
  ctx.fillText(text, cx, cy);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  return { sprite, aspect: canvas.width / canvas.height };
}

/** Soft radial glow sprite used for halos, thrusters, and explosions. */
export function makeGlowSprite(color = '#ffffff'): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.3, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
