export type UpgradeId = 'coin-value' | 'fish-vitality' | 'guardian-damage' | 'instant-cash' | 'cheap-food';

export interface UpgradeOption {
  id: UpgradeId;
  title: string;
  description: string;
}

const UPGRADES: UpgradeOption[] = [
  { id: 'coin-value', title: 'Golden Current', description: 'All fish produce coins worth 50% more.' },
  { id: 'fish-vitality', title: 'Mineral-Rich Water', description: 'Heal every fish and increase maximum health by 2.' },
  { id: 'guardian-damage', title: 'Sharper Spines', description: 'Puffer Guards deal 75% more damage.' },
  { id: 'instant-cash', title: 'Sunken Strongbox', description: 'Gain $35 immediately.' },
  { id: 'cheap-food', title: 'Self-Seeding Kelp', description: 'Food costs $1 less for the rest of the run.' },
];

export function getUpgradeChoices(count = 3): UpgradeOption[] {
  return [...UPGRADES]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}
