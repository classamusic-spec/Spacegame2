import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { narrator } from '../utils/narrator';
import {
  SUBJECTS,
  SUBJECT_LABELS,
  SUBJECT_ICONS,
  GRADE_BAND_LABELS,
} from '../curriculum/types';
import { PLANETS } from '../config/planets';
import { getPlanetProgress } from '../player/PlayerProfile';
import { BADGES } from '../progression/badges';

// A parent-facing dashboard: overall stats, per-subject lesson progress for the
// child's grade, a badge trophy shelf, and settings (read-aloud, sound, change
// grade, reset). Re-renders in place when a toggle changes.
export class ProgressState implements GameState {
  readonly name = 'progress';
  private game!: Game;
  private resetArmed = false;

  enter(game: Game): void {
    this.game = game;
    game.input.joystick.hide();
    game.ui.hud.hide();
    this.resetArmed = false;
    this.render();
    narrator.speak('My progress. Here is what you have learned!');
  }

  private render(): void {
    const p = this.game.profile;
    const band = p.gradeBand;

    // ----- Top stats -----
    const planetsUnlocked = PLANETS.filter((pl) => getPlanetProgress(p, pl.id).unlocked).length;
    const stats = el('div', { class: 'stat-row' }, [
      this.stat('⭐', String(p.totalStars), 'Stars'),
      this.stat('📚', String(p.lessonsCompleted.length), 'Lessons'),
      this.stat('🪐', `${planetsUnlocked}/${PLANETS.length}`, 'Worlds'),
      this.stat('🏅', `${p.badges.length}/${BADGES.length}`, 'Badges'),
    ]);

    // ----- Per-subject progress for the current grade -----
    const subjectRows: HTMLElement[] = [];
    for (const s of SUBJECTS) {
      const lessons = this.game.curriculum.lessonsFor(s, band);
      if (lessons.length === 0) continue;
      const done = lessons.filter((l) => p.lessonsCompleted.includes(l.id)).length;
      const pct = Math.round((done / lessons.length) * 100);
      subjectRows.push(
        el('div', { class: 'subj-row' }, [
          el('span', { class: 'subj-icon', text: SUBJECT_ICONS[s] }),
          el('div', { class: 'subj-mid' }, [
            el('div', { class: 'subj-name', text: SUBJECT_LABELS[s] }),
            el('div', { class: 'subj-bar' }, [
              el('div', { class: `subj-fill ${done === lessons.length ? 'complete' : ''}`, style: { width: `${pct}%` } }),
            ]),
          ]),
          el('span', { class: 'subj-count', text: `${done}/${lessons.length}` }),
        ])
      );
    }

    // ----- Badge trophy shelf -----
    const trophies = el(
      'div',
      { class: 'trophy-shelf' },
      BADGES.map((b) => {
        const earned = p.badges.includes(b.id);
        return el('div', { class: `trophy ${earned ? 'earned' : 'locked'}`, attrs: { title: b.description } }, [
          el('span', { class: 'trophy-icon', text: earned ? b.icon : '🔒' }),
          el('span', { class: 'trophy-name', text: earned ? b.name : '???' }),
        ]);
      })
    );

    // ----- Settings -----
    const settings = el('div', { class: 'settings-row' }, [
      this.toggle('🔊 Read Aloud', p.settings.narration, () => {
        this.game.toggleNarration();
        this.render();
      }),
      this.toggle('🔔 Sound', p.settings.sfx, () => {
        this.game.toggleSfx();
        this.render();
      }),
      this.toggle('🎵 Music', p.settings.music, () => {
        this.game.toggleMusic();
        this.render();
      }),
    ]);

    const actions = el('div', { class: 'button-col' }, [
      bigButton('Change Grade', () => this.game.states.change('grade-select'), { icon: '🎓', variant: 'ghost' }),
      this.resetButton(),
      bigButton('Back', () => this.game.states.change('start'), { icon: '⬅️', variant: 'ghost' }),
    ]);

    this.game.ui.setPanel(
      el('div', { class: 'screen progress-screen' }, [
        el('h2', { class: 'screen-title', text: 'My Progress' }),
        el('p', { class: 'screen-sub', text: `${p.name} • ${GRADE_BAND_LABELS[band]}` }),
        stats,
        el('h3', { class: 'section-head', text: 'Subjects' }),
        el('div', { class: 'subj-list' }, subjectRows),
        el('h3', { class: 'section-head', text: 'Badges' }),
        trophies,
        el('h3', { class: 'section-head', text: 'Settings' }),
        settings,
        actions,
      ])
    );
  }

  private stat(icon: string, value: string, label: string): HTMLElement {
    return el('div', { class: 'stat-card' }, [
      el('span', { class: 'stat-icon', text: icon }),
      el('span', { class: 'stat-value', text: value }),
      el('span', { class: 'stat-label', text: label }),
    ]);
  }

  private toggle(label: string, on: boolean, onClick: () => void): HTMLButtonElement {
    const btn = el('button', { class: `setting-toggle ${on ? 'on' : 'off'}` }, [
      el('span', { text: label }),
      el('span', { class: 'toggle-pill', text: on ? 'ON' : 'OFF' }),
    ]);
    btn.addEventListener('click', onClick);
    return btn;
  }

  private resetButton(): HTMLButtonElement {
    const btn = bigButton(
      this.resetArmed ? 'Tap again to erase!' : 'Reset Progress',
      () => {
        if (!this.resetArmed) {
          this.resetArmed = true;
          this.render();
          setTimeout(() => {
            this.resetArmed = false;
          }, 4000);
        } else {
          this.game.resetProgress();
          this.game.states.change('start');
        }
      },
      { icon: '🧹', variant: 'ghost' }
    );
    if (this.resetArmed) btn.classList.add('danger');
    return btn;
  }

  exit(): void {
    narrator.stop();
    this.game.ui.hidePanel();
  }

  update(): void {}
}
