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
  { id: "boat.player", src: "/assets/game/boat/player-boat.svg", width: 64, height: 34, anchor: { x: 0.5, y: 0.5 } },
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
  { id: "fish.sardine", src: "/assets/game/fish/sardine.svg", width: 36, height: 20, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.snapper", src: "/assets/game/fish/snapper.svg", width: 42, height: 24, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.eel", src: "/assets/game/fish/eel.svg", width: 54, height: 22, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.shark", src: "/assets/game/fish/shark.svg", width: 72, height: 34, anchor: { x: 0.5, y: 0.5 } },
  { id: "fish.lantern", src: "/assets/game/fish/lantern.svg", width: 92, height: 46, anchor: { x: 0.5, y: 0.5 } },
  { id: "ocean.reef", src: "/assets/game/ocean/reef-marker.svg", width: 130, height: 80 },
  { id: "ocean.kelp", src: "/assets/game/ocean/kelp-marker.svg", width: 130, height: 80 },
  { id: "ocean.wreck", src: "/assets/game/ocean/wreck-marker.svg", width: 150, height: 90 },
  { id: "ocean.abyss", src: "/assets/game/ocean/abyss-marker.svg", width: 140, height: 90 },
  { id: "ocean.island", src: "/assets/game/ocean/island.svg", width: 120, height: 80 },
  { id: "effect.bubble", src: "/assets/game/effects/bubble.svg", width: 14, height: 14, anchor: { x: 0.5, y: 0.5 } },
  { id: "ui.fallback", src: "/assets/game/ui/fallback.svg", width: 32, height: 32, anchor: { x: 0.5, y: 0.5 } },
];
