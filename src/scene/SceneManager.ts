import * as THREE from 'three';
import { COLORS, RENDER } from '../config/constants';
import { createStarfield } from './Skybox';
import { createLighting } from './Lighting';
import { PostFX } from './PostFX';

// Owns the renderer, scene, camera, and post-processing. It persists across
// game states so the 3D world stays alive while DOM panels overlay it. Provides
// a shared raycasting helper for "tap a thing in 3D".
export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly starfield: THREE.Points;
  private postFX: PostFX;
  private raycaster = new THREE.Raycaster();

  // Adaptive quality.
  private frameTimes: number[] = [];
  private lastQualityCheck = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER.maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene.background = new THREE.Color(COLORS.bg);
    this.scene.fog = new THREE.FogExp2(COLORS.bg, 0.0009);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 30, 90);
    this.camera.lookAt(0, 0, 0);

    this.starfield = createStarfield();
    this.scene.add(this.starfield);
    this.scene.add(createLighting());

    this.postFX = new PostFX(this.renderer, this.scene, this.camera, {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.postFX.setSize(w, h);
  };

  /** Raycast from NDC coords against the given objects (recursive). */
  pick(ndcX: number, ndcY: number, objects: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  /** A world-space ray direction from NDC (for aiming projectiles). */
  rayDirection(ndcX: number, ndcY: number): THREE.Vector3 {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return this.raycaster.ray.direction.clone();
  }

  render(dt: number): void {
    this.starfield.rotation.y += dt * 0.005;
    this.adaptQuality(dt);
    this.postFX.render();
  }

  // Disable bloom if we sustain poor frame times, to keep tablets smooth.
  private adaptQuality(dt: number): void {
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    const now = performance.now();
    if (now - this.lastQualityCheck < 2000 || this.frameTimes.length < 60) return;
    this.lastQualityCheck = now;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    if (avg > 1 / 30 && this.postFX.isEnabled()) {
      console.info('[perf] low FPS — disabling bloom for smoother play');
      this.postFX.setEnabled(false);
      this.renderer.setPixelRatio(1);
    }
  }
}
