import * as THREE from 'three';
import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { Sun } from '../scene/entities/Sun';
import { Planet } from '../scene/entities/Planet';
import { Rocket } from '../scene/entities/Rocket';
import { getRocket } from '../config/rockets';
import { PLANETS, type PlanetDef } from '../config/planets';
import { getPlanetProgress } from '../player/PlayerProfile';
import { SUBJECT_LABELS, SUBJECT_ICONS, type Subject } from '../curriculum/types';
import { FLIGHT } from '../config/constants';
import { damp, easeInOutCubic } from '../utils/math';
import { Sfx } from '../utils/audio';

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
  private rocket!: Rocket;

  private mode: Mode = 'fly';
  private velocity = new THREE.Vector3();
  private travelTarget: Planet | null = null;
  private travelT = 0;
  private travelFrom = new THREE.Vector3();
  private dock!: HTMLElement;
  private offTap: (() => void) | null = null;
  private tmp = new THREE.Vector3();

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

    // Player rocket starts just outside Earth's orbit.
    this.rocket = new Rocket(getRocket(game.profile.rocketId));
    this.rocket.group.position.set(0, 4, 70);
    this.root.add(this.rocket.group);

    game.scene.camera.position.set(0, 12, 95);

    // HUD + dock.
    game.ui.hud.show();
    game.ui.hud.setStars(game.profile.totalStars);
    game.ui.hud.setLabel('Pick a planet to explore!');
    game.ui.hud.setBack(() => game.states.change('start'));
    game.input.joystick.show();
    this.buildDock();

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
    const offset = this.tmp.copy(out).normalize().multiplyScalar(planet.def.radius + 6);
    return out.add(offset).setY(out.y + 2);
  }

  private showArrivalMenu(planet: PlanetDef): void {
    this.mode = 'arrived';
    this.game.input.joystick.hide();
    this.dock.classList.add('hidden');

    const subjects = this.game.curriculum.availableSubjects(planet.id, this.game.profile.gradeBand);
    const subjectBtns = subjects.map((s) =>
      bigButton(SUBJECT_LABELS[s as Subject] ?? s, () => this.startQuiz(planet.id, s as Subject), {
        icon: SUBJECT_ICONS[s as Subject] ?? '⭐',
        variant: 'primary',
      })
    );

    const body: HTMLElement[] = [
      el('div', { class: 'arrival-planet', text: '🪐' }),
      el('h2', { class: 'screen-title', text: planet.name }),
      el('p', { class: 'screen-sub', text: planet.blurb }),
    ];

    if (subjectBtns.length > 0) {
      body.push(el('p', { class: 'menu-hint', text: 'What do you want to learn?' }));
      body.push(el('div', { class: 'subject-grid' }, subjectBtns));
    } else {
      body.push(el('p', { class: 'menu-hint', text: 'More lessons coming soon — try the mini-game!' }));
    }

    body.push(
      el('div', { class: 'button-col' }, [
        bigButton('UFO Mini-Game', () => this.startUfo(planet.id, subjects[0] as Subject), {
          icon: '🛸',
          variant: subjectBtns.length ? 'ghost' : 'primary',
        }),
        bigButton('Back to Space', () => this.leaveMenu(), { icon: '🚀', variant: 'ghost' }),
      ])
    );

    this.game.ui.setPanel(el('div', { class: 'screen center-screen arrival-screen' }, body));
  }

  private startQuiz(planet: string, subject: Subject): void {
    this.game.states.change('planet-quiz', { planet, subject });
  }

  private startUfo(planet: string, subject: Subject): void {
    this.game.states.change('ufo-game', { planet, subject: subject ?? 'science' });
  }

  private leaveMenu(): void {
    this.game.ui.hidePanel();
    this.dock.classList.remove('hidden');
    this.game.input.joystick.show();
    this.mode = 'fly';
    this.game.ui.hud.setLabel('Pick a planet to explore!');
    // Nudge the rocket back out so the player is free-flying again.
    this.velocity.set(0, 0, 0.001);
  }

  exit(): void {
    this.offTap?.();
    this.game.scene.scene.remove(this.root);
    this.root.clear();
    this.dock.remove();
    this.game.ui.hidePanel();
    this.game.ui.hud.setBack(null);
  }

  update(dt: number): void {
    this.sun.update(dt);
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
    this.updateCamera(dt);
  }

  // Joystick / keyboard free-flight: steer the rocket around space.
  private handleFreeFlight(dt: number): void {
    const move = this.game.input.move;
    const accel = 40;
    this.velocity.x += move.x * accel * dt;
    this.velocity.z += move.y * accel * dt;
    this.velocity.multiplyScalar(0.9); // damping
    this.rocket.group.position.addScaledVector(this.velocity, dt);
    // Keep the player within a friendly bounding sphere around the system.
    const dist = this.rocket.group.position.length();
    if (dist > 120) this.rocket.group.position.multiplyScalar(120 / dist);
    const speed = this.velocity.length();
    this.rocket.setThrust(Math.min(1, speed * 0.05));
    if (speed > 0.5) {
      const heading = this.tmp.copy(this.rocket.group.position).add(this.velocity);
      this.rocket.group.lookAt(heading);
    }
  }

  private updateCamera(dt: number): void {
    const cam = this.game.scene.camera;
    const desired = this.tmp.copy(this.rocket.group.position);
    desired.y += FLIGHT.cameraHeight;
    desired.z += FLIGHT.cameraDistance;
    cam.position.x = damp(cam.position.x, desired.x, FLIGHT.cameraLambda, dt);
    cam.position.y = damp(cam.position.y, desired.y, FLIGHT.cameraLambda, dt);
    cam.position.z = damp(cam.position.z, desired.z, FLIGHT.cameraLambda, dt);
    cam.lookAt(this.rocket.group.position);
  }
}
