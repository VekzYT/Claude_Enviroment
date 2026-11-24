// OWNER: ui agent. The HTML interface drawn over the 3D canvas. Keep these signatures.
import type { GameState, OverlayKind, Plan, Settings, Speed, TileInfo, ToolId } from '../core/types';

/** Everything the UI can ask the game to do. main.ts implements this. */
export interface UIActions {
  getState(): GameState;
  setTool(tool: ToolId): void;
  getTool(): ToolId;
  setSpeed(speed: Speed): void;
  setOverlay(overlay: OverlayKind): void;
  getOverlay(): OverlayKind;
  setTax(zone: 'res' | 'com' | 'ind', percent: number): void;
  undo(): void;
  canUndo(): boolean;
  /** Generate a map for the new-city screen preview without starting it. */
  previewMap(seed: number): GameState;
  /** Start playing on the map with this seed. */
  startNewCity(seed: number, name: string): void;
  /** Resume the saved city. Resolves false if there is none or it failed to load. */
  continueCity(): Promise<boolean>;
  hasSave(): Promise<boolean>;
  saveNow(): Promise<void>;
  /** A text code holding the whole city, for backup. */
  exportSave(): string;
  /** Load a code made by exportSave. Resolves false (and the UI shows an error) if it is invalid. */
  importSave(code: string): Promise<boolean>;
  getSettings(): Settings;
  setSettings(settings: Settings): void;
  /** Centre the camera on a tile. */
  focusTile(x: number, z: number): void;
  /** Let the UI make sounds/haptics for its own buttons. */
  click(): void;
}

export interface UI {
  /** Called every frame. The UI throttles its own DOM writes. */
  update(state: GameState, dt: number): void;
  /** Cost bubble / reason while dragging a tool (null clears it). */
  setPreview(plan: Plan | null): void;
  /** Open the inspect panel for a tile, or close it with null. */
  showInspect(info: TileInfo | null): void;
  /** Show the title screen (Continue / New City). */
  showTitle(): void;
  /** True while a full-screen menu or the title is open (main pauses input to the world). */
  isModalOpen(): boolean;
}

export function createUI(_root: HTMLElement, _actions: UIActions): UI {
  return {
    update() {},
    setPreview() {},
    showInspect() {},
    showTitle() {},
    isModalOpen() {
      return false;
    },
  };
}
