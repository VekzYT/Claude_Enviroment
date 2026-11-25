// Controls for the operative's moves: touch buttons for the roll and the slide (climbing and
// vaulting share JUMP) and their rows in the controls help.
import { G } from '../state.js';
import { addTouchButtons } from '../touch.js';
import { addControls } from '../ui/menus.js';

const onFoot = (c) => c === 'f' && !G.player.swimming;
// one spot above the weapon button: ROLL, or SLIDE while sprinting (both press C)
addTouchButtons([
  { id: 'roll', icon: 'back', cap: 'ROLL', key: 'KeyC', on: 'f', when: (c) => onFoot(c) && !G.player.sprinting },
  { id: 'slide', icon: 'brake', cap: 'SLIDE', key: 'KeyC', on: 'f', when: (c) => onFoot(c) && G.player.sprinting },
]);
addControls(
  [['C', 'Dodge roll (a sidestep while aiming), slide when sprinting'], ['Space at a wall', 'Climb a ledge or vault (sprinting vaults low walls, benches and cars)'], ['Space in the air', 'Kick off a wall; hold to grab a ledge']],
  [['back', 'Dodge roll (a sidestep while aiming)'], ['brake', 'Slide (while sprinting)'], ['jump', 'At a wall: climb or vault; in the air: wall kick, hold to grab a ledge']],
);

const css = document.createElement('style');
css.textContent = `
#t-roll, #t-slide { width: 54px; height: 54px; right: calc(28px + var(--sr)); bottom: calc(172px + var(--sb)); }
#t-roll svg, #t-slide svg { width: 24px; height: 24px; }
`;
document.head.appendChild(css);
