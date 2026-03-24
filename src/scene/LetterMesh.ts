import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import type { Font } from 'three/addons/loaders/FontLoader.js';
import { animate, easeOutBack } from './animations';

let cachedFont: Font | null = null;

async function loadFont(): Promise<Font> {
  if (cachedFont) return cachedFont;
  const loader = new FontLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        cachedFont = font;
        resolve(font);
      },
      undefined,
      reject,
    );
  });
}

export class LetterMesh {
  mesh: THREE.Mesh | null = null;
  private group = new THREE.Group();

  constructor() {
    this.group.position.set(0, 0.8, 0);
  }

  getGroup() {
    return this.group;
  }

  async setLetter(letter: string) {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }

    const font = await loadFont();
    const geometry = new TextGeometry(letter, {
      font,
      size: 2.5,
      depth: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    });

    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const cx = (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      const cy = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;
      geometry.translate(-cx, -cy, 0);
    }

    const hue = (letter.charCodeAt(0) - 65) / 26;
    const color = new THREE.Color().setHSL(hue, 0.7, 0.55);

    const material = new THREE.MeshToonMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);
  }

  async animateIn() {
    if (!this.mesh) return;
    const mesh = this.mesh;
    mesh.scale.set(0, 0, 0);
    mesh.rotation.y = -0.5;
    await Promise.all([
      animate(0.5, (p) => {
        mesh.scale.setScalar(p);
      }, easeOutBack),
      animate(0.5, (p) => {
        mesh.rotation.y = -0.5 * (1 - p);
      }),
    ]);
  }

  async animateOut() {
    if (!this.mesh) return;
    const mesh = this.mesh;
    await animate(0.3, (p) => {
      mesh.scale.setScalar(1 - p);
      mesh.position.y = p * 2;
    });
    mesh.position.y = 0;
  }

  clear() {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }
  }

  async celebrateWiggle() {
    if (!this.mesh) return;
    const mesh = this.mesh;
    await animate(0.4, (p) => {
      mesh.rotation.z = Math.sin(p * Math.PI * 4) * 0.1 * (1 - p);
    });
  }
}
