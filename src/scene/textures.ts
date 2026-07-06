import * as THREE from 'three';

// Procedural planet & sun textures drawn to a canvas — no image files needed.
// Each planet type gets its own gorgeous, distinct look that reads well for kids.

export type PlanetVisual = 'rocky' | 'earthlike' | 'gas' | 'ice';

function rgba(c: THREE.Color, a: number): string {
  return `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`;
}

// Build a planet surface texture appropriate to its type. Higher resolution +
// layered passes (base gradient, bands/continents, detail, highlights) give a
// rich, painterly look while staying cheap (drawn once at load).
export function makePlanetTexture(base: number, accent: number, visual: PlanetVisual = 'rocky'): THREE.Texture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const baseC = new THREE.Color(base);
  const accentC = new THREE.Color(accent);

  // Subtle vertical lighting gradient (poles darker) for every type.
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, rgba(baseC.clone().multiplyScalar(0.7), 1));
  grad.addColorStop(0.5, rgba(baseC, 1));
  grad.addColorStop(1, rgba(baseC.clone().multiplyScalar(0.65), 1));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (visual === 'earthlike') {
    drawEarthlike(ctx, w, h, baseC, accentC);
  } else if (visual === 'gas') {
    drawGasGiant(ctx, w, h, baseC, accentC);
  } else if (visual === 'ice') {
    drawIceGiant(ctx, w, h, baseC, accentC);
  } else {
    drawRocky(ctx, w, h, baseC, accentC);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function drawRocky(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color, accent: THREE.Color): void {
  // Mottled patches.
  for (let i = 0; i < 60; i++) {
    const mix = base.clone().lerp(accent, Math.random());
    ctx.fillStyle = rgba(mix, 0.25 + Math.random() * 0.3);
    ctx.beginPath();
    ctx.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 90, 20 + Math.random() * 60, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Craters: dark rim + lighter floor for a 3D feel.
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 4 + Math.random() * 16;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(base.clone().lerp(accent, 0.4), 0.5);
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEarthlike(ctx: CanvasRenderingContext2D, w: number, h: number, _ocean: THREE.Color, land: THREE.Color): void {
  // Ocean base already laid; paint blobby continents with green/brown.
  const landC = land;
  const sand = land.clone().lerp(new THREE.Color(0xc2a05a), 0.5);
  for (let c = 0; c < 14; c++) {
    const cx = Math.random() * w;
    const cy = h * (0.2 + Math.random() * 0.6);
    const blobs = 8 + (Math.random() * 10) | 0;
    ctx.fillStyle = rgba(landC, 0.95);
    for (let b = 0; b < blobs; b++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 70;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 18 + Math.random() * 34, 14 + Math.random() * 26, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Coastal sand accents.
    ctx.fillStyle = rgba(sand, 0.5);
    for (let b = 0; b < 6; b++) {
      ctx.beginPath();
      ctx.arc(cx + (Math.random() - 0.5) * 120, cy + (Math.random() - 0.5) * 90, 6 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Polar ice caps.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(0, h * 0.06, w, h * 0.04);
  ctx.fillRect(0, h * 0.9, w, h * 0.04);
}

function drawGasGiant(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color, accent: THREE.Color): void {
  // Flowing horizontal bands.
  const bands = 22;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const mix = base.clone().lerp(accent, (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.9);
    const y = t * h;
    const bh = h / bands + 2;
    ctx.fillStyle = rgba(mix, 0.85);
    ctx.fillRect(0, y, w, bh);
  }
  // Turbulent swirl wisps along the band edges.
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * h;
    const mix = base.clone().lerp(accent, Math.random());
    ctx.strokeStyle = rgba(mix, 0.15);
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const x = Math.random() * w;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 40, y - 8, x + 80, y + 8, x + 130, y);
    ctx.stroke();
  }
  // A signature storm (Great-Red-Spot style oval).
  const sx = w * (0.3 + Math.random() * 0.4);
  const sy = h * (0.45 + Math.random() * 0.2);
  const storm = accent.clone().lerp(new THREE.Color(0xffffff), 0.2);
  for (let r = 4; r > 0; r--) {
    ctx.fillStyle = rgba(storm.clone().multiplyScalar(0.6 + r * 0.1), 0.5);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 60 * (r / 4), 34 * (r / 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIceGiant(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color, accent: THREE.Color): void {
  // Smooth, faint bands for a serene icy look.
  const bands = 10;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const mix = base.clone().lerp(accent, (Math.sin(i) * 0.5 + 0.5) * 0.5);
    ctx.fillStyle = rgba(mix, 0.4);
    ctx.fillRect(0, t * h, w, h / bands + 2);
  }
  // Soft high clouds.
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 10 + Math.random() * 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A transparent cloud layer (white blobs on alpha) for earthlike planets,
// drawn on a slightly larger second sphere that rotates independently.
export function makeCloudTexture(): THREE.Texture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.4})`;
    for (let b = 0; b < 10; b++) {
      ctx.beginPath();
      ctx.ellipse(cx + (Math.random() - 0.5) * 90, cy + (Math.random() - 0.5) * 40, 16 + Math.random() * 34, 8 + Math.random() * 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// A banded ring texture (for Saturn) with a transparent center, drawn radially.
export function makeRingTexture(base: number, accent: number): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const baseC = new THREE.Color(base);
  const accentC = new THREE.Color(accent);
  ctx.clearRect(0, 0, size, size);
  for (let r = size / 2; r > size * 0.28; r -= 1) {
    const t = (r - size * 0.28) / (size * 0.22);
    const noise = Math.sin(r * 0.6) * 0.5 + 0.5;
    const mix = baseC.clone().lerp(accentC, noise);
    const alpha = (0.25 + noise * 0.55) * Math.min(1, t * 3);
    ctx.strokeStyle = rgba(mix, alpha);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.stroke();
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

// A painterly equirectangular nebula sky used as the scene background AND (via
// PMREM) as the environment map so metals pick up soft colored reflections.
export function makeNebulaTexture(): THREE.Texture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep-space base with a gentle vertical tint.
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#070512');
  base.addColorStop(0.5, '#0a0820');
  base.addColorStop(1, '#05030f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Soft colored nebula clouds (additive) in a cohesive palette.
  const palette = ['#3a2b8f', '#7b2f8a', '#1f5f8b', '#8a2f5a', '#2f7b6b'];
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 120 + Math.random() * 420;
    const col = palette[(Math.random() * palette.length) | 0];
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col);
    g.addColorStop(0.4, col + '55');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.10 + Math.random() * 0.16;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * (0.5 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // Baked star dust so the background reads rich even before the Points layer.
  for (let i = 0; i < 1400; i++) {
    const b = Math.random();
    ctx.fillStyle = `rgba(255,255,255,${0.15 + b * 0.7})`;
    const s = b > 0.96 ? 2.2 : b > 0.8 ? 1.3 : 0.7;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// A grayscale relief map (bumpMap) matched to a planet type, giving the surface
// real depth under lighting instead of looking painted-on-flat.
export function makePlanetBump(visual: PlanetVisual): THREE.Texture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080'; // neutral height
  ctx.fillRect(0, 0, w, h);

  if (visual === 'gas') {
    for (let i = 0; i < 26; i++) {
      const y = (i / 26) * h;
      const shade = 96 + Math.sin(i * 1.7) * 60;
      ctx.fillStyle = `rgb(${shade | 0},${shade | 0},${shade | 0})`;
      ctx.fillRect(0, y, w, h / 26 + 2);
    }
  } else if (visual === 'ice') {
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (visual === 'earthlike') {
    for (let i = 0; i < 26; i++) {
      const cx = Math.random() * w;
      const cy = h * (0.15 + Math.random() * 0.7);
      ctx.fillStyle = 'rgba(220,220,220,0.85)'; // raised land
      for (let b = 0; b < 10; b++) {
        ctx.beginPath();
        ctx.ellipse(cx + (Math.random() - 0.5) * 120, cy + (Math.random() - 0.5) * 90, 14 + Math.random() * 30, 10 + Math.random() * 22, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // rocky: craters (dark pit + bright rim) for strong relief.
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 4 + Math.random() * 20;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
