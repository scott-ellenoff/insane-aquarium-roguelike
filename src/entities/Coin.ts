import * as THREE from 'three';

export class Coin {
  readonly mesh: THREE.Mesh;
  readonly value: number;
  age = 0;
  collected = false;
  private readonly originY: number;

  constructor(position: THREE.Vector3, value: number) {
    const geometry = new THREE.CylinderGeometry(0.34, 0.34, 0.12, 18);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffc72c,
      emissive: 0x4a2600,
      emissiveIntensity: 0.55,
      metalness: 0.75,
      roughness: 0.22,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.position.z = 1.4;
    this.originY = position.y;
    this.value = value;
    this.mesh.userData.entityType = 'coin';
    this.mesh.userData.entity = this;
  }

  update(dt: number): void {
    this.age += dt;
    this.mesh.rotation.y += dt * 2.8;
    this.mesh.position.y = this.originY + Math.sin(this.age * 3) * 0.16;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
