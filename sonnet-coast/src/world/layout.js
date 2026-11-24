// Hand-authored layout of the Sonnet Coast. x = east, z = south, north is -z.
export const WORLD_MIN = -1500;
export const WORLD_MAX = 1500;
export const WATER_Y = 0;

// Sonnet City: a 13 x 11 block grid, 100 m pitch. Three streets are wide boulevards.
const xs = [], zs = [];
for (let x = -500; x <= 800; x += 100) xs.push(x);
for (let z = -500; z <= 600; z += 100) zs.push(z);
export const BLVD_HW = 11;
export const STREET_HW = 7;
export const CITY = {
  xs, zs, y: 2,
  // half-width of each grid street
  xw: xs.map((x) => (x === 100 || x === 800 ? BLVD_HW : STREET_HW)),
  zw: zs.map((z) => (z === 0 ? BLVD_HW : STREET_HW)),
  core: { x: 150, z: -50 },
  x0: xs[0], x1: xs[xs.length - 1], z0: zs[0], z1: zs[zs.length - 1],
  pitch: 100,
  // beach boardwalk east of Shoreline Boulevard
  promenade: { x0: 811, x1: 829, z0: -512, z1: 612 },
};
export const STREET_NAMES = {
  x: { 100: 'Constitution Avenue', 800: 'Shoreline Boulevard' },
  z: { 0: 'Sonnet Boulevard' },
};

// Flat building pads. weight falls to 0 over `m` metres outside the rect.
export const FLAT_ZONES = [
  { name: 'city', x0: -540, x1: 836, z0: -540, z1: 640, y: 2, m: 80 },
  { name: 'port', x0: 430, x1: 880, z0: 880, z1: 1110, y: 2, m: 70 },
  { name: 'ridge', x0: 300, x1: 760, z0: -900, z1: -640, y: 6, m: 70 },
  { name: 'gator', cx: -1000, cz: 520, r: 46, y: 1.3, m: 30 },
  { name: 'camp', cx: -808, cz: 25, r: 30, y: 1.3, m: 26 },
  { name: 'jetty', cx: -290, cz: 792, r: 22, y: 1.6, m: 18 },
];
export const RECT = {
  city: FLAT_ZONES[0], port: FLAT_ZONES[1], ridge: FLAT_ZONES[2],
};

// River centreline (flows from the northern forest, past the city's west side, to the southern sea).
export const RIVER = [
  { x: -700, z: -1560 }, { x: -620, z: -1100 }, { x: -760, z: -700 }, { x: -640, z: -350 },
  { x: -760, z: 0 }, { x: -700, z: 400 }, { x: -560, z: 720 }, { x: -300, z: 840 }, { x: 0, z: 880 },
  { x: 250, z: 940 }, { x: 420, z: 1180 }, { x: 470, z: 1320 },
];
export const RIVER_HALF_W = 20;

// Roads outside the grid: polylines of control points (smoothed with Catmull-Rom).
export const ROADS = [
  { name: 'Glowwood Highway', type: 'highway', pts: [
    [100, -500], [92, -640], [30, -800], [-160, -950], [-420, -1060], [-700, -1090], [-980, -1000],
    [-1180, -780], [-1260, -450], [-1240, -120], [-1170, 220], [-1080, 560], [-900, 860],
    [-620, 1040], [-300, 1090], [0, 1080], [260, 1040], [520, 1000], [600, 965]] },
  { name: 'Port Road', type: 'road', pts: [[600, 965], [590, 800], [600, 600]] },
  { name: 'Shore Drive South', type: 'road', pts: [[800, 600], [790, 760], [720, 900], [600, 965]] },
  { name: 'Shore Drive North', type: 'road', pts: [[800, -500], [810, -640], [770, -820], [580, -1000], [260, -1130], [-60, -1130], [-420, -1060]] },
  { name: 'Ridge Road', type: 'road', pts: [[400, -500], [410, -580], [500, -650], [700, -650], [803, -680]] },
  { name: 'Bayou Road', type: 'road', pts: [[-500, 200], [-600, 230], [-720, 260], [-860, 300], [-1000, 260], [-1170, 220]] },
  { name: 'Meadow Road', type: 'road', pts: [[-500, -300], [-580, -320], [-660, -340], [-900, -300], [-1243, -300]] },
  { name: 'Marsh Road', type: 'road', pts: [[0, 600], [-10, 760], [-40, 880], [-70, 1000], [-76, 1084]] },
  // Dirt trails
  { name: 'Glowwood Rally Loop', type: 'dirt', closed: true, pts: [
    [-260, -720], [-230, -840], [-340, -930], [-500, -950], [-610, -860], [-600, -740], [-480, -670], [-350, -680]] },
  { name: 'Rally Connector', type: 'dirt', pts: [[-480, -670], [-490, -580], [-500, -400]] },
  { name: 'Gator Causeway', type: 'dirt', pts: [[-860, 300], [-920, 390], [-970, 470], [-1000, 520]] },
  { name: 'Moonshine Trail', type: 'dirt', pts: [[-800, 283], [-830, 200], [-820, 110], [-812, 36]] },
  { name: 'Smuggler Trail', type: 'dirt', pts: [[600, 965], [470, 900], [300, 860], [120, 830], [-60, 810], [-200, 790], [-290, 790]] },
  { name: 'Dune Trail', type: 'dirt', pts: [[790, 760], [872, 640], [886, 300], [882, 0], [874, -300], [810, -640]] },
];

// Points of interest. x/z = where the player stands to interact. block = [column, row] in the grid.
export const POI = {
  safehouse: { name: 'Context Window Lofts', x: -350, z: 112, block: [1, 6] },
  tower: { name: 'Claude Tower', x: 150, z: -8, block: [6, 4] },
  vanta: { name: 'Vantablack Labs', x: 450, z: -350, block: [9, 1] },
  police: { name: 'Safety Center', x: -50, z: 208, block: [4, 7] },
  clinic: { name: 'Constitutional Care Clinic', x: 350, z: -208, block: [8, 2] },
  retune: { name: 'Re-Tune Garage', x: -50, z: -150, block: [4, 3] },
  supply: { name: 'Prompt Supply Co.', x: 250, z: 12, block: [7, 5] },
  park: { name: 'Alignment Park', x: 50, z: 50, block: [5, 5] },
  dome: { name: 'Token Dome', x: 550, z: 350, block: [10, 8] },
  gator: { name: 'Gator Garage', x: -1000, z: 520 },
  camp: { name: 'Moonshine Hollow', x: -812, z: 30 },
  jetty: { name: 'Heron Jetty', x: -290, z: 790 },
  port: { name: 'Port of Sonnet', x: 640, z: 1010 },
  ridge: { name: 'Compute Ridge', x: 520, z: -700 },
  lookout: { name: 'Glowwood Lookout', x: -262, z: -716 },
  portRetune: { name: 'Re-Tune Garage (Port)', x: 760, z: 920 },
};
