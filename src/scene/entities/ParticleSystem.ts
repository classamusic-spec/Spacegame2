import * as THREE from 'three';
import { makeGlowSprite } from '../textures';
import { randRange } from '../../utils/math';

// Cheap sprite-based particle bursts for explosions and correct-answer
// sparkles. Particles are pooled and additive-blended so they glow with bloom.
interface Particle {
  sprite: THREE.Sprite;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  readonly group = new THREE.Group();
  private particles: Particle[] = [];
  private glow = makeGlowSprite('#ffffff');

  constructor() {
    this.group.name = 'particles';
  }

  burst(position: THREE.Vector3, color: number, count = 24, speed = 8): void {
    const col = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.glow,
          color: col,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sprite.position.copy(position);
      const scale = randRange(0.5, 1.4);
      sprite.scale.setScalar(scale);
      this.group.add(sprite);

      const dir = new THREE.Vector3(
        randRange(-1, 1),
        randRange(-1, 1),
        randRange(-1, 1)
      ).normalize();
      const sp = randRange(speed * 0.4, speed);
      this.particles.push({
        sprite,
        vx: dir.x * sp,
        vy: dir.y * sp,
        vz: dir.z * sp,
        life: 0,
        maxLife: randRange(0.5, 1.1),
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      const t = p.life / p.maxLife;
      if (t >= 1) {
        this.group.remove(p.sprite);
        (p.sprite.material as THREE.SpriteMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.sprite.position.z += p.vz * dt;
      // Slow down + fade out.
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vz *= 0.94;
      (p.sprite.material as THREE.SpriteMaterial).opacity = 1 - t;
      p.sprite.scale.setScalar((1 - t) * 1.4 + 0.2);
    }
  }
}
