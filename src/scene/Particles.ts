import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private group = new THREE.Group();
  private particles: Particle[] = [];
  private starGeo = new THREE.SphereGeometry(0.08, 6, 6);

  getGroup() {
    return this.group;
  }

  emitStars(origin: THREE.Vector3, count = 15) {
    for (let i = 0; i < count; i++) {
      const hue = Math.random() * 0.15 + 0.1; // gold-ish
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.6),
        transparent: true,
      });
      const mesh = new THREE.Mesh(this.starGeo, mat);
      mesh.position.copy(origin);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.6 + 2,
        (Math.random() - 0.5) * speed,
      );

      this.group.add(mesh);
      this.particles.push({ mesh, velocity, life: 0, maxLife: 0.8 + Math.random() * 0.4 });
    }
  }

  emitConfetti(count = 30) {
    const confettiGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
        transparent: true,
      });
      const mesh = new THREE.Mesh(confettiGeo, mat);
      mesh.position.set((Math.random() - 0.5) * 6, 4, (Math.random() - 0.5) * 2);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -1 - Math.random() * 2,
        (Math.random() - 0.5),
      );

      this.group.add(mesh);
      this.particles.push({ mesh, velocity, life: 0, maxLife: 2 + Math.random() });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.velocity.y -= dt * 5; // gravity
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.mesh.rotation.x += dt * 3;
      p.mesh.rotation.z += dt * 2;

      const alpha = 1 - p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, alpha);

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }
}
