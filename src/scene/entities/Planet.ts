import * as THREE from 'three';
import type { PlanetDef } from '../../config/planets';
import { makePlanetTexture, makeGlowSprite, makeTextSprite } from '../textures';

// A planet in the scene. The planet orbits the Sun via a pivot at the origin;
// `mesh` is the tappable sphere (used for raycasting). A floating troika label
// and a selectable halo communicate state to kids.
export class Planet {
  readonly def: PlanetDef;
  readonly pivot = new THREE.Group(); // rotates about the Sun
  readonly group = new THREE.Group(); // holds sphere + ring + label, positioned on orbit
  readonly mesh: THREE.Mesh;
  private label: THREE.Sprite;
  private halo: THREE.Sprite;
  private lock: THREE.Sprite;
  private orbitAngle = Math.random() * Math.PI * 2;
  unlocked = false;

  constructor(def: PlanetDef) {
    this.def = def;

    const geo = new THREE.SphereGeometry(def.radius, 40, 40);
    const mat = new THREE.MeshStandardMaterial({
      map: makePlanetTexture(def.color, def.accent),
      roughness: 0.9,
      metalness: 0.0,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.z = def.tilt;
    this.mesh.userData.planetId = def.id;
    this.group.add(this.mesh);

    if (def.hasRing) {
      const ringGeo = new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.2, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.3;
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
    this.halo.scale.setScalar(def.radius * 5);
    this.group.add(this.halo);

    // Name label floating above (canvas sprite — always faces the camera).
    const labelH = def.radius * 0.9;
    const made = makeTextSprite(def.name, { fontSize: 72 });
    this.label = made.sprite;
    this.label.scale.set(labelH * made.aspect, labelH, 1);
    this.label.position.set(0, def.radius * 2.0, 0);
    this.group.add(this.label);

    // Padlock for locked planets.
    const lock = makeTextSprite('🔒', { fontSize: 80 });
    this.lock = lock.sprite;
    this.lock.scale.setScalar(def.radius * 1.3);
    this.lock.position.set(0, 0, def.radius + 0.6);
    this.group.add(this.lock);

    // Orbit ring (faint) so kids see the path.
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(def.orbitRadius - 0.06, def.orbitRadius + 0.06, 128),
      new THREE.MeshBasicMaterial({
        color: 0x4466aa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
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
    (this.mesh.material as THREE.MeshStandardMaterial).opacity = unlocked ? 1 : 0.6;
    (this.mesh.material as THREE.MeshStandardMaterial).transparent = !unlocked;
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
    this.mesh.rotation.y += dt * 0.15;
    if (orbiting) {
      this.orbitAngle += dt * this.def.orbitSpeed;
      this.positionOnOrbit();
    }
    // Gently pulse the halo so unlocked planets feel alive.
    if (this.unlocked) {
      const s = this.def.radius * 5 * (1 + Math.sin(performance.now() * 0.003) * 0.06);
      this.halo.scale.setScalar(s);
    }
  }
}
