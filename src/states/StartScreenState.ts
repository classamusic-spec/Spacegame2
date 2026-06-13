import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { narrator } from '../utils/narrator';

// Title screen. Returning players (already onboarded) get a "Keep Exploring"
// button straight to the map; new players go through grade + rocket select.
export class StartScreenState implements GameState {
  readonly name = 'start';
  private game!: Game;

  enter(game: Game): void {
    this.game = game;
    game.ui.hud.hide();
    game.input.joystick.hide();

    const title = el('h1', { class: 'title', html: 'Space&nbsp;Explorer<br><span>Academy</span>' });
    const rocket = el('div', { class: 'title-rocket', text: '🚀' });
    const subtitle = el('p', {
      class: 'subtitle',
      text: 'Fly the solar system and become a space-smart explorer!',
    });

    const onboarded = game.profile.onboarded;
    const play = bigButton(
      onboarded ? 'Keep Exploring' : 'Start Adventure',
      () => game.states.change(onboarded ? 'solar-system' : 'grade-select'),
      { icon: onboarded ? '🪐' : '✨', variant: 'primary' }
    );

    const buttons = el('div', { class: 'button-col' }, [play]);
    if (onboarded) {
      buttons.append(
        bigButton('Change Grade', () => game.states.change('grade-select'), {
          icon: '🎓',
          variant: 'ghost',
        })
      );
    }

    // Read-aloud toggle (also lives in the HUD once in the game).
    const narrationBtn = bigButton(
      this.narrationLabel(),
      () => {
        game.toggleNarration();
        const span = narrationBtn.querySelector('.btn-label');
        if (span) span.textContent = this.narrationLabel();
      },
      { icon: '🔊', variant: 'ghost' }
    );
    buttons.append(narrationBtn);

    game.ui.setPanel(el('div', { class: 'screen center-screen start-screen' }, [
      rocket,
      title,
      subtitle,
      buttons,
    ]));

    narrator.speak('Space Explorer Academy. Fly the solar system and become a space-smart explorer!');
  }

  private narrationLabel(): string {
    return this.game.profile.settings.narration ? 'Read Aloud: On' : 'Read Aloud: Off';
  }

  exit(): void {
    this.game.ui.hidePanel();
  }

  update(): void {
    // Slowly drift the camera for a living title backdrop.
    const t = performance.now() * 0.0001;
    this.game.scene.camera.position.x = Math.sin(t) * 30;
    this.game.scene.camera.position.z = 90 + Math.cos(t) * 10;
    this.game.scene.camera.lookAt(0, 0, 0);
  }
}
