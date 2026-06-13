// Tiny typed pub/sub so UI, progression, and scene react to game events
// without tight coupling.

export type GameEvents = {
  'question:answered': { correct: boolean; subject: string; planet: string };
  'star:earned': { amount: number; total: number };
  'planet:completed': { planet: string };
  'planet:unlocked': { planet: string };
  'badge:earned': { badgeId: string };
  'profile:changed': void;
};

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<keyof GameEvents, Set<Handler<any>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) handler(payload);
  }
}
