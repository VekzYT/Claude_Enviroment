import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import * as shots from './shots';

// GAMERULE's first post: the Monday Short, tall (1080 x 1920). Each shot keeps its wide drawing; this is where the
// tall window sits on it (cx, cy in screen space, k zooms out), keyed over the shot's own clock where it moves.
export const mineShort = defineEpisode('MineShort', {
  timeline: timeline as Timeline,
  shots,
  tall: {
    S1: { cx: 900 },
    S2: { cx: 640, k: 1.25 },
    S3: { cx: 960 },
    S4: { cx: 940 },
    S5: { cx: [[0, 900], [48, 820]], k: 1.3 },
    // the long way round: from You, along the arrow to the entrance, and back
    S6: { cx: [[0, 540], [6, 540], [16, 1460], [26, 1460], [36, 560], [58, 560]], k: 1.15 },
    S7: { cx: 940 },
    S8: { cx: 950 },
    S9: { cx: 960 },
    S10: { cx: 1000, k: 1.2 },
    S11: { cx: 700, k: 1.4 },
    S12: { cx: 900 },
    S13: { cx: 1040, k: 1.25 },
    S14: { cx: 900 },
    S15: { cx: 980 },
    S16: { cx: 960 },
    S21: { cx: 960 },
    S23: { cx: 960 },
  },
});
