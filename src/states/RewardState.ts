import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { getBadge } from '../progression/badges';
import { Sfx } from '../utils/audio';
import { narrator } from '../utils/narrator';

// Celebration screen shown after a quiz or mini-game: stars earned, any newly
// unlocked badges, and a big Continue button. Generous and positive.
export class RewardState implements GameState {
  readonly name = 'reward';
  private game!: Game;

  enter(game: Game, params?: Record<string, unknown>): void {
    this.game = game;
    const stars = Number(params?.stars ?? 0);
    const title = String(params?.title ?? 'Great Job!');
    const next = String(params?.next ?? 'solar-system');

    game.input.joystick.hide();
    game.ui.hud.show();
    game.ui.hud.setStars(game.profile.totalStars);
    Sfx.star();

    const starsRow = el(
      'div',
      { class: 'reward-stars' },
      Array.from({ length: Math.max(stars, 1) }, () => el('span', { class: 'reward-star', text: '⭐' }))
    );

    const children: HTMLElement[] = [
      el('h2', { class: 'reward-title', text: title }),
      starsRow,
      el('p', { class: 'screen-sub', text: `You earned ${stars} ⭐ this round!` }),
    ];

    // Surface the most recently earned badge, if any.
    const lastBadge = game.profile.badges[game.profile.badges.length - 1];
    const badge = lastBadge ? getBadge(lastBadge) : undefined;
    if (badge) {
      children.push(
        el('div', { class: 'reward-badge' }, [
          el('span', { class: 'reward-badge-icon', text: badge.icon }),
          el('div', { class: 'reward-badge-text' }, [
            el('strong', { text: badge.name }),
            el('span', { text: badge.description }),
          ]),
        ])
      );
    }

    children.push(
      el('div', { class: 'button-col' }, [
        bigButton('Keep Exploring', () => game.states.change(next), { icon: '🚀' }),
      ])
    );

    game.ui.setPanel(el('div', { class: 'screen center-screen reward-screen' }, children));
    this.confetti();
    narrator.speak(`${title} You earned ${stars} ${stars === 1 ? 'star' : 'stars'}!`);
  }

  private confetti(): void {
    for (let i = 0; i < 24; i++) {
      const c = el('span', {
        class: 'confetti',
        text: ['⭐', '✨', '🌟', '🪐'][i % 4],
        style: {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.8}s`,
          fontSize: `${16 + Math.random() * 20}px`,
        },
      });
      this.game.ui.overlay.append(c);
      setTimeout(() => c.remove(), 2500);
    }
  }

  exit(): void {
    this.game.ui.hidePanel();
  }

  update(): void {}
}
