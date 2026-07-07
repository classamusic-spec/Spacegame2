import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// A premium render pipeline: an HDR, multisampled render target (so edges stay
// crisp through the composer — the default composer target has no MSAA), a
// dreamy bloom, and a final filmic pass (soft vignette, subtle chromatic
// aberration at the frame edge, and gentle animated grain) for a cohesive,
// cinematic look. Includes an adaptive toggle for weak hardware.

const FilmicShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 0.3 },
    uGrain: { value: 0.028 },
    uAberration: { value: 0.0014 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 toCenter = uv - 0.5;
      float d = length(toCenter);

      // Chromatic aberration grows toward the edges for a lens-like feel.
      vec2 off = toCenter * uAberration * (d * 2.0);
      float r = texture2D(tDiffuse, uv + off).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - off).b;
      vec3 col = vec3(r, g, b);

      // Soft cinematic vignette.
      float vig = smoothstep(0.85, 0.35, d);
      col *= mix(1.0 - uVignette, 1.0, vig);

      // Gentle animated film grain.
      float grain = hash(uv * vec2(1920.0, 1080.0) + uTime) - 0.5;
      col += grain * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class PostFX {
  readonly composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private filmic: ShaderPass;
  private enabled = true;
  private time = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    size: { width: number; height: number }
  ) {
    // HDR + MSAA render target so bloom is smooth and geometry edges stay clean.
    const rt = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.72, // strength — radiant but not frame-washing
      0.5, // radius
      0.9 // threshold — only the brightest highlights bloom
    );
    this.composer.addPass(this.bloom);

    this.filmic = new ShaderPass(FilmicShader);
    this.filmic.renderToScreen = true;
    this.composer.addPass(this.filmic);
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

  render(dt: number): void {
    this.time += dt;
    this.filmic.uniforms.uTime.value = this.time;
    this.composer.render();
  }
}
