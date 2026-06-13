import * as THREE from 'three';
import { makeGlowSprite, makeTextSprite } from '../textures';
import type { TargetEntity } from './TargetEntity';

// A UFO for the mini-game. Each UFO carries one answer (label or emoji image)
// floating above it. It drifts across the play area; the player shoots the one
// holding the correct answer.
export class Ufo implements TargetEntity {
  readonly group = new THREE.Group();
  readonly answerId: string;
  readonly correct: boolean;
  readonly mesh: THREE.Mesh;
  private label: THREE.Sprite;
  velocity = new THREE.Vector3();
  alive = true;

  constructor(answerId: string, correct: boolean, display: string, isImage: boolean) {
    this.answerId = answerId;
    this.correct = correct;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x9aa7b8,
      metalness: 0.7,
      roughness: 0.3,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 0.4, 20), bodyMat);
    this.mesh = disc;
    this.mesh.userData.target = this;
    this.group.add(disc);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x6cff9e,
        emissive: 0x33dd77,
        emissiveIntensity: 0.6,
      })
    );
    dome.position.y = 0.2;
    this.group.add(dome);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite('#6cff9e'),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.setScalar(4);
    this.group.add(glow);

    // The carried answer floats above the saucer (canvas sprite for crisp text
    // and full color-emoji support).
    const labelH = isImage ? 2.2 : 1.5;
    const made = makeTextSprite(display, { fontSize: isImage ? 110 : 80, color: '#ffffff' });
    this.label = made.sprite;
    this.label.scale.set(labelH * made.aspect, labelH, 1);
    this.label.position.set(0, 2.0, 0);
    this.group.add(this.label);
  }

  update(dt: number): void {
    this.group.position.addScaledVector(this.velocity, dt);
    this.group.rotation.y += dt * 1.5;
    // Bob vertically.
    this.group.position.y += Math.sin(performance.now() * 0.003 + this.group.id) * dt * 0.6;
  }

  dispose(scene: THREE.Object3D): void {
    scene.remove(this.group);
    (this.label.material as THREE.SpriteMaterial).map?.dispose();
    (this.label.material as THREE.SpriteMaterial).dispose();
  }
}
