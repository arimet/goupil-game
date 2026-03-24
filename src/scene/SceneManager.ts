import * as THREE from 'three';
import { updateAnimations } from './animations';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 1, 6);
    this.camera.lookAt(0, 0.5, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb, 1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = this.clock.getDelta();
      updateAnimations(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  addToScene(obj: THREE.Object3D) {
    this.scene.add(obj);
  }

  removeFromScene(obj: THREE.Object3D) {
    this.scene.remove(obj);
  }
}
