import * as THREE from 'three';
import { GAME_BALANCE, WORLD_BOUNDS } from '../config/balance';
import { createEnemyModel } from '../factories/models';
import type { Fish } from './Fish';

export class Enemy {
  readonly group: THREE.Group;
  health: number;
  maxHealth: number;
  dead = false;
  reward: number;
  private attackTimer = 0;
  private readonly speed: number;

  constructor(wave: number, position: THREE.Vector3) {
    this.maxHealth = GAME_BALANCE.enemyBaseHealth + Math.floor(wave * 1.35);
    this.health = this.maxHealth;
    this.speed = GAME_BALANCE.enemyBaseSpeed + wave * 0.025;
    this.reward = 4 + Math.floor(wave / 2);
    this.group = createEnemyModel();
    this.group.position.copy(position);
    this.group.scale.setScalar(0.8 + Math.min(0.35, wave * 0.015));
    this.group.userData.entity = this;
  }

  update(dt: number, fish: Fish[]): Fish | undefined {
    this.attackTimer -= dt;
    const livingFish = fish.filter((candidate) => !candidate.dead);
    const target = livingFish.sort(
      (a, b) => this.group.position.distanceToSquared(a.group.position) - this.group.position.distanceToSquared(b.group.position),
    )[0];

    if (!target) {
      return undefined;
    }

    const direction = target.group.position.clone().sub(this.group.position).setZ(0);
    const distance = direction.length();
    if (distance > 1.25) {
      direction.normalize();
      this.group.position.addScaledVector(direction, this.speed * dt);
      this.group.rotation.z += dt * 0.25;
    } else if (this.attackTimer <= 0) {
      this.attackTimer = GAME_BALANCE.enemyAttackInterval;
      return target;
    }

    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, WORLD_BOUNDS.minX - 1, WORLD_BOUNDS.maxX + 1);
    this.group.position.y = THREE.MathUtils.clamp(this.group.position.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
    return undefined;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.group.rotation.z += 0.22;
    if (this.health <= 0) {
      this.dead = true;
    }
  }
}
