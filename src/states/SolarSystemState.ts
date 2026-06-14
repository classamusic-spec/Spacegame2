import * as THREE from 'three';
import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { Sun } from '../scene/entities/Sun';
import { Planet } from '../scene/entities/Planet';
import { Rocket } from '../scene/entities/Rocket';
import { AsteroidBelt } from '../scene/entities/AsteroidBelt';
import { ParticleSystem } from '../scene/entities/ParticleSystem';
import { Projectile } from '../scene/entities/Projectile';
import { getRocket } from '../config/rockets';
import { PLANETS, SYSTEM_RADIUS, type PlanetDef } from '../config/planets';
import { getPlanetProgress } from '../player/PlayerProfile';
import { SUBJECT_ICONS } from '../curriculum/types';
import { FLIGHT } from '../config/constants';
import { damp, easeInOutCubic } from '../utils/math';
import { Sfx } from '../utils/audio';
import { narrator } from '../utils/narrator';
import { Cockpit } from '../ui/components/Cockpit';

type ViewMode = 'third' | 'first';

type Mode = 'fly' | 'traveling' | 'arrived';

// The 3D hub: Sun + orbiting planets + the player's rocket. Kids navigate by
// free-flying with the joystick OR tapping a planet (or its dock button) to
// auto-travel. Arriving at a planet opens the learning menu.
export class SolarSystemState implements GameState {
  readonly name = 'solar-system';
  private game!: Game;

  private root = new THREE.Group();
  private sun!: Sun;
  private planets: Planet[] = [];
  private belt!: AsteroidBelt;
  private rocket!: Rocket;
  private particles = new ParticleSystem();
  private lasers: Projectile[] = [];

  private mode: Mode = 'fly';
  private velocity = new THREE.Vector3();
  private travelTarget: Planet | null = null;
  private travelT = 0;
  private travelFrom = new THREE.Vector3();
  private dock!: HTMLElement;
  private offTap: (() => void) | null = null;
  private offFire: (() => void) | null = null;
  private fireCooldown = 0;
  private tmp = new THREE.Vector3();

  private view: ViewMode = 'third';
  private cockpit!: Cockpit;
  private camForward = new THREE.Vector3(0, 0, -1);

  enter(game: Game): void {
    this.game = game;
    this.root = new THREE.Group();
    game.scene.scene.add(this.root);

    this.sun = new Sun();
    this.root.add(this.sun.group);

    this.planets = PLANETS.map((def) => {
      const p = new Planet(def);
      p.setUnlocked(getPlanetProgress(game.profile, def.id).unlocked);
      this.root.add(p.pivot);
      return p;
    });

    // Decorative asteroid belt between Mars and Jupiter.
    this.belt = new AsteroidBelt();
    this.root.add(this.belt.mesh);

    // Player rocket starts just outside Earth's orbit.
    this.rocket = new Rocket(getRocket(game.profile.rocketId));
    this.rocket.group.position.set(0, 4, 70);
    this.root.add(this.rocket.group);
    this.root.add(this.particles.group);
    this.lasers = [];

    game.scene.camera.position.set(0, 12, 95);

    // HUD + dock.
    game.ui.hud.show();
    game.ui.hud.setStars(game.profile.totalStars);
    game.ui.hud.setLabel('Fly with the joystick — FIRE to shoot!');
    game.ui.hud.setBack(() => game.states.change('start'));
    game.input.showFlightControls();
    this.offFire = game.input.onFire(() => this.shoot());
    this.buildDock();

    // First-person cockpit (matched to the chosen ship) + a view toggle.
    this.cockpit = new Cockpit(game.ui.root, game.profile.rocketId);
    this.view = 'third';
    game.ui.hud.setAction('👁️', () => this.toggleView());

    // Tap a planet in 3D to travel to it.
    this.offTap = game.input.onTap((t) => this.onTap(t.ndcX, t.ndcY));

    // React to unlocks happening while here.
    game.bus.on('planet:unlocked', () => this.refreshUnlocks());
    game.bus.on('star:earned', ({ total }) => game.ui.hud.setStars(total));
  }

  private buildDock(): void {
    this.dock = el('div', { class: 'planet-dock' });
    for (const p of this.planets) {
      const prog = getPlanetProgress(this.game.profile, p.def.id);
      const btn = el('button', { class: `dock-btn ${prog.unlocked ? '' : 'locked'}` }, [
        el('span', { class: 'dock-emoji', text: prog.unlocked ? '🪐' : '🔒' }),
        el('span', { class: 'dock-name', text: p.def.name }),
      ]);
      btn.dataset.planet = p.def.id;
      btn.addEventListener('click', () => {
        if (getPlanetProgress(this.game.profile, p.def.id).unlocked) {
          this.travelTo(p);
        } else {
          this.game.ui.toast(`Earn ${p.def.unlockStars} ⭐ to unlock ${p.def.name}`, 'info');
        }
      });
      this.dock.append(btn);
    }
    this.game.ui.panel.classList.add('hidden');
    this.game.ui.overlay.append(this.dock);
  }

  private refreshUnlocks(): void {
    for (const p of this.planets) {
      p.setUnlocked(getPlanetProgress(this.game.profile, p.def.id).unlocked);
    }
    this.dock.querySelectorAll<HTMLElement>('.dock-btn').forEach((btn) => {
      const id = btn.dataset.planet!;
      const unlocked = getPlanetProgress(this.game.profile, id).unlocked;
      btn.classList.toggle('locked', !unlocked);
      const emoji = btn.querySelector('.dock-emoji');
      if (emoji) emoji.textContent = unlocked ? '🪐' : '🔒';
    });
  }

  private onTap(ndcX: number, ndcY: number): void {
    if (this.mode !== 'fly') return;
    const meshes = this.planets.map((p) => p.mesh);
    const hits = this.game.scene.pick(ndcX, ndcY, meshes);
    if (hits.length === 0) return;
    const id = hits[0].object.userData.planetId as string;
    const planet = this.planets.find((p) => p.def.id === id);
    if (!planet) return;
    if (getPlanetProgress(this.game.profile, id).unlocked) {
      this.travelTo(planet);
    } else {
      this.game.ui.toast(`Earn ${planet.def.unlockStars} ⭐ to unlock ${planet.def.name}`, 'info');
    }
  }

  private travelTo(planet: Planet): void {
    this.mode = 'traveling';
    this.travelTarget = planet;
    this.travelT = 0;
    this.travelFrom.copy(this.rocket.group.position);
    this.rocket.setThrust(1);
    Sfx.whoosh();
    this.game.ui.hud.setLabel(`Flying to ${planet.def.name}…`);
  }

  /** Approach point: just outside the planet, on the side facing the camera. */
  private approachPoint(planet: Planet, out: THREE.Vector3): THREE.Vector3 {
    planet.getWorldPosition(out);
    const offset = this.tmp.copy(out).normalize().multiplyScalar(planet.def.radius * 1.4 + 6);
    return out.add(offset).setY(out.y + 2);
  }

  /** Outer planets host the asteroid-blast mini-game variant; inner host UFOs. */
  private themeFor(planetId: string): 'ufo' | 'asteroid' {
    return ['jupiter', 'saturn', 'uranus', 'neptune'].includes(planetId) ? 'asteroid' : 'ufo';
  }

  // Swap between chase cam and first-person cockpit.
  private toggleView(): void {
    this.view = this.view === 'third' ? 'first' : 'third';
    const first = this.view === 'first';
    this.rocket.group.visible = !first; // hide our own hull from the inside
    this.game.ui.hud.setAction(first ? '🛰️' : '👁️', () => this.toggleView());
    if (first && this.mode !== 'arrived') this.cockpit.show();
    else this.cockpit.hide();
    Sfx.tap();
  }

  private showArrivalMenu(planet: PlanetDef): void {
    this.mode = 'arrived';
    this.game.input.hideFlightControls();
    this.dock.classList.add('hidden');
    this.cockpit.hide();
    // While in the planet menu, the top-left back button returns to space.
    this.game.ui.hud.setBack(() => this.leaveMenu());

    const gradeBand = this.game.profile.gradeBand;
    const lessons = this.game.curriculum.lessonsForSubjects(planet.subjects, gradeBand);

    const body: HTMLElement[] = [
      el('div', { class: 'arrival-planet', text: '🪐' }),
      el('h2', { class: 'screen-title', text: planet.world }),
      el('p', { class: 'screen-sub', text: planet.blurb }),
    ];

    if (lessons.length > 0) {
      body.push(el('p', { class: 'menu-hint', text: 'Pick a lesson:' }));
      const list = el('div', { class: 'lesson-list' });
      for (const lesson of lessons) {
        const done = this.game.rewards.hasCompletedLesson(lesson.id);
        const item = el('button', { class: `lesson-item ${done ? 'done' : ''}` }, [
          el('span', { class: 'lesson-item-icon', text: SUBJECT_ICONS[lesson.subject] }),
          el('span', { class: 'lesson-item-title', text: lesson.title }),
          el('span', { class: 'lesson-item-check', text: done ? '✅' : '' }),
        ]);
        item.addEventListener('click', () => this.startLesson(lesson.id, planet.id));
        list.append(item);
      }
      // A replayable "Mixed Review" that shuffles questions from this world.
      if (lessons.length >= 2) {
        const review = el('button', { class: 'lesson-item review-item' }, [
          el('span', { class: 'lesson-item-icon', text: '🌟' }),
          el('span', { class: 'lesson-item-title', text: 'Mixed Review' }),
          el('span', { class: 'lesson-item-check', text: '🔁' }),
        ]);
        review.addEventListener('click', () =>
          this.game.states.change('lesson', { review: true, planet: planet.id })
        );
        list.append(review);
      }
      body.push(list);
    } else {
      body.push(el('p', { class: 'menu-hint', text: 'More lessons coming soon — try the mini-game!' }));
    }

    const theme = this.themeFor(planet.id);
    body.push(
      el('div', { class: 'button-col' }, [
        bigButton(
          theme === 'asteroid' ? 'Asteroid Blast' : 'UFO Mini-Game',
          () => this.startUfo(planet),
          { icon: theme === 'asteroid' ? '☄️' : '🛸', variant: 'ghost' }
        ),
        bigButton('Back to Space', () => this.leaveMenu(), { icon: '🚀', variant: 'ghost' }),
      ])
    );

    this.game.ui.setPanel(el('div', { class: 'screen lesson-menu-screen' }, body));
    narrator.speak(`${planet.world}. ${planet.blurb} Pick a lesson.`);
  }

  private startLesson(lessonId: string, planet: string): void {
    this.game.states.change('lesson', { lessonId, planet });
  }

  private startUfo(planet: PlanetDef): void {
    this.game.states.change('ufo-game', {
      planet: planet.id,
      subjects: planet.subjects,
      theme: this.themeFor(planet.id),
    });
  }

  private leaveMenu(): void {
    this.game.ui.hidePanel();
    this.dock.classList.remove('hidden');
    this.game.input.showFlightControls();
    this.mode = 'fly';
    this.game.ui.hud.setLabel('Fly with the joystick — FIRE to shoot!');
    // Restore the top-left back button to "leave the map" (to the title).
    this.game.ui.hud.setBack(() => this.game.states.change('start'));
    if (this.view === 'first') this.cockpit.show();
    // Nudge the rocket back out so the player is free-flying again.
    this.velocity.set(0, 0, 0.001);
  }

  exit(): void {
    this.offTap?.();
    this.offFire?.();
    this.game.input.hideFlightControls();
    this.game.scene.scene.remove(this.root);
    this.root.clear();
    this.dock.remove();
    this.cockpit.destroy();
    this.game.ui.hidePanel();
    this.game.ui.hud.setBack(null);
    this.game.ui.hud.setAction(null);
  }

  update(dt: number): void {
    this.sun.update(dt);
    this.belt.update(dt);
    const orbiting = this.mode === 'fly';
    for (const p of this.planets) p.update(dt, orbiting);

    if (this.mode === 'traveling' && this.travelTarget) {
      this.travelT = Math.min(1, this.travelT + dt / FLIGHT.travelDuration);
      const target = this.approachPoint(this.travelTarget, this.tmp.clone());
      const eased = easeInOutCubic(this.travelT);
      this.rocket.group.position.lerpVectors(this.travelFrom, target, eased);
      this.rocket.group.lookAt(this.travelTarget.getWorldPosition(new THREE.Vector3()));
      if (this.travelT >= 1) {
        this.rocket.setThrust(0.2);
        this.showArrivalMenu(this.travelTarget.def);
      }
    } else if (this.mode === 'fly') {
      this.handleFreeFlight(dt);
    }

    this.rocket.update(dt);
    this.updateLasers(dt);
    this.updateCamera(dt);
  }

  // Fire a laser bolt forward from the ship's nose.
  private shoot(): void {
    if (this.mode !== 'fly' || this.fireCooldown > 0) return;
    this.fireCooldown = 0.16;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rocket.group.quaternion);
    const origin = this.rocket.group.position.clone().addScaledVector(fwd, 2.4);
    const proj = new Projectile(origin, fwd);
    this.root.add(proj.mesh);
    this.lasers.push(proj);
    this.particles.burst(origin, 0x8affff, 5, 4);
    Sfx.laser();
  }

  private updateLasers(dt: number): void {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.particles.update(dt);
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const p = this.lasers[i];
      p.update(dt);
      // Pop a belt asteroid if a bolt flies close enough.
      const hit = this.belt.tryHit(p.mesh.position, 2.4);
      if (hit) {
        this.particles.burst(hit, 0xffd24a, 20, 9);
        Sfx.explode();
        p.alive = false;
      }
      if (!p.alive) {
        this.root.remove(p.mesh);
        this.lasers.splice(i, 1);
      }
    }
  }

  // Joystick / keyboard free-flight: steer the rocket around space.
  private handleFreeFlight(dt: number): void {
    const move = this.game.input.move;
    const accel = this.game.input.boost ? 90 : 42; // BOOST button / Shift
    this.velocity.x += move.x * accel * dt;
    this.velocity.z += move.y * accel * dt;
    this.velocity.multiplyScalar(this.game.input.boost ? 0.94 : 0.9); // damping
    this.rocket.group.position.addScaledVector(this.velocity, dt);
    // Keep the player within a friendly bounding sphere around the system.
    const dist = this.rocket.group.position.length();
    if (dist > SYSTEM_RADIUS) this.rocket.group.position.multiplyScalar(SYSTEM_RADIUS / dist);
    const speed = this.velocity.length();
    this.rocket.setThrust(Math.min(1, speed * 0.05));
    if (speed > 0.5) {
      const heading = this.tmp.copy(this.rocket.group.position).add(this.velocity);
      this.rocket.group.lookAt(heading);
    }
  }

  private updateCamera(dt: number): void {
    const cam = this.game.scene.camera;
    if (this.view === 'first') {
      this.updateCockpitCamera(dt);
      return;
    }
    const desired = this.tmp.copy(this.rocket.group.position);
    desired.y += FLIGHT.cameraHeight;
    desired.z += FLIGHT.cameraDistance;
    cam.position.x = damp(cam.position.x, desired.x, FLIGHT.cameraLambda, dt);
    cam.position.y = damp(cam.position.y, desired.y, FLIGHT.cameraLambda, dt);
    cam.position.z = damp(cam.position.z, desired.z, FLIGHT.cameraLambda, dt);
    cam.lookAt(this.rocket.group.position);
  }

  // First-person: sit in the ship looking out along the nose direction.
  private updateCockpitCamera(dt: number): void {
    const cam = this.game.scene.camera;
    // The ship is modelled facing -Z, so its nose direction is -Z in local space.
    const fwd = this.tmp.set(0, 0, -1).applyQuaternion(this.rocket.group.quaternion);
    const lambda = 9;
    this.camForward.x = damp(this.camForward.x, fwd.x, lambda, dt);
    this.camForward.y = damp(this.camForward.y, fwd.y, lambda, dt);
    this.camForward.z = damp(this.camForward.z, fwd.z, lambda, dt);
    this.camForward.normalize();

    const eye = this.rocket.group.position;
    cam.position.set(
      eye.x + this.camForward.x * 0.3,
      eye.y + 0.5 + this.camForward.y * 0.3,
      eye.z + this.camForward.z * 0.3
    );
    cam.lookAt(
      eye.x + this.camForward.x * 20,
      eye.y + 0.5 + this.camForward.y * 20,
      eye.z + this.camForward.z * 20
    );
  }
}
