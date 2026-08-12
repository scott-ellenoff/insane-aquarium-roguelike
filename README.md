# Abyssal Aquarium

A playable Three.js + TypeScript scaffold for a roguelike aquarium-defense game inspired by the economy/defense loop of classic aquarium games.

![Concept art](public/concept-art.png)

## Included in this scaffold

- Stylized low-poly fish, puffer guards, coins, food, alien invaders, rocks, kelp, and bubbles generated in code.
- Fish wandering, hunger, feeding, healing, and coin production.
- Enemy waves, target selection, attacks, health scaling, and rewards.
- Puffer auto-attacks plus a player click cannon.
- Buy-fish and drop-food actions.
- Between-wave roguelike upgrade choices.
- Game-over and restart flow.
- Responsive desktop/mobile HUD.
- Separate entity, factory, system, UI, balance, and core folders.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Controls

- **Drop food**: spends credits and drops a pellet from the top of the tank.
- **Buy Goldfish**: adds an economy fish.
- **Buy Puffer**: adds a defensive fish that automatically attacks invaders.
- **Click a coin**: collects it.
- **Click an invader**: deals one point of cannon damage.

## Project structure

```text
src/
  config/       Central balance values and fish catalog
  core/         Game orchestration, renderer, loop, input, lifecycle
  entities/     Fish, food, coins, enemies, and projectiles
  factories/    Procedural Three.js model construction
  systems/      Wave director and upgrade selection
  ui/           DOM HUD and modal flow
```

## Recommended next milestones

1. Replace procedural meshes with GLB models while keeping the entity interfaces.
2. Add a title/run setup screen and seeded randomness.
3. Add more fish archetypes: healer, collector, breeder, and crowd-control fish.
4. Convert upgrade effects into data-driven modifiers rather than direct mutations.
5. Add audio, impact particles, screen shake, and post-processing.
6. Add biome/tank generation and meta-progression saves.

## Originality note

Keep the final game visually and narratively distinct: use original names, art, characters, sounds, progression, and UI rather than copying protected assets or branding from an existing game.
