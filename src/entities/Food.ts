import * as THREE from 'three';

export class Food {
  readonly mesh: THREE.Mesh;
  velocityY = -1.25;
  age = 0;
  consumed = false;

  constructor(position: THREE.Vector3) {
    const geometry = new THREE.IcosahedronGeometry(0.22, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff5a45,
      roughness: 0.55,
      metalness: 0.05,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.castShadow = true;
    this.mesh.userData.entityType = 'food';
  }

  update(dt: number): void {
    this.age += dt;
    this.mesh.position.y += this.velocityY * dt;
    this.mesh.rotation.x += dt * 1.8;
    this.mesh.rotation.y += dt * 1.2;
    if (this.mesh.position.y < -5) {
      this.mesh.position.y = -5;
      this.velocityY = 0;
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
