import * as THREE from 'three';
import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { Ufo } from '../scene/entities/Ufo';
import { Asteroid } from '../scene/entities/Asteroid';
import type { TargetEntity } from '../scene/entities/TargetEntity';
import { Projectile } from '../scene/entities/Projectile';
import { ParticleSystem } from '../scene/entities/ParticleSystem';
import { Rocket } from '../scene/entities/Rocket';
import { getRocket } from '../config/rockets';
import type { PracticeItem, Subject } from '../curriculum/types';
import { PROGRESSION } from '../config/constants';
import { randRange, shuffle } from '../utils/math';
import { Sfx } from '../utils/audio';

type Theme = 'ufo' | 'asteroid';

// "Shoot the right answer": the question shows at the top, several targets fly
// past each carrying an answer, and the player taps the one holding the correct
// answer. A homing laser flies from the rocket so young kids always connect
// their tap. Wrong targets gently pop with no penalty. The theme (UFOs for the
// inner system, asteroids for the outer system) is purely cosmetic — the same
// engine drives both.
export class UfoGameState implements GameState {
  readonly name = 'ufo-game';
  private game!: Game;
  private root = new THREE.Group();
  private particles = new ParticleSystem();
  private rocket!: Rocket;

  private theme: Theme = 'ufo';
  private planet = '';
  private items: PracticeItem[] = [];
  private qIndex = 0;
  private correctCount = 0;

  private targets: TargetEntity[] = [];
  private shots: { proj: Projectile; target: TargetEntity }[] = [];
  private banner!: HTMLElement;
  private offTap: (() => void) | null = null;
  private locked = false; // brief lock between waves
  private tmp = new THREE.Vector3();

  enter(game: Game, params?: Record<string, unknown>): void {
    this.game = game;
    this.planet = String(params?.planet ?? 'earth');
    const subjects = (params?.subjects as Subject[]) ?? [];
    this.theme = (params?.theme as Theme) ?? 'ufo';
    this.qIndex = 0;
    this.correctCount = 0;

    this.root = new THREE.Group();
    game.scene.scene.add(this.root);
    this.root.add(this.particles.group);

    this.rocket = new Rocket(getRocket(game.profile.rocketId));
    this.rocket.group.position.set(0, -13, 6);
    this.rocket.group.rotation.x = Math.PI; // nose pointing "up" toward the targets
    this.rocket.setThrust(0.3);
    this.root.add(this.rocket.group);

    game.scene.camera.position.set(0, -2, 42);
    game.scene.camera.lookAt(0, 2, 0);

    game.input.joystick.hide();
    game.ui.hud.show();
    game.ui.hud.setStars(game.profile.totalStars);
    game.ui.hud.setLabel(this.theme === 'asteroid' ? 'Asteroid Blast' : 'UFO Mini-Game');
    game.ui.hud.setBack(() => game.states.change('solar-system'));

    // Build the question list from this world's lessons, with a grade-wide
    // fallback so the game is never empty.
    let pool = game.curriculum.practiceForSubjects(subjects, game.profile.gradeBand);
    if (pool.length === 0) pool = game.curriculum.practiceForGrade(game.profile.gradeBand);
    game.picker.reset();
    this.items = game.picker.pick(pool, PROGRESSION.ufoQuestionsPerRound);

    this.banner = el('div', { class: 'ufo-banner' });
    game.ui.overlay.append(this.banner);

    this.offTap = game.input.onTap((t) => this.onTap(t.ndcX, t.ndcY));

    if (this.items.length === 0) {
      this.banner.textContent = 'Loading mission…';
      setTimeout(() => game.states.change('solar-system'), 1200);
      return;
    }
    this.spawnWave();
  }

  private makeTarget(answerId: string, correct: boolean, display: string, isImage: boolean): TargetEntity {
    return this.theme === 'asteroid'
      ? new Asteroid(answerId, correct, display, isImage)
      : new Ufo(answerId, correct, display, isImage);
  }

  private spawnWave(): void {
    this.locked = false;
    const q = this.items[this.qIndex].question;
    const noun = this.theme === 'asteroid' ? 'asteroid' : 'UFO';
    this.banner.innerHTML = `<span class="ufo-banner-hint">🎯 Tap the ${noun}:</span> ${q.prompt}`;

    const answers = shuffle(q.answers);
    const spread = 30 / Math.max(answers.length, 1);
    answers.forEach((ans, i) => {
      const isImage = q.answerStyle === 'picture';
      const display = isImage ? ans.image ?? '❓' : ans.label ?? '?';
      const target = this.makeTarget(ans.id, ans.correct, display, isImage);
      const startX = -15 + i * spread + randRange(-1, 1);
      target.group.position.set(startX, randRange(2, 9), randRange(-2, 2));
      target.velocity.set(randRange(-2.5, 2.5), randRange(-0.4, 0.4), 0);
      this.targets.push(target);
      this.root.add(target.group);
    });
  }

  private onTap(ndcX: number, ndcY: number): void {
    if (this.locked) return;
    const meshes = this.targets.filter((t) => t.alive).map((t) => t.mesh);
    const hits = this.game.scene.pick(ndcX, ndcY, meshes);
    if (hits.length === 0) return;
    const target = hits[0].object.userData.target as TargetEntity;
    if (!target || !target.alive) return;
    this.fireAt(target);
  }

  private fireAt(target: TargetEntity): void {
    const origin = this.rocket.group.position.clone();
    const dir = this.tmp.copy(target.group.position).sub(origin).normalize();
    const proj = new Projectile(origin, dir);
    this.root.add(proj.mesh);
    this.shots.push({ proj, target });
    target.alive = false; // claimed by this shot; prevents double-fire
    Sfx.laser();
  }

  private resolveHit(target: TargetEntity): void {
    const correct = target.correct;
    this.particles.burst(
      target.group.position.clone(),
      correct ? 0x46d369 : 0xff5a76,
      correct ? 30 : 14,
      correct ? 10 : 6
    );
    target.dispose(this.root);
    this.targets = this.targets.filter((t) => t !== target);

    if (correct) {
      Sfx.explode();
      Sfx.star();
      this.correctCount += 1;
      const subject = this.items[this.qIndex].subject;
      this.game.rewards.recordAnswer(this.planet, subject);
      this.game.rewards.awardStars(PROGRESSION.starsPerCorrect, this.planet, subject);
      this.game.ui.hud.setStars(this.game.profile.totalStars);
      this.game.ui.toast('+1 ⭐', 'star');
      this.clearWave();
      this.qIndex += 1;
      this.locked = true;
      if (this.qIndex >= this.items.length) {
        setTimeout(() => this.finish(), 700);
      } else {
        setTimeout(() => this.spawnWave(), 700);
      }
    } else {
      // Wrong target popped — let them keep trying the rest.
      Sfx.wrong();
    }
  }

  private clearWave(): void {
    for (const t of this.targets) t.dispose(this.root);
    this.targets = [];
  }

  private finish(): void {
    this.game.rewards.grantBadge(this.theme === 'asteroid' ? 'asteroid-blaster' : 'ufo-buster');
    this.game.states.change('reward', {
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

    for (const t of this.targets) {
      t.update(dt);
      // Bounce targets off the side walls so they stay on screen.
      if (t.group.position.x > 16 || t.group.position.x < -16) t.velocity.x *= -1;
      if (t.group.position.y > 11 || t.group.position.y < 1) t.velocity.y *= -1;
    }

    // Advance shots; home toward their claimed target and detonate on contact.
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      const toTarget = this.tmp.copy(shot.target.group.position).sub(shot.proj.mesh.position);
      if (toTarget.length() < 1.8) {
        this.root.remove(shot.proj.mesh);
        this.shots.splice(i, 1);
        this.resolveHit(shot.target);
        continue;
      }
      // Gentle homing so the shot always connects.
      shot.proj.velocity.lerp(toTarget.normalize().multiplyScalar(60), 0.2);
      shot.proj.update(dt);
      if (!shot.proj.alive) {
        this.root.remove(shot.proj.mesh);
        this.shots.splice(i, 1);
      }
    }
  }
}
