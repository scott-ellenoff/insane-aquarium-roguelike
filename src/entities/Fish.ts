import * as THREE from 'three';
import { FISH_CATALOG, WORLD_BOUNDS } from '../config/balance';
import { createFishModel } from '../factories/models';
import type { Enemy } from './Enemy';
import type { Food } from './Food';

export type FishSpecies = 'goldfish' | 'puffer';

export class Fish {
  readonly group: THREE.Group;
  readonly species: FishSpecies;
  health: number;
  maxHealth: number;
  hunger = 0;
  dead = false;
  coinMultiplier = 1;
  attackMultiplier = 1;

  private readonly speed: number;
  private readonly velocity = new THREE.Vector3();
  private readonly wanderTarget = new THREE.Vector3();
  private wanderTimer = 0;
  private coinTimer: number;
  private attackTimer = 0;

  constructor(species: FishSpecies, position: THREE.Vector3) {
    const config = FISH_CATALOG[species];
    this.species = species;
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.coinTimer = config.coinInterval * (0.35 + Math.random() * 0.5);
    this.group = createFishModel(species, config.color);
    this.group.position.copy(position);
    this.group.scale.setScalar(species === 'puffer' ? 0.82 : 0.78);
    this.group.userData.entity = this;
    this.pickWanderTarget();
  }

  update(dt: number, foods: Food[], enemies: Enemy[]): { coinValue?: number; projectileTarget?: Enemy } {
    const config = FISH_CATALOG[this.species];
    this.hunger = Math.min(1, this.hunger + dt * 0.014);
    this.coinTimer -= dt;
    this.attackTimer -= dt;

    const result: { coinValue?: number; projectileTarget?: Enemy } = {};
    if (this.coinTimer <= 0) {
      result.coinValue = Math.max(1, Math.round(config.coinValue * this.coinMultiplier));
      this.coinTimer = config.coinInterval * (0.85 + Math.random() * 0.3);
    }

    const edible = foods
      .filter((food) => !food.consumed)
      .sort((a, b) => this.group.position.distanceToSquared(a.mesh.position) - this.group.position.distanceToSquared(b.mesh.position))[0];

    let target = this.wanderTarget;
    if (edible && this.hunger > 0.28) {
      target = edible.mesh.position;
      if (this.group.position.distanceTo(edible.mesh.position) < 0.72) {
        edible.consumed = true;
        this.hunger = Math.max(0, this.hunger - 0.58);
        this.health = Math.min(this.maxHealth, this.health + 1);
      }
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0 || this.group.position.distanceTo(this.wanderTarget) < 0.55) {
        this.pickWanderTarget();
      }
    }

    const desired = target.clone().sub(this.group.position).setZ(0);
    if (desired.lengthSq() > 0.001) {
      desired.normalize().multiplyScalar(this.speed * (1 - this.hunger * 0.28));
      this.velocity.lerp(desired, Math.min(1, dt * 2.7));
    }
    this.group.position.addScaledVector(this.velocity, dt);
    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    this.group.position.y = THREE.MathUtils.clamp(this.group.position.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
    this.group.rotation.y = this.velocity.x >= 0 ? 0 : Math.PI;
    this.group.rotation.z = Math.sin(performance.now() * 0.002 + this.group.position.x) * 0.04;

    if (config.attackDamage > 0 && this.attackTimer <= 0) {
      const nearestEnemy = enemies
        .filter((enemy) => !enemy.dead)
        .sort((a, b) => this.group.position.distanceToSquared(a.group.position) - this.group.position.distanceToSquared(b.group.position))[0];
      if (nearestEnemy && this.group.position.distanceTo(nearestEnemy.group.position) < 7.5) {
        result.projectileTarget = nearestEnemy;
        this.attackTimer = config.attackInterval;
      }
    }

    return result;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.group.scale.multiplyScalar(0.92);
    window.setTimeout(() => {
      if (!this.dead) {
        this.group.scale.setScalar(this.species === 'puffer' ? 0.82 : 0.78);
      }
    }, 90);
    if (this.health <= 0) {
      this.dead = true;
    }
  }

  getAttackDamage(): number {
    return FISH_CATALOG[this.species].attackDamage * this.attackMultiplier;
  }

  private pickWanderTarget(): void {
    this.wanderTarget.set(
      THREE.MathUtils.randFloat(WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
      THREE.MathUtils.randFloat(WORLD_BOUNDS.minY + 0.6, WORLD_BOUNDS.maxY),
      0,
    );
    this.wanderTimer = THREE.MathUtils.randFloat(2.5, 6.5);
  }
}
