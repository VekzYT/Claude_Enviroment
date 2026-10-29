import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 } from './shots';

// GAMERULE episode 1, part 1: the cold open and the command. The power's look lives in the shots (cracks, the
// popping block, the hotbar), so this part needs no grade.
export const mineOpen = defineEpisode('MineOpen', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 },
});
