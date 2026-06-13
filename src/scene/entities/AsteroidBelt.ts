import * as THREE from 'three';

// A decorative ring of asteroids between Mars and Jupiter, drawn with a single
// InstancedMesh so hundreds of rocks cost almost nothing. Slowly rotates as a
// whole to feel alive.
export class AsteroidBelt {
  readonly mesh: THREE.InstancedMesh;
  private spin: number;

  constructor(innerRadius = 74, outerRadius = 88, count = 220) {
    const geo = new THREE.DodecahedronGeometry(0.35, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a8175, roughness: 1, metalness: 0.1 });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.spin = 0.01;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 4, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.4 + Math.random() * 1.6;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.name = 'asteroid-belt';
  }

  update(dt: number): void {
    this.mesh.rotation.y += dt * this.spin;
  }
}
