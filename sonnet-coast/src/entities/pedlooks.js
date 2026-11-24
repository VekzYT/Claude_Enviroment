// Outfit palettes for pedestrians and NPC drivers.
const skins = [0xf1c9a5, 0xe0ac8a, 0xc68863, 0x9a6645, 0x70452c, 0x4f3020];
const tops = [0xc8643b, 0xf0e8d8, 0x3d3d3a, 0x2ec4b6, 0xd97757, 0x2f5d73, 0xe8b04a, 0x7b5ea7, 0xe6e1d6, 0x1f2a33, 0xd9486e, 0x5c7f6b];
const bottoms = [0x26282e, 0x3b4252, 0x6b5a48, 0x1c1c1e, 0x4a5568, 0x8a7a66, 0x2f3b33];
const hairs = [0x1a1512, 0x3b2a1e, 0x6b4a2e, 0xb8935a, 0xd9d2c4, 0xc8643b, 0x2ec4b6, 0xd9486e];

export const PED_LOOKS = [];
for (let i = 0; i < 40; i++) {
  const h = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  PED_LOOKS.push({
    skin: skins[Math.floor(h(1) * skins.length)],
    top: tops[Math.floor(h(2) * tops.length)],
    bottom: bottoms[Math.floor(h(3) * bottoms.length)],
    hair: hairs[Math.floor(h(4) * hairs.length)],
    hat: h(5) < 0.2,
    glow: h(6) < 0.3 ? [0x3ff2ff, 0xff7a59, 0xff4fd8, 0xa6ff4d][Math.floor(h(7) * 4)] : 0,
    scale: 0.94 + h(8) * 0.14,
  });
}
export const COP_LOOK = { skin: 0xd9a47c, top: 0x2b2d33, bottom: 0x1c1d22, hair: 0x15161a, hat: true, glow: 0x4da3ff, scale: 1.02, cop: true };
