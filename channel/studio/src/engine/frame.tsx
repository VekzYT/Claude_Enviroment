import React from 'react';

// GAMERULE: the visible frame, so the HUD can lay itself out for the format. Shots draw in the 1920 x 1080 screen
// space either way; a tall (Shorts) render shows a 1080-wide, 1920-tall window of it (scaled by k), and the HUD (the
// hotbar, the chat, the title card) is drawn in that window's own layout space instead of the screen's.

export type FrameInfo = {
  /** the window's top-left corner, in screen space */
  x: number;
  y: number;
  /** the layout size the HUD works in: 1920 x 1080 wide, 1080 x 1920 tall */
  w: number;
  h: number;
  /** screen units per layout unit (a tall window zoomed out by k shows k times more) */
  k: number;
  tall: boolean;
};

export const WIDE: FrameInfo = { x: 0, y: 0, w: 1920, h: 1080, k: 1, tall: false };

export const FrameCtx = React.createContext<FrameInfo>(WIDE);
export const useFrame = () => React.useContext(FrameCtx);

/**
 * A tall window onto the screen: centred on (cx, cy) in screen space, zoomed out by k. The layout space is
 * 1080 x 1920, so a window at k 1 shows the frame's full height plus 420 above and below.
 */
export const tallFrame = (cx: number, cy = 540, k = 1): FrameInfo => ({ x: cx - 540 * k, y: cy - 960 * k, w: 1080, h: 1920, k, tall: true });

/** Draws its children in the frame's layout space (0..w, 0..h), whatever the format. */
export const HudLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const F = useFrame();
  return F.tall ? <g transform={`translate(${F.x} ${F.y}) scale(${F.k})`}>{children}</g> : <>{children}</>;
};

/** Where Shorts' own buttons and caption sit (bottom 22%, right 11%): keep HUD out of it in a tall frame. */
export const SAFE = { bottom: 430, right: 130, top: 200 };
