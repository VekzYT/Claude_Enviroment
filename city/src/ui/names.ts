// A cheerful random city-name generator for the new-city screen. All names are made up from parts.

const FIRST = [
  'Pebble', 'Maple', 'Clover', 'Cobble', 'Sunny', 'Honey', 'Puddle', 'Tumble', 'Brick', 'Marble',
  'Juniper', 'Willow', 'Copper', 'Bramble', 'Thistle', 'Button', 'Lantern', 'Biscuit', 'Pickle', 'Toffee',
  'Hazel', 'Meadow', 'Saffron', 'Cinder', 'Bluebell', 'Acorn', 'Nutmeg', 'Pumpkin', 'Sparrow', 'Otter',
  'Kettle', 'Wobble', 'Dapple', 'Fable', 'Gumdrop', 'Mossy', 'Peachy', 'Ripple', 'Bumble', 'Cozy',
];

const SUFFIX = ['ton', 'ville', 'brook', 'by', 'field', 'haven', 'port', 'stead', 'burgh', 'wick', 'mouth', 'dale', 'ford', 'bury'];

const SECOND = ['Bay', 'Springs', 'Hollow', 'Heights', 'Falls', 'Crossing', 'Harbor', 'Valley', 'Grove', 'Cove', 'Hills', 'Landing', 'Park', 'Point'];

const PREFIX = ['New', 'Port', 'Little', 'Upper', 'Old', 'East', 'West', 'North', 'South', 'Fort'];

function pick<T>(list: readonly T[], rnd: () => number): T {
  return list[Math.floor(rnd() * list.length) % list.length];
}

/** "Pebbleton", "Maple Springs", "Port Clover", "Little Brickwick"... */
export function randomCityName(rnd: () => number = Math.random): string {
  const roll = rnd();
  const first = pick(FIRST, rnd);
  if (roll < 0.4) {
    // Glue a suffix on, avoiding doubled letters at the seam ("Maplele").
    let suf = pick(SUFFIX, rnd);
    if (first[first.length - 1] === suf[0]) suf = suf === 'ton' ? 'ville' : 'ton';
    const stem = /e$/.test(first) && /^[aeiouy]/.test(suf) ? first.slice(0, -1) : first;
    return stem + suf;
  }
  if (roll < 0.72) return `${first} ${pick(SECOND, rnd)}`;
  if (roll < 0.9) return `${pick(PREFIX, rnd)} ${first}`;
  let suf = pick(SUFFIX, rnd);
  if (first[first.length - 1] === suf[0]) suf = 'ton';
  return `${pick(PREFIX, rnd)} ${first}${suf}`;
}
