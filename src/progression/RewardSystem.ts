import type { EventBus } from '../core/EventBus';
import type { SaveManager } from '../player/SaveManager';
import { getPlanetProgress, type PlayerProfile } from '../player/PlayerProfile';
import { PLANETS } from '../config/planets';
import { PROGRESSION } from '../config/constants';

// Owns all "you earned something" logic: stars, planet unlocks, badges. It
// mutates the profile, persists it, and emits events the UI reacts to. Kept
// generous and positive — never punitive.
export class RewardSystem {
  constructor(
    private profile: PlayerProfile,
    private save: SaveManager,
    private bus: EventBus
  ) {}

  /** Recompute which planets should be unlocked based on total stars. */
  syncUnlocks(): void {
    for (const planet of PLANETS) {
      const prog = getPlanetProgress(this.profile, planet.id);
      if (!prog.unlocked && this.profile.totalStars >= planet.unlockStars) {
        prog.unlocked = true;
        if (planet.unlockStars > 0) {
          this.bus.emit('planet:unlocked', { planet: planet.id });
          this.grantBadge('planet-unlocker');
        }
      }
    }
    this.persist();
  }

  awardStars(amount: number, planetId: string, subject: string): void {
    if (amount <= 0) return;
    const first = this.profile.totalStars === 0;
    this.profile.totalStars += amount;
    const prog = getPlanetProgress(this.profile, planetId);
    prog.stars += amount;
    this.bus.emit('star:earned', { amount, total: this.profile.totalStars });
    if (first) this.grantBadge('first-star');
    this.checkSubjectBadges(subject);
    this.syncUnlocks();
  }

  recordAnswer(planetId: string, subject: string): void {
    const prog = getPlanetProgress(this.profile, planetId);
    prog.questionsAnswered += 1;
    this.subjectCounts[subject] = (this.subjectCounts[subject] ?? 0) + 1;
    this.persist();
  }

  completeQuiz(planetId: string, subject: string): void {
    const prog = getPlanetProgress(this.profile, planetId);
    if (!prog.subjectsCompleted.includes(subject)) {
      prog.subjectsCompleted.push(subject);
    }
    if (planetId === 'earth') this.grantBadge('earth-explorer');
    if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(planetId)) this.grantBadge('gas-giant');
    this.bus.emit('planet:completed', { planet: planetId });
    this.persist();
  }

  completeLesson(lessonId: string, planetId: string, subject: string): void {
    if (!this.profile.lessonsCompleted.includes(lessonId)) {
      this.profile.lessonsCompleted.push(lessonId);
    }
    this.completeQuiz(planetId, subject);
    if (subject === 'math') this.grantBadge('math-star');
    if (subject === 'phonics') this.grantBadge('phonics-pro');
  }

  hasCompletedLesson(lessonId: string): boolean {
    return this.profile.lessonsCompleted.includes(lessonId);
  }

  grantBadge(badgeId: string): void {
    if (this.profile.badges.includes(badgeId)) return;
    this.profile.badges.push(badgeId);
    this.bus.emit('badge:earned', { badgeId });
    this.persist();
  }

  private subjectCounts: Record<string, number> = {};

  private checkSubjectBadges(_subject: string): void {
    if ((this.subjectCounts['math'] ?? 0) >= PROGRESSION.questionsPerQuiz) {
      this.grantBadge('math-star');
    }
    if ((this.subjectCounts['phonics'] ?? 0) >= PROGRESSION.questionsPerQuiz) {
      this.grantBadge('phonics-pro');
    }
  }

  private persist(): void {
    this.save.save(this.profile);
    this.bus.emit('profile:changed', undefined);
  }
}
