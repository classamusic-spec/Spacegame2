import * as THREE from 'three';

// Ambient background life: occasional shooting stars (meteor streaks) that zip
// across the view from random directions, plus a faint near-star layer that
// drifts to give a gentle "flying through space" feel. Spawned relative to the
// camera so they're visible on every screen (title, menus, flight).

interface Meteor {
  line: THREE.Line;
  head: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  tail: number;
}

const COLORS = [0xffffff, 0x9bd4ff, 0xffe6a8, 0xffc0d8];

export class ShootingStars {
  readonly group = new THREE.Group();
  private pool: Meteor[] = [];
  private nextSpawn = 1.5;
  private tmpFwd = new THREE.Vector3();
  private tmpRight = new THREE.Vector3();
  private tmpUp = new THREE.Vector3(0, 1, 0);

  constructor(private max = 7) {
    this.group.name = 'shooting-stars';
    this.group.renderOrder = 1;
  }

  private makeMeteor(): Meteor {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    this.group.add(line);
    return { line, head: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 1, tail: 6 };
  }

  private spawn(camera: THREE.Camera): void {
    let m = this.pool.find((x) => x.life >= x.maxLife);
    if (!m) {
      if (this.pool.length >= this.max) return;
      m = this.makeMeteor();
      this.pool.push(m);
    }

    // Build a basis from the camera so meteors cross the field of view.
    camera.getWorldDirection(this.tmpFwd);
    this.tmpRight.crossVectors(this.tmpFwd, this.tmpUp).normalize();
    const up = new THREE.Vector3().crossVectors(this.tmpRight, this.tmpFwd).normalize();

    const depth = 120 + Math.random() * 180;
    const side = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 60);
    const high = 25 + Math.random() * 70;
    m.head
      .copy(camera.position)
      .addScaledVector(this.tmpFwd, depth)
      .addScaledVector(this.tmpRight, side)
      .addScaledVector(up, high);

    // Velocity mostly across + downward, so it streaks through the view.
    const speed = 90 + Math.random() * 120;
    m.vel
      .copy(this.tmpRight)
      .multiplyScalar(-Math.sign(side) * (0.7 + Math.random() * 0.6))
      .addScaledVector(up, -(0.4 + Math.random() * 0.5))
      .addScaledVector(this.tmpFwd, (Math.random() - 0.5) * 0.3)
      .normalize()
      .multiplyScalar(speed);

    m.tail = 8 + Math.random() * 16;
    m.life = 0;
    m.maxLife = 0.9 + Math.random() * 0.8;
    const mat = m.line.material as THREE.LineBasicMaterial;
    mat.color.setHex(COLORS[(Math.random() * COLORS.length) | 0]);
  }

  update(dt: number, camera: THREE.Camera): void {
    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0) {
      this.spawn(camera);
      // Occasional quick double; otherwise a calm random cadence.
      this.nextSpawn = Math.random() < 0.15 ? 0.25 : 1.4 + Math.random() * 3.2;
    }

    for (const m of this.pool) {
      if (m.life >= m.maxLife) {
        (m.line.material as THREE.LineBasicMaterial).opacity = 0;
        continue;
      }
      m.life += dt;
      m.head.addScaledVector(m.vel, dt);
      const dir = this.tmpFwd.copy(m.vel).normalize();
      const pos = m.line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, m.head.x, m.head.y, m.head.z);
      pos.setXYZ(
        1,
        m.head.x - dir.x * m.tail,
        m.head.y - dir.y * m.tail,
        m.head.z - dir.z * m.tail
      );
      pos.needsUpdate = true;
      // Fade in quickly, out slowly.
      const t = m.life / m.maxLife;
      (m.line.material as THREE.LineBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.9;
    }
  }
}
