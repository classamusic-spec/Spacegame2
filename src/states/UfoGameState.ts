import * as THREE from 'three';
import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { Ufo } from '../scene/entities/Ufo';
import { Projectile } from '../scene/entities/Projectile';
import { ParticleSystem } from '../scene/entities/ParticleSystem';
import { Rocket } from '../scene/entities/Rocket';
import { getRocket } from '../config/rockets';
import type { Question, Subject } from '../curriculum/types';
import { PROGRESSION } from '../config/constants';
import { randRange, shuffle } from '../utils/math';
import { Sfx } from '../utils/audio';

// "Shoot the right answer": the question shows at the top, several UFOs fly past
// each carrying an answer, and the player taps the UFO holding the correct one.
// A homing laser flies from the rocket so young kids always connect their tap.
// Wrong UFOs gently pop with no penalty.
export class UfoGameState implements GameState {
  readonly name = 'ufo-game';
  private game!: Game;
  private root = new THREE.Group();
  private particles = new ParticleSystem();
  private rocket!: Rocket;

  private planet = '';
  private subject: Subject = 'science';
  private questions: Question[] = [];
  private qIndex = 0;
  private correctCount = 0;

  private ufos: Ufo[] = [];
  private shots: { proj: Projectile; target: Ufo | null }[] = [];
  private banner!: HTMLElement;
  private offTap: (() => void) | null = null;
  private locked = false; // brief lock between waves
  private tmp = new THREE.Vector3();

  enter(game: Game, params?: Record<string, unknown>): void {
    this.game = game;
    this.planet = String(params?.planet ?? 'earth');
    this.subject = (params?.subject as Subject) ?? 'science';
    this.qIndex = 0;
    this.correctCount = 0;

    this.root = new THREE.Group();
    game.scene.scene.add(this.root);
    this.root.add(this.particles.group);

    this.rocket = new Rocket(getRocket(game.profile.rocketId));
    this.rocket.group.position.set(0, -13, 6);
    this.rocket.group.rotation.x = Math.PI; // nose pointing "up" toward the UFOs
    this.rocket.setThrust(0.3);
    this.root.add(this.rocket.group);

    game.scene.camera.position.set(0, -2, 42);
    game.scene.camera.lookAt(0, 2, 0);

    game.input.joystick.hide();
    game.ui.hud.show();
    game.ui.hud.setStars(game.profile.totalStars);
    game.ui.hud.setLabel('UFO Mini-Game');
    game.ui.hud.setBack(() => game.states.change('solar-system'));

    // Build question list, with graceful fallbacks so the game is never empty.
    let pool = game.curriculum.query(this.planet, game.profile.gradeBand, this.subject);
    if (pool.length === 0) {
      pool = game.curriculum.all().filter((q) => q.gradeBand === game.profile.gradeBand);
    }
    game.picker.reset();
    this.questions = game.picker.pick(pool, PROGRESSION.ufoQuestionsPerRound);

    this.banner = el('div', { class: 'ufo-banner' });
    game.ui.overlay.append(this.banner);

    this.offTap = game.input.onTap((t) => this.onTap(t.ndcX, t.ndcY));

    if (this.questions.length === 0) {
      this.banner.textContent = 'Loading mission…';
      setTimeout(() => game.states.change('solar-system'), 1200);
      return;
    }
    this.spawnWave();
  }

  private spawnWave(): void {
    this.locked = false;
    const q = this.questions[this.qIndex];
    this.banner.innerHTML = `<span class="ufo-banner-hint">🎯 Tap the UFO:</span> ${q.prompt}`;

    const answers = shuffle(q.answers);
    const spread = 30 / Math.max(answers.length, 1);
    answers.forEach((ans, i) => {
      const isImage = q.answerStyle === 'picture';
      const display = isImage ? ans.image ?? '❓' : ans.label ?? '?';
      const ufo = new Ufo(ans.id, ans.correct, display, isImage);
      const startX = -15 + i * spread + randRange(-1, 1);
      ufo.group.position.set(startX, randRange(2, 9), randRange(-2, 2));
      ufo.velocity.set(randRange(-2.5, 2.5), randRange(-0.4, 0.4), 0);
      this.ufos.push(ufo);
      this.root.add(ufo.group);
    });
  }

  private onTap(ndcX: number, ndcY: number): void {
    if (this.locked) return;
    const meshes = this.ufos.filter((u) => u.alive).map((u) => u.mesh);
    const hits = this.game.scene.pick(ndcX, ndcY, meshes);
    if (hits.length === 0) return;
    const ufo = hits[0].object.userData.ufo as Ufo;
    if (!ufo || !ufo.alive) return;
    this.fireAt(ufo);
  }

  private fireAt(ufo: Ufo): void {
    const origin = this.rocket.group.position.clone();
    const dir = this.tmp.copy(ufo.group.position).sub(origin).normalize();
    const proj = new Projectile(origin, dir);
    this.root.add(proj.mesh);
    this.shots.push({ proj, target: ufo });
    ufo.alive = false; // claimed by this shot; prevents double-fire
    Sfx.laser();
  }

  private resolveHit(ufo: Ufo): void {
    const correct = ufo.correct;
    this.particles.burst(
      ufo.group.position.clone(),
      correct ? 0x46d369 : 0xff5a76,
      correct ? 30 : 14,
      correct ? 10 : 6
    );
    ufo.dispose(this.root);
    this.ufos = this.ufos.filter((u) => u !== ufo);

    if (correct) {
      Sfx.explode();
      Sfx.star();
      this.correctCount += 1;
      this.game.rewards.recordAnswer(this.planet, this.subject);
      this.game.rewards.awardStars(PROGRESSION.starsPerCorrect, this.planet, this.subject);
      this.game.ui.hud.setStars(this.game.profile.totalStars);
      this.game.ui.toast('+1 ⭐', 'star');
      this.clearWave();
      this.qIndex += 1;
      this.locked = true;
      if (this.qIndex >= this.questions.length) {
        setTimeout(() => this.finish(), 700);
      } else {
        setTimeout(() => this.spawnWave(), 700);
      }
    } else {
      // Wrong UFO popped — let them keep trying the rest.
      Sfx.wrong();
    }
  }

  private clearWave(): void {
    for (const u of this.ufos) u.dispose(this.root);
    this.ufos = [];
  }

  private finish(): void {
    this.game.rewards.grantBadge('ufo-buster');
    this.game.states.change('reward', {
      planet: this.planet,
      subject: this.subject,
      stars: this.correctCount,
      title: 'Mission Complete!',
      next: 'solar-system',
    });
  }

  exit(): void {
    this.offTap?.();
    this.clearWave();
    this.banner.remove();
    this.game.scene.scene.remove(this.root);
    this.root.clear();
    this.game.ui.hud.setBack(null);
  }

  update(dt: number): void {
    this.rocket.update(dt);
    this.particles.update(dt);

    for (const u of this.ufos) {
      u.update(dt);
      // Bounce UFOs off the side walls so they stay on screen.
      if (u.group.position.x > 16 || u.group.position.x < -16) u.velocity.x *= -1;
      if (u.group.position.y > 11 || u.group.position.y < 1) u.velocity.y *= -1;
    }

    // Advance shots; home toward their claimed UFO and detonate on contact.
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      const target = shot.target;
      if (target) {
        const toTarget = this.tmp.copy(target.group.position).sub(shot.proj.mesh.position);
        if (toTarget.length() < 1.6) {
          this.root.remove(shot.proj.mesh);
          this.shots.splice(i, 1);
          this.resolveHit(target);
          continue;
        }
        // Gentle homing so the shot always connects.
        shot.proj.velocity.lerp(toTarget.normalize().multiplyScalar(60), 0.2);
      }
      shot.proj.update(dt);
      if (!shot.proj.alive) {
        this.root.remove(shot.proj.mesh);
        this.shots.splice(i, 1);
      }
    }
  }
}
