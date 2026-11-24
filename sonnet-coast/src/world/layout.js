// Hand-authored layout of the Sonnet Coast. x = east, z = south, north is -z.
export const WORLD_MIN = -1500;
export const WORLD_MAX = 1500;
export const WATER_Y = 0;

export const CITY = {
  xs: [-300, -200, -100, 0, 100, 200, 300, 400, 500, 600],
  zs: [-300, -200, -100, 0, 100, 200, 300],
  y: 2,
  roadW: 14,
  core: { x: 150, z: -50 },
};
CITY.x0 = CITY.xs[0];
CITY.x1 = CITY.xs[CITY.xs.length - 1];
CITY.z0 = CITY.zs[0];
CITY.z1 = CITY.zs[CITY.zs.length - 1];

// Flat building pads. weight falls to 0 over `m` metres outside the rect.
export const FLAT_ZONES = [
  { name: 'city', x0: -340, x1: 640, z0: -340, z1: 340, y: 2, m: 90 },
  { name: 'port', x0: 430, x1: 880, z0: 880, z1: 1110, y: 2, m: 70 },
  { name: 'ridge', x0: 300, x1: 740, z0: -700, z1: -460, y: 6, m: 80 },
  { name: 'gator', cx: -1000, cz: 520, r: 46, y: 1.3, m: 30 },
  { name: 'camp', cx: -808, cz: 25, r: 30, y: 1.3, m: 26 },
  { name: 'jetty', cx: -292, cz: 628, r: 22, y: 1.6, m: 18 },
];

// River centreline (flows from the northern forest to the southern sea).
export const RIVER = [
  { x: -700, z: -1560 }, { x: -620, z: -1100 }, { x: -760, z: -700 }, { x: -640, z: -350 },
  { x: -760, z: 0 }, { x: -620, z: 380 }, { x: -380, z: 640 }, { x: -60, z: 760 },
  { x: 250, z: 900 }, { x: 420, z: 1180 }, { x: 470, z: 1320 },
];
export const RIVER_HALF_W = 20;

// Roads: polylines of control points (smoothed with Catmull-Rom). type: highway | road | dirt.
export const ROADS = [
  { name: 'Glowwood Highway', type: 'highway', pts: [
    [100, -300], [92, -440], [30, -640], [-160, -840], [-420, -990], [-700, -1060], [-980, -980],
    [-1180, -760], [-1260, -450], [-1240, -120], [-1170, 220], [-1080, 560], [-900, 860],
    [-620, 1020], [-300, 1080], [0, 1070], [260, 1010], [520, 990], [600, 965]] },
  { name: 'Port Road', type: 'road', pts: [[600, 965], [565, 760], [520, 520], [500, 300]] },
  { name: 'Shore Drive South', type: 'road', pts: [[600, 200], [700, 250], [785, 420], [790, 640], [720, 860], [600, 965]] },
  { name: 'Shore Drive North', type: 'road', pts: [[600, -200], [720, -290], [790, -520], [770, -760], [580, -980], [260, -1110], [-60, -1110], [-420, -990]] },
  { name: 'Ridge Road', type: 'road', pts: [[400, -300], [420, -460], [520, -560], [700, -600], [788, -600]] },
  { name: 'Bayou Road', type: 'road', pts: [[-300, 200], [-450, 250], [-640, 300], [-820, 320], [-1000, 260], [-1170, 220]] },
  { name: 'Meadow Road', type: 'road', pts: [[-300, -200], [-480, -250], [-640, -330], [-900, -300], [-1243, -300]] },
  { name: 'Marsh Road', type: 'road', pts: [[0, 300], [-20, 520], [-55, 760], [-80, 1000], [-82, 1073]] },
  // Dirt trails
  { name: 'Glowwood Rally Loop', type: 'dirt', closed: true, pts: [
    [-210, -560], [-170, -700], [-280, -860], [-470, -900], [-580, -780], [-590, -580], [-470, -470], [-330, -500]] },
  { name: 'Rally Connector', type: 'dirt', pts: [[-470, -470], [-470, -360], [-480, -250]] },
  { name: 'Gator Causeway', type: 'dirt', pts: [[-820, 320], [-900, 400], [-960, 470], [-1000, 520]] },
  { name: 'Moonshine Trail', type: 'dirt', pts: [[-640, 300], [-760, 210], [-810, 110], [-812, 36]] },
  { name: 'Smuggler Trail', type: 'dirt', pts: [[600, 965], [470, 880], [300, 800], [120, 730], [-60, 690], [-200, 640], [-292, 626]] },
  { name: 'Dune Trail', type: 'dirt', pts: [[790, 640], [880, 520], [900, 250], [880, 0], [860, -250], [790, -520]] },
];

// Points of interest. Marker = where the player stands to interact.
export const POI = {
  safehouse: { name: 'Context Window Lofts', x: -250, z: 12, block: [0, 3] },
  tower: { name: 'Claude Tower', x: 150, z: -8, block: [4, 2] },
  vanta: { name: 'Vantablack Labs', x: 450, z: 150, block: [7, 4] },
  police: { name: 'Safety Center', x: -150, z: 208, block: [1, 5] },
  clinic: { name: 'Constitutional Care Clinic', x: 350, z: -208, block: [6, 0] },
  retune: { name: 'Re-Tune Garage', x: -50, z: -150, block: [2, 1] },
  supply: { name: 'Prompt Supply Co.', x: 250, z: 8, block: [5, 3] },
  park: { name: 'Alignment Park', x: 50, z: 50, block: [3, 3] },
  gator: { name: 'Gator Garage', x: -1000, z: 520 },
  camp: { name: 'Moonshine Hollow', x: -812, z: 30 },
  jetty: { name: 'Heron Jetty', x: -292, z: 626 },
  port: { name: 'Port of Sonnet', x: 640, z: 1010 },
  ridge: { name: 'Compute Ridge', x: 520, z: -585 },
  lookout: { name: 'Glowwood Lookout', x: -215, z: -556 },
  portRetune: { name: 'Re-Tune Garage (Port)', x: 760, z: 920 },
};
