import type { FishSpecies } from '../entities/Fish';
import type { UpgradeOption } from '../systems/UpgradeSystem';

export interface HudActions {
  onDropFood: () => void;
  onBuyFish: (species: FishSpecies) => void;
  onUpgrade: (upgrade: UpgradeOption) => void;
  onRestart: () => void;
}

export interface HudState {
  money: number;
  wave: number;
  fish: number;
  enemies: number;
  countdown: number;
  waveActive: boolean;
  foodCost: number;
}

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly status: HTMLDivElement;
  private readonly foodButton: HTMLButtonElement;
  private readonly actions: HudActions;

  constructor(root: HTMLDivElement, actions: HudActions) {
    this.root = root;
    this.actions = actions;
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="brand"><span>ABYSSAL</span> AQUARIUM</div>
        <div class="stats" data-stats></div>
      </div>
      <div class="wave-status" data-status></div>
      <div class="controls">
        <button class="action primary" data-food>Drop food</button>
        <button class="action" data-buy="goldfish">Buy Goldfish <strong>$25</strong></button>
        <button class="action" data-buy="puffer">Buy Puffer <strong>$48</strong></button>
      </div>
      <div class="hint">Click coins to collect them. Click invaders to fire the tank cannon.</div>
      <div class="modal-layer" data-modal></div>
    `;

    this.stats = this.requireElement<HTMLDivElement>('[data-stats]');
    this.status = this.requireElement<HTMLDivElement>('[data-status]');
    this.foodButton = this.requireElement<HTMLButtonElement>('[data-food]');
    this.foodButton.addEventListener('click', actions.onDropFood);
    this.root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((button) => {
      button.addEventListener('click', () => actions.onBuyFish(button.dataset.buy as FishSpecies));
    });
  }

  update(state: HudState): void {
    this.stats.innerHTML = `
      <span><b>$${state.money}</b> credits</span>
      <span><b>${state.fish}</b> fish</span>
      <span><b>${state.enemies}</b> invaders</span>
    `;
    this.status.textContent = state.waveActive
      ? `Wave ${state.wave} in progress`
      : `Wave ${state.wave + 1} arrives in ${Math.max(0, Math.ceil(state.countdown))}s`;
    this.foodButton.innerHTML = `Drop food <strong>$${state.foodCost}</strong>`;
  }

  showUpgrade(options: UpgradeOption[]): void {
    const modal = this.requireElement<HTMLDivElement>('[data-modal]');
    modal.innerHTML = `
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <div class="eyebrow">WAVE CLEARED</div>
        <h1 id="upgrade-title">Choose a mutation</h1>
        <div class="upgrade-grid">
          ${options.map((option) => `
            <button class="upgrade-card" data-upgrade="${option.id}">
              <strong>${option.title}</strong>
              <span>${option.description}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;
    modal.classList.add('visible');
    modal.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => {
        const option = options.find((candidate) => candidate.id === button.dataset.upgrade);
        if (!option) return;
        modal.classList.remove('visible');
        modal.innerHTML = '';
        this.actions.onUpgrade(option);
      });
    });
  }

  showGameOver(wave: number): void {
    const modal = this.requireElement<HTMLDivElement>('[data-modal]');
    modal.innerHTML = `
      <section class="modal-panel compact" role="dialog" aria-modal="true">
        <div class="eyebrow danger">ECOSYSTEM COLLAPSED</div>
        <h1>Run over</h1>
        <p>You survived through wave ${wave}.</p>
        <button class="action primary restart" data-restart>Start a new run</button>
      </section>
    `;
    modal.classList.add('visible');
    this.requireElement<HTMLButtonElement>('[data-restart]').addEventListener('click', () => {
      modal.classList.remove('visible');
      modal.innerHTML = '';
      this.actions.onRestart();
    });
  }

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing HUD element: ${selector}`);
    return element;
  }
}
