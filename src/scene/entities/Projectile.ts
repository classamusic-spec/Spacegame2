import * as THREE from 'three';

// A laser bolt fired by the player in the UFO mini-game. Simple glowing capsule
// that travels forward and self-expires.
export class Projectile {
  readonly mesh: THREE.Mesh;
  velocity = new THREE.Vector3();
  life = 0;
  readonly maxLife = 2.5;
  alive = true;

  constructor(origin: THREE.Vector3, direction: THREE.Vector3, color = 0xffe24a) {
    const geo = new THREE.CapsuleGeometry(0.12, 0.8, 4, 8);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);
    // Orient the capsule along its travel direction.
    this.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    this.velocity.copy(direction).normalize().multiplyScalar(60);
  }

  update(dt: number): void {
    this.mesh.position.addScaledVector(this.velocity, dt);
    this.life += dt;
    if (this.life >= this.maxLife) this.alive = false;
  }
}
