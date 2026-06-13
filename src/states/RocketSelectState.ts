import * as THREE from 'three';
import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { ROCKETS, type RocketId } from '../config/rockets';
import { Rocket } from '../scene/entities/Rocket';

// Lets the player choose one of three rockets, with a live rotating 3D preview
// of the highlighted ship.
export class RocketSelectState implements GameState {
  readonly name = 'rocket-select';
  private game!: Game;
  private previewGroup = new THREE.Group();
  private preview: Rocket | null = null;
  private previewLight = new THREE.PointLight(0xffffff, 60, 0, 1.5);
  private selected: RocketId = 'comet';
  private cardsWrap!: HTMLElement;

  enter(game: Game): void {
    this.game = game;
    game.ui.hud.hide();
    game.input.joystick.hide();
    this.selected = game.profile.rocketId;

    // Frame an empty bit of space for the preview.
    game.scene.camera.position.set(0, 1.5, 10);
    game.scene.camera.lookAt(0, 0, 0);
    this.previewGroup.position.set(0, 1.2, 0);
    game.scene.scene.add(this.previewGroup);
    // A front fill light so the rocket is brightly lit toward the camera,
    // instead of a dark silhouette against the deep-space backdrop.
    this.previewLight.position.set(3, 4, 8);
    game.scene.scene.add(this.previewLight);
    this.buildPreview();

    const heading = el('h2', { class: 'screen-title', text: 'Choose Your Rocket!' });
    this.cardsWrap = el('div', { class: 'rocket-cards' });
    this.renderCards();

    const choose = bigButton('Blast Off!', () => this.confirm(), { icon: '🚀', variant: 'primary' });

    game.ui.setPanel(
      el('div', { class: 'screen rocket-screen' }, [heading, this.cardsWrap, choose])
    );
  }

  private renderCards(): void {
    this.cardsWrap.replaceChildren();
    for (const def of ROCKETS) {
      const card = el('button', { class: `rocket-card ${def.id === this.selected ? 'selected' : ''}` }, [
        el('span', { class: 'rocket-emoji', text: def.emoji }),
        el('span', { class: 'rocket-name', text: def.name }),
        el('span', { class: 'rocket-blurb', text: def.blurb }),
      ]);
      card.addEventListener('click', () => {
        this.selected = def.id;
        this.buildPreview();
        this.renderCards();
      });
      this.cardsWrap.append(card);
    }
  }

  private buildPreview(): void {
    this.previewGroup.clear();
    const def = ROCKETS.find((r) => r.id === this.selected)!;
    this.preview = new Rocket(def);
    // Tilt so the kid sees the side, nose up.
    this.preview.group.rotation.x = -Math.PI / 2.4;
    this.preview.setThrust(0.6);
    this.previewGroup.add(this.preview.group);
  }

  private confirm(): void {
    this.game.profile.rocketId = this.selected;
    this.game.profile.onboarded = true;
    this.game.persistProfile();
    this.game.rewards.grantBadge('first-flight');
    this.game.states.change('solar-system');
  }

  exit(): void {
    this.game.scene.scene.remove(this.previewGroup);
    this.game.scene.scene.remove(this.previewLight);
    this.previewGroup.clear();
    this.preview = null;
    this.game.ui.hidePanel();
  }

  update(dt: number): void {
    this.previewGroup.rotation.y += dt * 0.8;
    this.preview?.update(dt);
  }
}
