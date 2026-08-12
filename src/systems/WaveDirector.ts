import { GAME_BALANCE } from '../config/balance';

export class WaveDirector {
  wave = 0;
  countdown: number = GAME_BALANCE.firstWaveDelay;
  active = false;
  upgradePending = false;

  update(dt: number, enemiesRemaining: number): { startWave?: number; offerUpgrade?: boolean } {
    if (this.upgradePending) {
      return {};
    }

    if (this.active && enemiesRemaining === 0) {
      this.active = false;
      this.upgradePending = true;
      return { offerUpgrade: true };
    }

    if (!this.active) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.wave += 1;
        this.active = true;
        return { startWave: this.wave };
      }
    }

    return {};
  }

  completeUpgrade(): void {
    this.upgradePending = false;
    this.countdown = GAME_BALANCE.betweenWaveDelay;
  }

  reset(): void {
    this.wave = 0;
    this.countdown = GAME_BALANCE.firstWaveDelay;
    this.active = false;
    this.upgradePending = false;
  }
}
