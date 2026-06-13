import type * as THREE from 'three';

// Common shape for a shootable target in the mini-game (a UFO or an asteroid),
// so the game logic can treat both interchangeably.
export interface TargetEntity {
  readonly group: THREE.Group;
  readonly mesh: THREE.Mesh; // raycast target; mesh.userData.target points back here
  readonly answerId: string;
  readonly correct: boolean;
  velocity: THREE.Vector3;
  alive: boolean;
  update(dt: number): void;
  dispose(scene: THREE.Object3D): void;
}
