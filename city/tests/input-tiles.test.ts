// Tile tracking for drags: L paths, rectangles, the drag's end tiles and tile cleaning.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DragTiles, clampedTileAt, cleanTile, lPath, rectTiles, sameTile, tileAt } from '../src/input/tiles';

const N = 64;
const xz = (i: number) => [i % N, Math.floor(i / N)];

function assertContiguous(path: number[]) {
  for (let k = 1; k < path.length; k++) {
    const [x0, z0] = xz(path[k - 1]);
    const [x1, z1] = xz(path[k]);
    assert.equal(Math.abs(x1 - x0) + Math.abs(z1 - z0), 1, `step ${k} is not to a neighbour`);
  }
  assert.equal(new Set(path).size, path.length, 'no tile twice');
}

test('lPath runs along the longer axis first, then turns once', () => {
  const p = lPath({ x: 2, z: 3 }, { x: 9, z: 6 }, N);
  assert.equal(p.length, 7 + 3 + 1);
  assert.deepEqual(xz(p[0]), [2, 3]);
  assert.deepEqual(xz(p[7]), [9, 3]); // the corner
  assert.deepEqual(xz(p[p.length - 1]), [9, 6]);
  assertContiguous(p);

  const q = lPath({ x: 10, z: 20 }, { x: 8, z: 5 }, N);
  assert.equal(q.length, 15 + 2 + 1);
  assert.deepEqual(xz(q[15]), [10, 5]); // vertical leg first, then west
  assert.deepEqual(xz(q[q.length - 1]), [8, 5]);
  assertContiguous(q);
});

test('lPath handles straight lines, ties and single tiles', () => {
  assert.deepEqual(lPath({ x: 4, z: 4 }, { x: 4, z: 4 }, N), [4 * N + 4]);
  const straight = lPath({ x: 0, z: 0 }, { x: 0, z: 63 }, N);
  assert.equal(straight.length, 64);
  assertContiguous(straight);
  // |dx| == |dz|: x first
  const tie = lPath({ x: 5, z: 5 }, { x: 2, z: 8 }, N);
  assert.deepEqual(xz(tie[3]), [2, 5]);
  assertContiguous(tie);
});

test('rectTiles covers the rectangle between two corners in any order', () => {
  const r = rectTiles({ x: 7, z: 2 }, { x: 4, z: 5 }, N);
  assert.equal(r.length, 4 * 4);
  const pts = r.map(xz);
  assert.ok(pts.every(([x, z]) => x >= 4 && x <= 7 && z >= 2 && z <= 5));
  assert.deepEqual(rectTiles({ x: 1, z: 1 }, { x: 1, z: 1 }, N), [N + 1]);
});

test('DragTiles reports a change only when the tile under the finger changes', () => {
  const d = new DragTiles(false);
  assert.equal(d.started, false);
  assert.equal(d.move(null), false, 'no tile yet: nothing starts');
  assert.equal(d.move({ x: 3, z: 3 }), true);
  assert.deepEqual([d.a, d.b], [{ x: 3, z: 3 }, { x: 3, z: 3 }]);
  assert.equal(d.move({ x: 3, z: 3 }), false);
  assert.equal(d.move({ x: 4, z: 3 }), true);
  assert.equal(d.move(null), false, 'losing the ground keeps the last tile');
  assert.deepEqual([d.a, d.b], [{ x: 3, z: 3 }, { x: 4, z: 3 }]);

  const g = new DragTiles(true); // building ghost: a follows b
  g.move({ x: 10, z: 10 });
  assert.equal(g.move({ x: 11, z: 12 }), true);
  assert.deepEqual([g.a, g.b], [{ x: 11, z: 12 }, { x: 11, z: 12 }]);
});

test('tileAt, clampedTileAt, cleanTile and sameTile', () => {
  assert.deepEqual(tileAt(3.2, 63.99, N), { x: 3, z: 63 });
  assert.equal(tileAt(-0.01, 5, N), null);
  assert.equal(tileAt(64, 5, N), null);
  assert.equal(tileAt(NaN, 5, N), null);
  assert.deepEqual(clampedTileAt(-12, 80, N), { x: 0, z: 63 });
  assert.deepEqual(clampedTileAt(NaN, 5.5, N), { x: 0, z: 5 });
  assert.deepEqual(cleanTile({ x: 2.4, z: 70 }, N), { x: 2, z: 63 });
  assert.equal(cleanTile(null, N), null);
  assert.equal(cleanTile({ x: NaN, z: 1 }, N), null);
  assert.ok(sameTile({ x: 1, z: 2 }, { x: 1, z: 2 }));
  assert.ok(!sameTile({ x: 1, z: 2 }, { x: 2, z: 1 }));
  assert.ok(sameTile(null, null));
  assert.ok(!sameTile(null, { x: 0, z: 0 }));
});
