import type { GameState } from '../states/GameState';
import type { Game } from './Game';

// A simple swap-based state machine. States register by name; `change` exits the
// current one and enters the next, passing optional params through.
export class StateMachine {
  private states = new Map<string, GameState>();
  private current: GameState | null = null;

  constructor(private game: Game) {}

  register(state: GameState): void {
    this.states.set(state.name, state);
  }

  change(name: string, params?: Record<string, unknown>): void {
    const next = this.states.get(name);
    if (!next) {
      console.error(`[state] unknown state "${name}"`);
      return;
    }
    this.current?.exit();
    this.current = next;
    next.enter(this.game, params);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  get currentName(): string | null {
    return this.current?.name ?? null;
  }
}
