import * as THREE from 'three';
import { FISH_CATALOG, GAME_BALANCE, WORLD_BOUNDS } from '../config/balance';
import { Coin } from '../entities/Coin';
import { Enemy } from '../entities/Enemy';
import { Fish, type FishSpecies } from '../entities/Fish';
import { Food } from '../entities/Food';
import { Projectile } from '../entities/Projectile';
import { WaveDirector } from '../systems/WaveDirector';
import { getUpgradeChoices, type UpgradeOption } from '../systems/UpgradeSystem';
import { Hud } from '../ui/Hud';

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 100);
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly hud: Hud;
  private readonly waves = new WaveDirector();

  private fish: Fish[] = [];
  private food: Food[] = [];
  private coins: Coin[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private money = GAME_BALANCE.startingMoney;
  private foodCost: number = GAME_BALANCE.foodCost;
  private running = false;
  private paused = false;
  private gameOver = false;
  private animationFrame = 0;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLDivElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

    this.hud = new Hud(uiRoot, {
      onDropFood: () => this.dropFood(),
      onBuyFish: (species) => this.buyFish(species),
      onUpgrade: (upgrade) => this.applyUpgrade(upgrade),
      onRestart: () => this.restart(),
    });

    this.setupScene();
    this.bindEvents();
    this.resize();
    this.seedRun();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.animate();
  }

  private seedRun(): void {
    this.spawnFish('goldfish', new THREE.Vector3(-2.2, 0.5, 0));
    this.spawnFish('goldfish', new THREE.Vector3(1.6, -0.8, 0));
    this.spawnFish('puffer', new THREE.Vector3(0.2, 2.1, 0));
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused && !this.gameOver) {
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number): void {
    for (const item of this.food) item.update(dt);
    for (const coin of this.coins) coin.update(dt);

    for (const creature of this.fish) {
      const event = creature.update(dt, this.food, this.enemies);
      if (event.coinValue) this.spawnCoin(creature.group.position, event.coinValue);
      if (event.projectileTarget) {
        const projectile = new Projectile(creature.group.position.clone(), event.projectileTarget, creature.getAttackDamage());
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
      }
    }

    for (const enemy of this.enemies) {
      const attackedFish = enemy.update(dt, this.fish);
      if (attackedFish) attackedFish.takeDamage(GAME_BALANCE.enemyTouchDamage);
    }

    for (const projectile of this.projectiles) projectile.update(dt);

    this.cleanupEntities();

    const waveEvent = this.waves.update(dt, this.enemies.length);
    if (waveEvent.startWave) this.spawnWave(waveEvent.startWave);
    if (waveEvent.offerUpgrade) {
      this.paused = true;
      this.hud.showUpgrade(getUpgradeChoices());
    }

    if (this.fish.length === 0 && !this.gameOver) {
      this.gameOver = true;
      this.hud.showGameOver(this.waves.wave);
    }

    this.hud.update({
      money: this.money,
      wave: this.waves.wave,
      fish: this.fish.length,
      enemies: this.enemies.length,
      countdown: this.waves.countdown,
      waveActive: this.waves.active,
      foodCost: this.foodCost,
    });
  }

  private spawnWave(wave: number): void {
    const count = 1 + Math.ceil(wave * 0.7);
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? 1 : -1;
      const enemy = new Enemy(
        wave,
        new THREE.Vector3(side * (WORLD_BOUNDS.maxX + 1.6), THREE.MathUtils.randFloat(-4.3, 4.7), 0.5),
      );
      this.enemies.push(enemy);
      this.scene.add(enemy.group);
    }
  }

  private spawnFish(species: FishSpecies, position?: THREE.Vector3): void {
    const fish = new Fish(
      species,
      position ?? new THREE.Vector3(
        THREE.MathUtils.randFloat(-5, 5),
        THREE.MathUtils.randFloat(-2.8, 3.5),
        0,
      ),
    );
    this.fish.push(fish);
    this.scene.add(fish.group);
  }

  private spawnCoin(position: THREE.Vector3, value: number): void {
    const coin = new Coin(position.clone().add(new THREE.Vector3(0, 0.5, 0)), value);
    this.coins.push(coin);
    this.scene.add(coin.mesh);
  }

  private dropFood(): void {
    if (this.paused || this.gameOver || this.money < this.foodCost) return;
    this.money -= this.foodCost;
    const position = new THREE.Vector3(
      THREE.MathUtils.randFloat(-7.5, 7.5),
      WORLD_BOUNDS.maxY + 0.6,
      0.6,
    );
    const food = new Food(position);
    this.food.push(food);
    this.scene.add(food.mesh);
  }

  private buyFish(species: FishSpecies): void {
    if (this.paused || this.gameOver) return;
    const cost = FISH_CATALOG[species].cost;
    if (this.money < cost) return;
    this.money -= cost;
    this.spawnFish(species);
  }

  private applyUpgrade(upgrade: UpgradeOption): void {
    switch (upgrade.id) {
      case 'coin-value':
        this.fish.forEach((fish) => { fish.coinMultiplier *= 1.5; });
        break;
      case 'fish-vitality':
        this.fish.forEach((fish) => {
          fish.maxHealth += 2;
          fish.health = fish.maxHealth;
        });
        break;
      case 'guardian-damage':
        this.fish.forEach((fish) => {
          if (fish.species === 'puffer') fish.attackMultiplier *= 1.75;
        });
        break;
      case 'instant-cash':
        this.money += 35;
        break;
      case 'cheap-food':
        this.foodCost = Math.max(0, this.foodCost - 1);
        break;
    }
    this.waves.completeUpgrade();
    this.paused = false;
    this.clock.getDelta();
  }

  private cleanupEntities(): void {
    this.food = this.food.filter((item) => {
      if (!item.consumed && item.age < 20) return true;
      this.scene.remove(item.mesh);
      item.dispose();
      return false;
    });

    this.coins = this.coins.filter((coin) => {
      if (!coin.collected && coin.age < 12) return true;
      this.scene.remove(coin.mesh);
      coin.dispose();
      return false;
    });

    this.projectiles = this.projectiles.filter((projectile) => {
      if (!projectile.dead) return true;
      this.scene.remove(projectile.mesh);
      projectile.dispose();
      return false;
    });

    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.dead) return true;
      this.money += enemy.reward;
      this.scene.remove(enemy.group);
      this.disposeObject(enemy.group);
      return false;
    });

    this.fish = this.fish.filter((creature) => {
      if (!creature.dead) return true;
      this.scene.remove(creature.group);
      this.disposeObject(creature.group);
      return false;
    });
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.paused || this.gameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const coinHits = this.raycaster.intersectObjects(this.coins.map((coin) => coin.mesh), false);
    if (coinHits[0]) {
      const coin = coinHits[0].object.userData.entity as Coin | undefined;
      if (coin && !coin.collected) {
        coin.collected = true;
        this.money += coin.value;
      }
      return;
    }

    const enemyHits = this.raycaster.intersectObjects(this.enemies.map((enemy) => enemy.group), true);
    if (enemyHits[0]) {
      let object: THREE.Object3D | null = enemyHits[0].object;
      while (object && object.parent && !object.userData.entity) object = object.parent;
      const enemy = object?.userData.entity as Enemy | undefined;
      enemy?.takeDamage(GAME_BALANCE.clickDamage);
    }
  };

  private restart(): void {
    for (const fish of this.fish) {
      this.scene.remove(fish.group);
      this.disposeObject(fish.group);
    }
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.group);
      this.disposeObject(enemy.group);
    }
    for (const food of this.food) {
      this.scene.remove(food.mesh);
      food.dispose();
    }
    for (const coin of this.coins) {
      this.scene.remove(coin.mesh);
      coin.dispose();
    }
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile.mesh);
      projectile.dispose();
    }

    this.fish = [];
    this.enemies = [];
    this.food = [];
    this.coins = [];
    this.projectiles = [];
    this.money = GAME_BALANCE.startingMoney;
    this.foodCost = GAME_BALANCE.foodCost;
    this.waves.reset();
    this.gameOver = false;
    this.paused = false;
    this.seedRun();
    this.clock.getDelta();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x041c33);
    this.scene.fog = new THREE.FogExp2(0x082d49, 0.025);

    const ambient = new THREE.HemisphereLight(0x9de9ff, 0x17233c, 2.5);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe0a6, 3.2);
    key.position.set(-6, 9, 12);
    key.castShadow = true;
    this.scene.add(key);

    const fill = new THREE.PointLight(0x2ab7ff, 18, 28, 2);
    fill.position.set(7, 3, 8);
    this.scene.add(fill);

    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 15),
      new THREE.MeshStandardMaterial({ color: 0x0a5375, roughness: 0.9, metalness: 0.05 }),
    );
    backdrop.position.z = -3.5;
    backdrop.receiveShadow = true;
    this.scene.add(backdrop);

    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xcfa66c, roughness: 1, flatShading: true }),
    );
    sand.position.set(0, -6.1, -1.2);
    sand.rotation.x = -0.18;
    sand.receiveShadow = true;
    this.scene.add(sand);

    this.addRocks();
    this.addSeaweed();
    this.addBubbles();
  }

  private addRocks(): void {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x425465, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 11; i += 1) {
      const rock = new THREE.Mesh(geometry, material);
      rock.position.set(THREE.MathUtils.randFloat(-10.5, 10.5), THREE.MathUtils.randFloat(-5.9, -5.2), -0.5);
      rock.scale.setScalar(THREE.MathUtils.randFloat(0.25, 0.8));
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  private addSeaweed(): void {
    const material = new THREE.MeshStandardMaterial({ color: 0x39a94f, roughness: 0.75, flatShading: true });
    for (const baseX of [-8.5, -6.8, 7.2, 8.9]) {
      for (let i = 0; i < 4; i += 1) {
        const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, THREE.MathUtils.randFloat(1.3, 2.8), 4, 7), material);
        blade.position.set(baseX + i * 0.28, -5 + THREE.MathUtils.randFloat(0, 0.4), -0.3);
        blade.rotation.z = THREE.MathUtils.randFloat(-0.35, 0.35);
        blade.scale.x = THREE.MathUtils.randFloat(0.7, 1.3);
        this.scene.add(blade);
      }
    }
  }

  private addBubbles(): void {
    const geometry = new THREE.SphereGeometry(0.08, 8, 6);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xbdefff,
      transparent: true,
      opacity: 0.34,
      roughness: 0,
      transmission: 0.65,
    });
    for (let i = 0; i < 55; i += 1) {
      const bubble = new THREE.Mesh(geometry, material);
      bubble.position.set(
        THREE.MathUtils.randFloat(-11.5, 11.5),
        THREE.MathUtils.randFloat(-5.5, 6.5),
        THREE.MathUtils.randFloat(-2.8, 0.5),
      );
      bubble.scale.setScalar(THREE.MathUtils.randFloat(0.5, 2.2));
      this.scene.add(bubble);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  private resize = (): void => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewHeight = 14;
    this.camera.left = -(viewHeight * aspect) / 2;
    this.camera.right = (viewHeight * aspect) / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
  };

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material: THREE.Material) => material.dispose());
      else child.material.dispose();
    });
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.dispose();
  }
}
