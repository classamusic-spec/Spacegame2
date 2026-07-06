import * as THREE from 'three';

// Lighting rig: a bright point light at the Sun (origin) for dramatic planet
// shading, plus gentle ambient/hemisphere fill so dark sides aren't pitch black
// for young players.
export function createLighting(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lighting';

  // Warm golden key light from the Sun.
  const sunLight = new THREE.PointLight(0xffe6b0, 3.4, 0, 0.0);
  sunLight.position.set(0, 0, 0);
  group.add(sunLight);

  // Cool blue rim light so planets read against the nebula and catch a highlight.
  const rim = new THREE.DirectionalLight(0x6ea8ff, 0.7);
  rim.position.set(-1, 0.6, -1);
  group.add(rim);

  const ambient = new THREE.AmbientLight(0x35405f, 0.5);
  group.add(ambient);

  const hemi = new THREE.HemisphereLight(0x9ab8ff, 0x241436, 0.35);
  group.add(hemi);

  return group;
}
