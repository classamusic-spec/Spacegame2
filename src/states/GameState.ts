import type { Game } from '../core/Game';

// Every screen implements this. States are created lazily and reused; `enter`
// receives optional params from the previous transition (e.g. which planet to
// quiz on).
export interface GameState {
  readonly name: string;
  enter(game: Game, params?: Record<string, unknown>): void;
  exit(): void;
  update(dt: number): void;
}
