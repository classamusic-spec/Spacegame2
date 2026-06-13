import * as THREE from 'three';

// Lighting rig: a bright point light at the Sun (origin) for dramatic planet
// shading, plus gentle ambient/hemisphere fill so dark sides aren't pitch black
// for young players.
export function createLighting(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lighting';

  const sunLight = new THREE.PointLight(0xfff3d0, 3.2, 0, 0.0);
  sunLight.position.set(0, 0, 0);
  group.add(sunLight);

  const ambient = new THREE.AmbientLight(0x334466, 0.55);
  group.add(ambient);

  const hemi = new THREE.HemisphereLight(0x88aaff, 0x221133, 0.35);
  group.add(hemi);

  return group;
}
