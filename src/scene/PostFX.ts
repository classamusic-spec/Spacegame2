import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Bloom post-processing — the biggest "wow per watt" for a space scene (the Sun,
// thrusters, lasers, and answer orbs glow). Includes an adaptive toggle so it
// can be disabled on weak hardware.
export class PostFX {
  readonly composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private enabled = true;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    size: { width: number; height: number }
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.9, // strength
      0.6, // radius
      0.85 // threshold (only bright things bloom)
    );
    this.composer.addPass(this.bloom);
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.bloom.enabled = on;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  render(): void {
    this.composer.render();
  }
}
