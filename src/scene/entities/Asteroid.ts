import * as THREE from 'three';
import { makeTextSprite } from '../textures';
import type { TargetEntity } from './TargetEntity';

// An asteroid for the outer-system mini-game variant. Like the UFO, it carries
// one answer floating above it and tumbles across the play area; the player
// blasts the one holding the correct answer.
export class Asteroid implements TargetEntity {
  readonly group = new THREE.Group();
  readonly answerId: string;
  readonly correct: boolean;
  readonly mesh: THREE.Mesh;
  private label: THREE.Sprite;
  private tumble = new THREE.Vector3(
    Math.random() * 1.4,
    Math.random() * 1.4,
    Math.random() * 1.4
  );
  velocity = new THREE.Vector3();
  alive = true;

  constructor(answerId: string, correct: boolean, display: string, isImage: boolean) {
    this.answerId = answerId;
    this.correct = correct;

    // A lumpy rock — a low-detail icosahedron with jittered vertices.
    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.multiplyScalar(0.85 + Math.random() * 0.35);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x9a8d7c, roughness: 1, metalness: 0.1 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.target = this;
    this.group.add(this.mesh);

    // A few glowing crystal flecks for visual interest.
    for (let i = 0; i < 3; i++) {
      const crystal = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.22),
        new THREE.MeshStandardMaterial({ color: 0x6cff9e, emissive: 0x33dd77, emissiveIntensity: 0.8 })
      );
      const a = Math.random() * Math.PI * 2;
      crystal.position.set(Math.cos(a) * 0.9, Math.random() * 0.6 - 0.3, Math.sin(a) * 0.9);
      this.group.add(crystal);
    }

    const labelH = isImage ? 2.2 : 1.5;
    const made = makeTextSprite(display, { fontSize: isImage ? 110 : 80, color: '#ffffff' });
    this.label = made.sprite;
    this.label.scale.set(labelH * made.aspect, labelH, 1);
    this.label.position.set(0, 2.2, 0);
    this.group.add(this.label);
  }

  update(dt: number): void {
    this.group.position.addScaledVector(this.velocity, dt);
    this.mesh.rotation.x += this.tumble.x * dt;
    this.mesh.rotation.y += this.tumble.y * dt;
    this.mesh.rotation.z += this.tumble.z * dt;
  }

  dispose(scene: THREE.Object3D): void {
    scene.remove(this.group);
    (this.label.material as THREE.SpriteMaterial).map?.dispose();
    (this.label.material as THREE.SpriteMaterial).dispose();
  }
}
