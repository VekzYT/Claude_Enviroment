// Developed lots: picks the design for a zone, level and variant.
import { ZoneType } from '../../core/types';
import { comDesign } from './com';
import type { Design } from './design';
import { indDesign } from './ind';
import { resDesign } from './res';

/** level 1..3, v 0..3 (already clamped by the caller). */
export function zoneDesign(zone: ZoneType, level: number, v: number): Design {
  if (zone === ZoneType.Com) return comDesign(level, v);
  if (zone === ZoneType.Ind) return indDesign(level, v);
  return resDesign(level, v);
}
