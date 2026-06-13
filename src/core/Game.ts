import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';
import { EventBus } from './EventBus';
import { GameLoop } from './GameLoop';
import { StateMachine } from './StateMachine';
import { SaveManager } from '../player/SaveManager';
import type { PlayerProfile } from '../player/PlayerProfile';
import { RewardSystem } from '../progression/RewardSystem';
import { CurriculumLoader } from '../curriculum/CurriculumLoader';
import { QuestionPicker } from '../curriculum/QuestionPicker';
import { UIRoot } from '../ui/UIRoot';

import { StartScreenState } from '../states/StartScreenState';
import { GradeSelectState } from '../states/GradeSelectState';
import { RocketSelectState } from '../states/RocketSelectState';
import { SolarSystemState } from '../states/SolarSystemState';
import { LessonState } from '../states/LessonState';
import { UfoGameState } from '../states/UfoGameState';
import { RewardState } from '../states/RewardState';

// The spine of the game: owns shared services and the loop, registers all
// screens, and routes state transitions. States reach back into these services
// through the Game reference they receive in `enter`.
export class Game {
  readonly scene: SceneManager;
  readonly input: InputManager;
  readonly bus = new EventBus();
  readonly save = new SaveManager();
  readonly profile: PlayerProfile;
  readonly rewards: RewardSystem;
  readonly curriculum = new CurriculumLoader();
  readonly picker = new QuestionPicker();
  readonly ui: UIRoot;
  readonly states: StateMachine;
  private loop: GameLoop;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.scene = new SceneManager(canvas);
    this.input = new InputManager(canvas, uiRoot);
    this.profile = this.save.load();
    this.rewards = new RewardSystem(this.profile, this.save, this.bus);
    this.ui = new UIRoot(uiRoot);
    this.states = new StateMachine(this);
    this.loop = new GameLoop(this.frame);

    // Load + validate all curriculum content, then make sure starter planets
    // are unlocked according to current stars.
    this.curriculum.load();
    this.rewards.syncUnlocks();

    this.registerStates();
  }

  private registerStates(): void {
    this.states.register(new StartScreenState());
    this.states.register(new GradeSelectState());
    this.states.register(new RocketSelectState());
    this.states.register(new SolarSystemState());
    this.states.register(new LessonState());
    this.states.register(new UfoGameState());
    this.states.register(new RewardState());
  }

  start(): void {
    this.loop.start();
    // Returning players who already onboarded skip straight to the map.
    this.states.change(this.profile.onboarded ? 'solar-system' : 'start');
  }

  private frame = (dt: number) => {
    this.input.update();
    this.states.update(dt);
    this.scene.render(dt);
  };

  persistProfile(): void {
    this.save.save(this.profile);
  }
}
