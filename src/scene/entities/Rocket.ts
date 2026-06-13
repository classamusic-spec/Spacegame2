import * as THREE from 'three';
import type { RocketDef } from '../../config/rockets';
import { makeGlowSprite } from '../textures';

// The player ship, built entirely from primitive geometry (no model files) but
// detailed enough to look gorgeous: PBR metallic body, glowing canopy, emissive
// trim, an engine nozzle, and a layered animated flame (core + halo + sparks).
export class Rocket {
  readonly group = new THREE.Group();
  private body = new THREE.Group();
  private flameCore: THREE.Sprite;
  private flameHalo: THREE.Sprite;
  private sparks: THREE.Sprite[] = [];
  private trim: THREE.MeshStandardMaterial[] = [];
  private thrust = 0;

  constructor(def: RocketDef) {
    this.group.add(this.body);
    if (def.id === 'saucer') {
      this.buildSaucer(def);
    } else {
      this.buildRocket(def);
    }

    // --- Layered engine flame ---
    const flameColor = '#' + def.flameColor.toString(16).padStart(6, '0');
    this.flameHalo = makeFlameSprite(flameColor, 0.5);
    this.flameHalo.position.set(0, 0, 2.0);
    this.flameHalo.scale.setScalar(3);
    this.body.add(this.flameHalo);

    this.flameCore = makeFlameSprite('#fff6c8', 0.95);
    this.flameCore.position.set(0, 0, 1.9);
    this.flameCore.scale.setScalar(1.4);
    this.body.add(this.flameCore);

    for (let i = 0; i < 4; i++) {
      const s = makeFlameSprite(flameColor, 0.8);
      s.scale.setScalar(0.4);
      this.body.add(s);
      this.sparks.push(s);
    }

    this.group.name = 'rocket';
  }

  private buildRocket(def: RocketDef): void {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: def.bodyColor,
      metalness: 0.55,
      roughness: 0.28,
    });
    const finMat = new THREE.MeshStandardMaterial({
      color: def.finColor,
      metalness: 0.5,
      roughness: 0.35,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: def.finColor,
      emissive: def.finColor,
      emissiveIntensity: 0.7,
      metalness: 0.3,
      roughness: 0.4,
    });
    this.trim.push(trimMat);

    // Main fuselage — points along -Z (forward).
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.7, 12, 24), bodyMat);
    body.rotation.x = Math.PI / 2;
    this.body.add(body);

    // Sleek nose cone.
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.3, 24), finMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.85;
    this.body.add(nose);

    // Glowing tip light.
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2, toneMapped: false })
    );
    tip.position.z = -2.5;
    this.body.add(tip);

    // Emissive racing trim ring around the body.
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.07, 12, 32), trimMat);
    ring.position.z = -0.3;
    this.body.add(ring);

    // Cockpit canopy — glassy emissive dome.
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 18, 18),
      new THREE.MeshStandardMaterial({
        color: 0x9be7ff,
        emissive: 0x33bbff,
        emissiveIntensity: 0.7,
        metalness: 0.2,
        roughness: 0.1,
      })
    );
    canopy.position.set(0, 0.34, -0.55);
    this.body.add(canopy);

    // Three swept fins.
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 4), finMat);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 0.66, Math.sin(a) * 0.66, 1.15);
      fin.rotation.z = a + Math.PI / 4;
      fin.rotation.x = Math.PI / 2;
      this.body.add(fin);
    }

    // Dark metallic engine nozzle.
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.66, 0.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x444a55, metalness: 0.9, roughness: 0.4 })
    );
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.z = 1.55;
    this.body.add(nozzle);
  }

  private buildSaucer(def: RocketDef): void {
    const discMat = new THREE.MeshStandardMaterial({
      color: def.bodyColor,
      metalness: 0.85,
      roughness: 0.18,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 0.4, 32), discMat);
    disc.rotation.x = Math.PI / 2;
    this.body.add(disc);

    // Rim band.
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.16, 16, 40),
      new THREE.MeshStandardMaterial({ color: def.finColor, metalness: 0.7, roughness: 0.3 })
    );
    rim.rotation.x = Math.PI / 2;
    this.body.add(rim);

    // Glass dome.
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x9be7ff,
        emissive: 0x33bbff,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.1,
      })
    );
    dome.position.z = -0.35;
    dome.rotation.x = -Math.PI / 2;
    this.body.add(dome);

    // Ring of glowing under-lights.
    const lightMat = new THREE.MeshStandardMaterial({
      color: def.flameColor,
      emissive: def.flameColor,
      emissiveIntensity: 1.4,
      toneMapped: false,
    });
    this.trim.push(lightMat);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), lightMat);
      light.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0.28);
      this.body.add(light);
    }
  }

  /** Animate flame/thrust intensity (0..1). */
  setThrust(t: number): void {
    this.thrust = THREE.MathUtils.clamp(t, 0, 1);
  }

  update(_dt: number): void {
    const now = performance.now();
    const flicker = 0.82 + Math.sin(now * 0.045) * 0.18;
    const power = 0.5 + this.thrust * 0.5;

    this.flameHalo.scale.setScalar((2.0 + this.thrust * 2.6) * flicker);
    (this.flameHalo.material as THREE.SpriteMaterial).opacity = 0.35 + this.thrust * 0.5;
    this.flameCore.scale.setScalar((0.9 + this.thrust * 1.4) * flicker);
    (this.flameCore.material as THREE.SpriteMaterial).opacity = power;

    // Spark trail flickering behind the engine.
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      const phase = now * 0.012 + i * 1.7;
      s.position.set(
        Math.sin(phase) * 0.18,
        Math.cos(phase * 1.3) * 0.18,
        2.2 + ((phase % 1.4))
      );
      const fade = 1 - ((phase % 1.4) / 1.4);
      (s.material as THREE.SpriteMaterial).opacity = fade * this.thrust * 0.9;
      s.scale.setScalar(0.5 * fade + 0.1);
    }

    // Pulse emissive trim for a lively shimmer.
    const pulse = 0.6 + Math.sin(now * 0.004) * 0.4;
    for (const m of this.trim) m.emissiveIntensity = pulse * (1 + this.thrust);

    // Gentle idle bob.
    this.body.position.y = Math.sin(now * 0.002) * 0.12;
  }
}

// Soft additive flame sprite.
function makeFlameSprite(color: string, opacity: number): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowSprite(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  return sprite;
}
