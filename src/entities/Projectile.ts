import * as THREE from 'three';
import type { Enemy } from './Enemy';

export class Projectile {
  readonly mesh: THREE.Mesh;
  readonly target: Enemy;
  readonly damage: number;
  dead = false;
  private readonly speed = 9;

  constructor(position: THREE.Vector3, target: Enemy, damage: number) {
    this.target = target;
    this.damage = damage;
    this.mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.48, 5),
      new THREE.MeshStandardMaterial({ color: 0xffdc53, emissive: 0x5e3300, emissiveIntensity: 0.7 }),
    );
    this.mesh.position.copy(position);
    this.mesh.position.z = 1;
  }

  update(dt: number): void {
    if (this.target.dead) {
      this.dead = true;
      return;
    }
    const direction = this.target.group.position.clone().sub(this.mesh.position);
    const distance = direction.length();
    if (distance < 0.48) {
      this.target.takeDamage(this.damage);
      this.dead = true;
      return;
    }
    direction.normalize();
    this.mesh.position.addScaledVector(direction, this.speed * dt);
    this.mesh.rotation.z = Math.atan2(direction.y, direction.x) - Math.PI / 2;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
