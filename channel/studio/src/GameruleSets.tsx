import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { KitDefs, SetDefs, SchoolStreet, HomeStreet, ParkingLot, Nightstand, BedTop, BedCover, Car, AlarmClock, Hero, basePose, LOOKS, LOT } from './engine';

// GAMERULE's sets, one per frame, to check them before they go into shots:
//   npx remotion still src/index.ts GameruleSets out/sets-0.png --frame 0
//   (0: school street, 1: home street, 2: parking lot, 3: nightstand, 4: the bed from above)

export const GameruleSets: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#0E0C1E' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        {f === 0 ? (
          <g>
            <SchoolStreet t={30} id="pv0" hole={1} />
            <Hero look={LOOKS.you} pose={{ ...basePose, x: 760, y: 812 - 140 * 0.62, scale: 0.62, yaw: -0.4 }} t={20} />
          </g>
        ) : f === 1 ? (
          <g>
            <HomeStreet t={30} id="pv1" busX={1400} />
            <Hero look={LOOKS.you} pose={{ ...basePose, x: 600, y: 812 - 140 * 0.62, scale: 0.62, yaw: 0.5 }} t={20} />
          </g>
        ) : f === 2 ? (
          <g>
            <ParkingLot t={30} id="pv2" />
            <Car x={1000} y={LOT.carY} s={0.95} hazard t={0} />
            <Hero look={LOOKS.you} pose={{ ...basePose, x: 380, y: 980 - 140 * 0.85, scale: 0.85, yaw: 0.45 }} t={20} />
          </g>
        ) : f === 3 ? (
          <g>
            <Nightstand t={30} id="pv3" />
            <AlarmClock x={960} y={626} s={1.6} t={9} ring={1} />
          </g>
        ) : (
          <g>
            <BedTop t={30} id="pv4" />
            <Hero look={{ ...LOOKS.you, pack: false }} pose={{ ...basePose, x: 960, y: 262 + 176 * 1.5, scale: 1.5, expr: 'groggy' }} shadow={0} t={20} />
            <BedCover t={30} id="pv4" />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
