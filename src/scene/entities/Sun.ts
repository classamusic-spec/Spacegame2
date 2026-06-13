import * as THREE from 'three';
import { makeSunTexture, makeGlowSprite } from '../textures';

// The Sun: an emissive sphere (so bloom makes it glow) at the origin, wrapped
// in a billboarded glow sprite for a soft corona. Slowly rotates.
export class Sun {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;

  constructor() {
    const geo = new THREE.SphereGeometry(8, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      map: makeSunTexture(),
      emissive: 0xff8a1e,
      emissiveIntensity: 1.4,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite('#ffb74d'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.setScalar(34);
    this.group.add(glow);

    this.group.name = 'sun';
  }

  update(dt: number): void {
    this.mesh.rotation.y += dt * 0.05;
  }
}
