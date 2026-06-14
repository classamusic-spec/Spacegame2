import * as THREE from 'three';

// A decorative ring of asteroids between Mars and Jupiter, drawn with a single
// InstancedMesh so hundreds of rocks cost almost nothing. Slowly rotates as a
// whole to feel alive, and individual rocks can be "popped" by laser fire.
export class AsteroidBelt {
  readonly mesh: THREE.InstancedMesh;
  private spin: number;
  private count: number;
  private alive: boolean[];
  private localPos: THREE.Vector3[] = [];
  private scales: number[] = [];
  private tmpMat = new THREE.Matrix4();
  private tmpVec = new THREE.Vector3();

  constructor(innerRadius = 74, outerRadius = 88, count = 220) {
    const geo = new THREE.DodecahedronGeometry(0.35, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a8175, roughness: 1, metalness: 0.1 });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.spin = 0.01;
    this.count = count;
    this.alive = new Array(count).fill(true);

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
      this.localPos.push(dummy.position.clone());
      this.scales.push(s);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.name = 'asteroid-belt';
  }

  /**
   * Find the nearest living asteroid within `radius` of a world-space point and
   * pop it (hide the instance). Returns the rock's world position, or null.
   */
  tryHit(worldPoint: THREE.Vector3, radius: number): THREE.Vector3 | null {
    this.mesh.updateMatrixWorld();
    let best = -1;
    let bestDist = radius;
    for (let i = 0; i < this.count; i++) {
      if (!this.alive[i]) continue;
      this.tmpVec.copy(this.localPos[i]).applyMatrix4(this.mesh.matrixWorld);
      const d = this.tmpVec.distanceTo(worldPoint);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best < 0) return null;
    const hitPos = this.localPos[best].clone().applyMatrix4(this.mesh.matrixWorld);
    this.alive[best] = false;
    // Collapse the instance to zero scale so it disappears.
    this.tmpMat.makeScale(0, 0, 0).setPosition(this.localPos[best]);
    this.mesh.setMatrixAt(best, this.tmpMat);
    this.mesh.instanceMatrix.needsUpdate = true;
    return hitPos;
  }

  update(dt: number): void {
    this.mesh.rotation.y += dt * this.spin;
  }
}
