import * as THREE from 'three';
import type { PlanetDef } from '../../config/planets';
import {
  makePlanetTexture,
  makePlanetBump,
  makeGlowSprite,
  makeTextSprite,
  makeCloudTexture,
  makeRingTexture,
} from '../textures';

// A planet in the scene. The planet orbits the Sun via a pivot at the origin;
// `mesh` is the tappable sphere (used for raycasting). Gorgeous extras — an
// atmospheric rim glow, a drifting cloud layer (earthlike), and textured rings
// (Saturn) — make each world feel distinct. A label and halo communicate state.
export class Planet {
  readonly def: PlanetDef;
  readonly pivot = new THREE.Group(); // rotates about the Sun
  readonly group = new THREE.Group(); // holds sphere + ring + label, positioned on orbit
  readonly mesh: THREE.Mesh;
  private clouds?: THREE.Mesh;
  private atmosphere?: THREE.Mesh;
  private label: THREE.Sprite;
  private halo: THREE.Sprite;
  private lock: THREE.Sprite;
  private orbitAngle = Math.random() * Math.PI * 2;
  unlocked = false;

  constructor(def: PlanetDef) {
    this.def = def;

    const geo = new THREE.SphereGeometry(def.radius, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      map: makePlanetTexture(def.color, def.accent, def.visual),
      bumpMap: makePlanetBump(def.visual),
      bumpScale: def.visual === 'gas' || def.visual === 'ice' ? 0.015 : 0.04,
      roughness: def.visual === 'earthlike' ? 0.6 : 0.95,
      metalness: def.visual === 'earthlike' ? 0.1 : 0.0,
      envMapIntensity: def.visual === 'earthlike' ? 0.5 : 0.25,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.planetId = def.id;
    this.group.add(this.mesh);

    // Drifting cloud layer for earthlike worlds.
    if (def.clouds) {
      this.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * 1.02, 48, 48),
        new THREE.MeshStandardMaterial({
          map: makeCloudTexture(),
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          roughness: 1,
        })
      );
      this.mesh.add(this.clouds);
    }

    // Soft atmospheric rim glow (a slightly larger back-facing additive shell).
    if (def.atmosphere !== undefined) {
      this.atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * 1.18, 32, 32),
        new THREE.MeshBasicMaterial({
          color: def.atmosphere,
          transparent: true,
          opacity: 0.28,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      this.group.add(this.atmosphere);
    }

    // Apply axial tilt to the whole world (sphere + clouds tilt together).
    this.mesh.rotation.z = def.tilt;

    if (def.hasRing) {
      const ringGeo = new THREE.RingGeometry(def.radius * 1.35, def.radius * 2.4, 96);
      // Remap UVs so the ring texture maps radially (inner→outer).
      const pos = ringGeo.attributes.position as THREE.BufferAttribute;
      const uv = ringGeo.attributes.uv as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      const inner = def.radius * 1.35;
      const outer = def.radius * 2.4;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const r = v.length();
        uv.setXY(i, (r - inner) / (outer - inner), 0.5);
      }
      const ringMat = new THREE.MeshBasicMaterial({
        map: makeRingTexture(def.color, def.accent),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + 0.35;
      this.group.add(ring);
    }

    // Selectable halo (shown when unlocked).
    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite('#ffd24a'),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.halo.scale.setScalar(def.radius * 4.5);
    this.group.add(this.halo);

    // Name label floating above (canvas sprite — always faces the camera).
    const labelH = Math.max(def.radius * 0.7, 1.2);
    const made = makeTextSprite(def.name, { fontSize: 72 });
    this.label = made.sprite;
    this.label.scale.set(labelH * made.aspect, labelH, 1);
    this.label.position.set(0, def.radius * 1.7 + 1.2, 0);
    this.group.add(this.label);

    // Padlock for locked planets.
    const lock = makeTextSprite('🔒', { fontSize: 80 });
    this.lock = lock.sprite;
    this.lock.scale.setScalar(Math.max(def.radius * 1.1, 1.5));
    this.lock.position.set(0, 0, def.radius + 0.8);
    this.group.add(this.lock);

    // Orbit ring (faint) so kids see the path.
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(def.orbitRadius - 0.08, def.orbitRadius + 0.08, 160),
      new THREE.MeshBasicMaterial({
        color: 0x4466aa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22,
      })
    );
    orbitRing.rotation.x = Math.PI / 2;
    this.pivot.add(orbitRing);

    this.pivot.add(this.group);
    this.positionOnOrbit();
  }

  setUnlocked(unlocked: boolean): void {
    this.unlocked = unlocked;
    (this.halo.material as THREE.SpriteMaterial).opacity = unlocked ? 0.5 : 0;
    this.lock.visible = !unlocked;
    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = unlocked ? 1 : 0.65;
    mat.transparent = !unlocked;
    if (this.atmosphere) this.atmosphere.visible = unlocked;
  }

  /** World position of the planet (for camera framing and travel targets). */
  getWorldPosition(target: THREE.Vector3): THREE.Vector3 {
    return this.group.getWorldPosition(target);
  }

  private positionOnOrbit(): void {
    this.group.position.set(
      Math.cos(this.orbitAngle) * this.def.orbitRadius,
      0,
      Math.sin(this.orbitAngle) * this.def.orbitRadius
    );
  }

  update(dt: number, orbiting: boolean): void {
    this.mesh.rotation.y += dt * 0.12;
    if (this.clouds) this.clouds.rotation.y += dt * 0.05;
    if (orbiting) {
      this.orbitAngle += dt * this.def.orbitSpeed;
      this.positionOnOrbit();
    }
    // Gently pulse the halo so unlocked planets feel alive.
    if (this.unlocked) {
      const s = this.def.radius * 4.5 * (1 + Math.sin(performance.now() * 0.003) * 0.06);
      this.halo.scale.setScalar(s);
    }
  }
}
