import * as THREE from 'three';
import { FISH_CATALOG, WORLD_BOUNDS } from '../config/balance';
import { createFishModel } from '../factories/models';
import type { Enemy } from './Enemy';
import type { Food } from './Food';

export type FishSpecies = 'goldfish' | 'puffer';

const HEALTH_BAR_WIDTH = 1.9;
const HEALTH_BAR_HEIGHT = 0.16;

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
  private readonly healthBarFill: THREE.Sprite;
  private readonly healthBarFillMaterial: THREE.SpriteMaterial;
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

    const healthBar = this.createHealthBar();
    this.healthBarFill = healthBar.fill;
    this.healthBarFillMaterial = healthBar.fillMaterial;
    this.group.add(healthBar.background, healthBar.fill);
    this.updateHealthBar();

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

    this.updateHealthBar();
    return result;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.updateHealthBar();
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

  private createHealthBar(): {
    background: THREE.Sprite;
    fill: THREE.Sprite;
    fillMaterial: THREE.SpriteMaterial;
  } {
    const backgroundMaterial = new THREE.SpriteMaterial({
      color: 0x07151c,
      transparent: true,
      opacity: 0.82,
      depthTest: false,
      depthWrite: false,
    });
    const fillMaterial = new THREE.SpriteMaterial({
      color: 0x47e879,
      depthTest: false,
      depthWrite: false,
    });

    const background = new THREE.Sprite(backgroundMaterial);
    background.position.set(0, 1.3, 0.7);
    background.scale.set(HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 1);
    background.renderOrder = 20;

    const fill = new THREE.Sprite(fillMaterial);
    fill.center.set(0, 0.5);
    fill.position.set(-HEALTH_BAR_WIDTH / 2, 1.3, 0.71);
    fill.scale.set(HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT * 0.7, 1);
    fill.renderOrder = 21;

    return { background, fill, fillMaterial };
  }

  private updateHealthBar(): void {
    const ratio = THREE.MathUtils.clamp(this.health / this.maxHealth, 0, 1);
    this.healthBarFill.scale.x = HEALTH_BAR_WIDTH * ratio;

    if (ratio > 0.6) {
      this.healthBarFillMaterial.color.setHex(0x47e879);
    } else if (ratio > 0.3) {
      this.healthBarFillMaterial.color.setHex(0xffc84a);
    } else {
      this.healthBarFillMaterial.color.setHex(0xff5364);
    }
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
