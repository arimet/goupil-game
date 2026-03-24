import * as THREE from 'three';

export function createBackground(): THREE.Group {
  const group = new THREE.Group();

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(30, 10);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  group.add(ground);

  // Simple clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const cloudPositions = [
    [-4, 3.5, -3],
    [3, 4, -4],
    [-1, 3, -5],
    [5, 3.5, -2],
  ];

  for (const [x, y, z] of cloudPositions) {
    const cloud = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const size = 0.3 + Math.random() * 0.4;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        cloudMat,
      );
      sphere.position.set(i * 0.4 - 0.4, Math.random() * 0.15, 0);
      cloud.add(sphere);
    }
    cloud.position.set(x, y, z);
    group.add(cloud);
  }

  return group;
}
