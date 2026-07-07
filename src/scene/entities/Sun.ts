import * as THREE from 'three';
import { makeSunTexture, makeGlowSprite } from '../textures';

// The Sun: an emissive sphere (so bloom makes it glow) at the origin, wrapped in
// layered billboarded corona sprites — a wide soft halo, a hot inner glow, and a
// slowly rotating "flare" streak layer — for a radiant, alive star. Plus a point
// light so it actually lights the system.
export class Sun {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private corona: THREE.Sprite;
  private flare: THREE.Sprite;

  constructor() {
    const geo = new THREE.SphereGeometry(8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      map: makeSunTexture(),
      emissive: 0xff9a2e,
      emissiveIntensity: 1.2,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);

    // Wide, soft outer corona.
    this.corona = makeSprite('#ffb74d', 42, 0.4);
    this.group.add(this.corona);
    // Hot bright inner core glow.
    const inner = makeSprite('#fff2c0', 22, 0.6);
    this.group.add(inner);
    // Rotating flare streaks for a living surface shimmer.
    this.flare = makeSprite('#ffd27a', 38, 0.28);
    this.group.add(this.flare);

    this.group.name = 'sun';
  }

  update(dt: number): void {
    const now = performance.now();
    this.mesh.rotation.y += dt * 0.05;
    this.flare.material.rotation += dt * 0.12;
    // Gentle breathing so the star feels alive.
    const pulse = 1 + Math.sin(now * 0.0012) * 0.04;
    this.corona.scale.setScalar(42 * pulse);
  }
}

function makeSprite(color: string, scale: number, opacity: number): THREE.Sprite {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowSprite(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  s.scale.setScalar(scale);
  return s;
}
