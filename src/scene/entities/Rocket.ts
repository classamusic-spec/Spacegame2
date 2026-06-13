import * as THREE from 'three';
import type { RocketDef } from '../../config/rockets';
import { makeGlowSprite } from '../textures';

// The player ship, built entirely from primitive geometry (no model files).
// Each of the three rocket styles shares this builder but with different shapes
// and colors so they feel distinct.
export class Rocket {
  readonly group = new THREE.Group();
  private flame: THREE.Sprite;
  private thrust = 0;

  constructor(def: RocketDef) {
    if (def.id === 'saucer') {
      this.buildSaucer(def);
    } else {
      this.buildRocket(def);
    }

    // Engine flame / thruster glow.
    this.flame = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite('#' + def.flameColor.toString(16).padStart(6, '0')),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.flame.scale.setScalar(2.4);
    this.flame.position.set(0, 0, 1.8);
    this.group.add(this.flame);

    this.group.name = 'rocket';
  }

  private buildRocket(def: RocketDef): void {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: def.bodyColor,
      metalness: 0.4,
      roughness: 0.4,
    });
    const finMat = new THREE.MeshStandardMaterial({ color: def.finColor, roughness: 0.5 });

    // Body — points along -Z (forward).
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.6, 8, 16), bodyMat);
    body.rotation.x = Math.PI / 2;
    this.group.add(body);

    // Nose cone.
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.1, 16), finMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.7;
    this.group.add(nose);

    // Window.
    const win = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x9be7ff, emissive: 0x2299ff, emissiveIntensity: 0.4 })
    );
    win.position.set(0, 0.35, -0.4);
    this.group.add(win);

    // Three fins.
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 4), finMat);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1.1);
      fin.rotation.z = a + Math.PI / 4;
      fin.rotation.x = Math.PI / 2;
      this.group.add(fin);
    }
  }

  private buildSaucer(def: RocketDef): void {
    const discMat = new THREE.MeshStandardMaterial({
      color: def.bodyColor,
      metalness: 0.6,
      roughness: 0.25,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, 0.45, 24), discMat);
    disc.rotation.x = Math.PI / 2;
    this.group.add(disc);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x9be7ff,
        emissive: 0x33bbff,
        emissiveIntensity: 0.5,
        metalness: 0.2,
        roughness: 0.2,
      })
    );
    dome.position.z = -0.3;
    dome.rotation.x = -Math.PI / 2;
    this.group.add(dome);

    // Underside lights.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        new THREE.MeshStandardMaterial({ color: def.finColor, emissive: def.finColor, emissiveIntensity: 0.8 })
      );
      light.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0.3);
      this.group.add(light);
    }
  }

  /** Animate flame/thrust intensity (0..1). */
  setThrust(t: number): void {
    this.thrust = t;
  }

  update(dt: number): void {
    // Flicker flame and scale with thrust.
    const flicker = 0.85 + Math.sin(performance.now() * 0.04) * 0.15;
    const s = (1.6 + this.thrust * 2.2) * flicker;
    this.flame.scale.setScalar(s);
    (this.flame.material as THREE.SpriteMaterial).opacity = 0.5 + this.thrust * 0.5;
    // Gentle idle bob.
    this.group.position.y += Math.sin(performance.now() * 0.002) * dt * 0.2;
  }
}
