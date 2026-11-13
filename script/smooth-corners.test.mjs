import assert from "node:assert/strict";
import test from "node:test";
import { createLoader } from "./test-utils.mjs";

const { CORNER_SMOOTHING, normalizeRadii, insetRadii, smoothPath, smoothClip, smoothBorder } = createLoader()("src/lib/smoothCorners.ts");

test("corners use continuous transitions and retain individually square corners", () => {
  assert.equal(CORNER_SMOOTHING, 0.6);
  const path = smoothPath(120, 60, [12, 0, 0, 12]);
  assert.match(path, /c /); // Transition curves, not just circular arcs.
  assert.match(path, /M 120 0 l 0(?:\.0+)? 0/);
  assert.doesNotMatch(path, /NaN|Infinity/);
  assert.doesNotMatch(smoothPath(8, 6, [12, 12, 12, 12]), /NaN|Infinity/);
});

test("inset radii track border thickness without becoming negative", () => {
  assert.deepEqual([...insetRadii([12, 6, 0, 2], 3)], [9, 3, 0, 0]);
});

test("nested geometry uses the same overlap normalization as CSS borders", () => {
  assert.deepEqual([...normalizeRadii(100, 32, [19.2, 19.2, 19.2, 19.2])], [16, 16, 16, 16]);
  assert.deepEqual([...normalizeRadii(100, 60, [12, 0, 0, 12])], [12, 0, 0, 12]);
});

test("fallback clipping uses one contour without inverse or overlapping paths", () => {
  const clip = smoothClip(120, 60, [12, 12, 12, 12]);
  assert.equal(clip, `path('${smoothPath(120, 60, [12, 12, 12, 12])}')`);
  assert.equal((clip.match(/M /g) || []).length, 1);
  assert.doesNotMatch(clip, /evenodd|100000/);
});

test("smooth border uses coordinated outer and inset paths with original color", () => {
  const image = smoothBorder(120, 60, [12, 12, 12, 12], 2, "rgba(12, 34, 56, 0.5)");
  const svg = decodeURIComponent(image.match(/data:image\/svg\+xml,([^\"]+)/)[1]);
  assert.ok(svg.includes(smoothPath(120, 60, [12, 12, 12, 12])));
  assert.ok(svg.includes(smoothPath(116, 56, [10, 10, 10, 10])));
  assert.match(svg, /translate\(2 2\)/);
  assert.match(svg, /fill="rgba\(12, 34, 56, 0.5\)"/);
  assert.match(image, /0 fill \/ 0 \/ 0 stretch$/);
});
