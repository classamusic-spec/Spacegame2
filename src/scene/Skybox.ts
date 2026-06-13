import * as THREE from 'three';
import { RENDER } from '../config/constants';
import { randRange } from '../utils/math';

// A procedural starfield: a big Points cloud of twinkly stars plus a faint
// nebula gradient backdrop. Zero image assets, looks great with bloom.
export function createStarfield(): THREE.Points {
  const count = RENDER.starCount;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xbcd4ff),
    new THREE.Color(0xffe6b0),
    new THREE.Color(0xffc0d0),
  ];

  for (let i = 0; i < count; i++) {
    // Distribute on a large sphere shell so stars surround the player.
    const r = randRange(200, 480);
    const theta = randRange(0, Math.PI * 2);
    const phi = Math.acos(randRange(-1, 1));
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    const b = randRange(0.5, 1);
    colors[i * 3] = c.r * b;
    colors[i * 3 + 1] = c.g * b;
    colors[i * 3 + 2] = c.b * b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.6,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    map: makeStarSprite(),
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'starfield';
  points.renderOrder = -1;
  return points;
}

// Soft round sprite so stars are dots, not squares.
function makeStarSprite(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
