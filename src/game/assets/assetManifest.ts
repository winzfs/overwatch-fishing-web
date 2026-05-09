export type AssetDefinition = {
  id: string;
  src: string;
  width: number;
  height: number;
  anchor?: { x: number; y: number };
};

export const assetManifest: AssetDefinition[] = [
  { id: "player.harbor", src: "/assets/game/characters/player.svg", width: 32, height: 42, anchor: { x: 0.5, y: 0.9 } },
  { id: "player.diver", src: "/assets/game/dive/diver.svg", width: 42, height: 30, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.player", src: "/assets/sprites/boat_idle_1.png", width: 48, height: 108, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.idle.1", src: "/assets/sprites/boat_idle_1.png", width: 48, height: 108, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.idle.2", src: "/assets/sprites/boat_idle_2.png", width: 48, height: 108, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.move.1", src: "/assets/sprites/boat_move_1.png", width: 52, height: 116, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.move.2", src: "/assets/sprites/boat_move_2.png", width: 52, height: 116, anchor: { x: 0.5, y: 0.5 } },
  { id: "boat.top.small", src: "/assets/sprites/boat_top_small.png", width: 48, height: 48, anchor: { x: 0.5, y: 0.5 } },
  { id: "npc.mara", src: "/assets/game/characters/npc-mara.svg", width: 30, height: 40, anchor: { x: 0.5, y: 0.9 } },
  { id: "npc.teo", src: "/assets/game/characters/npc-teo.svg", width: 30, height: 40, anchor: { x: 0.5, y: 0.9 } },
  { id: "npc.nari", src: "/assets/game/characters/npc-nari.svg", width: 30, height: 40, anchor: { x: 0.5, y: 0.9 } },
  { id: "npc.salt", src: "/assets/game/characters/npc-salt.svg", width: 30, height: 40, anchor: { x: 0.5, y: 0.9 } },
  { id: "harbor.market", src: "/assets/game/harbor/market.svg", width: 170, height: 116 },
  { id: "harbor.shop", src: "/assets/game/harbor/shop.svg", width: 140, height: 112 },
  { id: "harbor.workshop", src: "/assets/game/harbor/workshop.svg", width: 150, height: 116 },
  { id: "harbor.aquarium", src: "/assets/game/harbor/aquarium.svg", width: 150, height: 102 },
  { id: "harbor.tavern", src: "/assets/game/harbor/tavern.svg", width: 178, height: 104 },
  { id: "harbor.dock", src: "/assets/game/harbor/dock.svg", width: 210, height: 64 },
  { id: "fish.sardine", src: "/assets/sprites/pachimari_puffer.png", width: 42, height: 24, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.snapper", src: "/assets/sprites/kiriko_fox_goldfish.png", width: 48, height: 24, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.eel", src: "/assets/sprites/dva_meka_ray.png", width: 56, height: 28, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.shark", src: "/assets/sprites/null_sector_shark.png", width: 72, height: 36, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.lantern", src: "/assets/sprites/fish_shadow_mythic.png", width: 76, height: 112, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.shadow.common", src: "/assets/sprites/fish_shadow_common.png", width: 34, height: 52, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.shadow.rare", src: "/assets/sprites/fish_shadow_rare.png", width: 38, height: 56, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.shadow.epic", src: "/assets/sprites/fish_shadow_epic.png", width: 42, height: 62, anchor: { x: 0.5, y: 0.5 } },
  { id: "ocean.reef", src: "/assets/backgrounds/shallow_water_tile.png", width: 130, height: 80 },
  { id: "ocean.kelp", src: "/assets/tilesets/water_overlays_strip.png", width: 130, height: 80 },
  { id: "ocean.wreck", src: "/assets/backgrounds/island_rocky.png", width: 150, height: 110 },
  { id: "ocean.abyss", src: "/assets/backgrounds/ocean_tile.png", width: 140, height: 90 },
  { id: "ocean.island", src: "/assets/backgrounds/island_tropical.png", width: 150, height: 110, anchor: { x: 0.5, y: 0.5 } },
  { id: "ocean.island.sandbar", src: "/assets/backgrounds/island_sandbar.png", width: 150, height: 110, anchor: { x: 0.5, y: 0.5 } },
  { id: "ocean.island.rocky", src: "/assets/backgrounds/island_rocky.png", width: 160, height: 116, anchor: { x: 0.5, y: 0.5 } },
  { id: "water.ocean", src: "/assets/backgrounds/ocean_tile.png", width: 100, height: 100 },
  { id: "water.shallow", src: "/assets/backgrounds/shallow_water_tile.png", width: 100, height: 100 },
  { id: "wave.1", src: "/assets/tiles/wave_1.png", width: 256, height: 256 },
  { id: "wave.2", src: "/assets/tiles/wave_2.png", width: 256, height: 256 },
  { id: "wave.3", src: "/assets/tiles/wave_3.png", width: 256, height: 256 },
  { id: "effect.bubble", src: "/assets/game/effects/bubble.svg", width: 14, height: 14, anchor: { x: 0.5, y: 0.5 } },
  { id: "ui.fallback", src: "/assets/game/ui/fallback.svg", width: 32, height: 32, anchor: { x: 0.5, y: 0.5 } },
];
