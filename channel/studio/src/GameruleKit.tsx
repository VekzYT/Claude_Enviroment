import React from 'react';
import { AbsoluteFill } from 'remotion';
import { KitDefs, SetDefs, DuskSky, ItemBlock, BLOCKS, BlockKind, ChatBox, MineCracks, AlarmClock, Bus, Car, Bike, StreetLamp, Hotbar, GrTitle, BlockBurst, FONT } from './engine';

// A test sheet of GAMERULE's game layer and episode props, to check them before they go into shots:
//   npx remotion still src/index.ts GameruleKit out/gamerule-kit.png

export const GameruleKit: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#14101C' }}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <KitDefs />
      <SetDefs />
      <DuskSky id="kitsky" horizonY={1000} />
      <StreetLamp x={120} y={760} h={420} t={0} />
      <Bus x={560} y={760} s={0.55} />
      <Car x={1250} y={760} s={0.6} />
      <Bike x={1640} y={760} s={0.8} />
      <AlarmClock x={1780} y={380} s={0.9} t={7} ring={1} />
      {(Object.keys(BLOCKS) as BlockKind[]).map((k, i) => (
        <g key={k}>
          <ItemBlock x={180 + i * 150} y={130} t={i * 17} size={64} kind={k} />
          <text x={180 + i * 150} y={235} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill="#F6EFE3">{k}</text>
        </g>
      ))}
      <rect x={1200} y={80} width={220} height={220} rx={10} fill="#D64545" stroke="#141024" strokeWidth={6} />
      <MineCracks x={1200} y={80} w={220} h={220} p={0.7} id="kit" hx={0.4} hy={0.45} />
      <BlockBurst x={1520} y={170} t={8} kind="brick" />
      <ChatBox f={60} lines={[{ at: 0, text: '/gamerule mineAnything true' }, { at: 30, text: 'Gamerule mineAnything is now set to: true', kind: 'sys' }, { at: 40, text: '[Admin] interesting.', kind: 'admin' }]} y={960} />
      <GrTitle t={40} lines={['WHAT IF YOU COULD', 'MINE ANYTHING?']} accent="ANYTHING" y={360} size={96} />
      <Hotbar f={30} slots={[{ kind: 'clock' }, { kind: 'brick', count: 12 }, { kind: 'car' }, null, null, null, null, null, { kind: 'water' }]} sel={2} y={1060} />
    </svg>
  </AbsoluteFill>
);
