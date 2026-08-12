import type { FishSpecies } from '../entities/Fish';

export const WORLD_BOUNDS = {
  minX: -11,
  maxX: 11,
  minY: -5.2,
  maxY: 5.5,
} as const;

export const FISH_CATALOG: Record<
  FishSpecies,
  {
    label: string;
    cost: number;
    health: number;
    speed: number;
    coinInterval: number;
    coinValue: number;
    attackDamage: number;
    attackInterval: number;
    color: number;
  }
> = {
  goldfish: {
    label: 'Goldfish',
    cost: 25,
    health: 5,
    speed: 2.1,
    coinInterval: 5.5,
    coinValue: 2,
    attackDamage: 0,
    attackInterval: 0,
    color: 0xff8a16,
  },
  puffer: {
    label: 'Puffer Guard',
    cost: 48,
    health: 9,
    speed: 1.7,
    coinInterval: 11,
    coinValue: 1,
    attackDamage: 1,
    attackInterval: 1.35,
    color: 0xf6cf38,
  },
};

export const GAME_BALANCE = {
  startingMoney: 45,
  foodCost: 2,
  firstWaveDelay: 14,
  betweenWaveDelay: 11,
  enemyBaseHealth: 4,
  enemyBaseSpeed: 0.72,
  enemyTouchDamage: 1,
  enemyAttackInterval: 1.25,
  clickDamage: 1,
} as const;
