// Talking to people in the street. E next to someone (on foot, not aiming, with nothing else to
// use) and they stop, turn to you and answer in their own way — friendly, busy, suspicious, a fan
// of the radio... Now and then an exchange comes with a choice. Bump into people or point a gun
// at them and they react instead.
import { G, emit, addPlugin } from '../state.js';
import { Input } from '../input.js';
import { Dialogue } from '../ui/dialogue.js';
import { SPORT_LOOKS } from '../entities/pedlooks.js';
import { pay, weightRumour, jobTip } from './people.js';
import { pick, chance } from '../util/rng.js';
import { addTokens } from '../save.js';

const ME = 'KESTREL';
const NAMES = ['Ari', 'Bea', 'Cal', 'Dee', 'Eli', 'Fen', 'Gus', 'Hana', 'Ira', 'Jo', 'Kit', 'Lou', 'Mo', 'Nell', 'Oz', 'Pia', 'Quin', 'Rae', 'Sol', 'Tam', 'Uma', 'Vic', 'Wren', 'Yuki', 'Zed'];
const HELLO = ['Hey.', 'Hi there.', 'Got a second?', 'Excuse me.', 'Hey — how is it going?', 'Nice day, huh?'];

// Personalities, picked from who someone is and what they are doing.
const KINDS = {
  friendly: { color: '#7dffb0', lines: ['Hi! Lovely day for it, whatever it is.', 'Hey yourself. Stay helpful out there.', 'Oh, hello! You have a very trustworthy face. Statistically.', 'Morning! Or afternoon. Time is a construct, but lunch is not.'] },
  busy: { color: '#ffb347', lines: ['Sorry — late for a meeting about meetings.', 'Can not stop, I have a deadline in seven minutes.', 'Not now, I am on a call. With myself. It is important.'] },
  suspicious: { color: '#ff8a5c', lines: ['Do I know you? You look like trouble with a nice jacket.', 'Whatever you are selling, I already have two.', 'Keep walking, friend. I have pepper spray and a strong opinion.'] },
  radio: { color: '#5ff3ff', lines: ['You listen to CLAUDE FM? "Context Window Down" is a masterpiece. Fight me.', 'TOKEN STREAM at night with the windows down. That is the whole plan.', 'BAYOU STATIC is the only honest station left. The swamp does not lie.'] },
  thinker: { color: '#b48cff', lines: ['Do you ever think the city is just predicting what we do next?', 'I asked the tower a question once. It answered with a better question.', 'If a car drifts and nobody is filming, did it really drift?'] },
  tourist: { color: '#dca236', lines: ['Is that Claude Tower? It is so much taller in person!', 'Where is the beach? I have been walking towards it for an hour.', 'Everyone here is so polite. Suspiciously polite.'] },
  jogger: { color: '#2ec4b6', lines: ['Can not stop — personal best!', 'Five more kilometres! Ask me later!', 'Running from my problems! Great cardio!'] },
  sitting: { color: '#9fb39a', lines: ['Best bench in the city, this one. Do not tell anyone.', 'Just watching the traffic. It is like a screensaver.', 'I come here to think. Mostly I think about lunch.'] },
};
const AGAIN = ['Still here?', 'We did this already.', 'You again! Hi again.', 'Yes? Something else?'];
const BUMP = ['Hey, watch it!', 'Excuse YOU.', 'Ow! Eyes up!', 'Rude.', 'Personal space, pal!'];
const GUN = ['Whoa! Okay! Okay!', 'Not the face!', 'I have done nothing! Mostly!', 'Help! Somebody help!'];

function kindOf(p) {
  if (p.habit === 'jog' || SPORT_LOOKS.includes(p.look)) return 'jogger';
  if (p.mode === 'sit' || p.mode === 'beach') return 'sitting';
  if (p.habit === 'phone' || p.act === 'phone') return 'busy';
  const k = ['friendly', 'friendly', 'radio', 'suspicious', 'thinker', 'tourist', 'busy', 'friendly'];
  return k[Math.floor(p.seed * k.length)];
}

class Street {
  constructor() { this.memo = new Map(); this.cool = 0; this.bumpT = 0; this.near = null; }

  // someone you could talk to: close, in front of you, on their feet (or sitting) and calm
  candidate() {
    const pl = G.player, fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
    return G.peds.nearest(pl.pos.x + fx * 0.7, pl.pos.z + fz * 0.7, 1.7, (p) => p.role === 'civ' && p.alive && Math.abs(p.pos.y - pl.pos.y) < 1.2
      && p.state !== 'ragdoll' && p.state !== 'down' && p.state !== 'flee' && p.state !== 'cower');
  }

  talk(p) {
    const pl = G.player;
    const m = this.memo.get(p.id) || { n: 0, name: NAMES[p.id % NAMES.length], kind: kindOf(p) };
    this.memo.set(p.id, m);
    if (this.memo.size > 200) this.memo.delete(this.memo.keys().next().value);
    m.n++;
    const K = KINDS[m.kind], who = m.name.toUpperCase();
    pl.heading = Math.atan2(p.pos.x - pl.pos.x, p.pos.z - pl.pos.z);
    // joggers answer over their shoulder and keep going
    if (m.kind !== 'jogger') { p.talkT = 3.2; p.faceH = Math.atan2(pl.pos.x - p.pos.x, pl.pos.z - p.pos.z); }
    G.hud.clearSpeech();
    G.hud.say(ME, pick(HELLO), 1.4);
    // a few people have more to say, and ask you something back
    const deep = m.n === 1 && m.kind !== 'jogger' && m.kind !== 'busy' && chance(0.3);
    if (deep) {
      const node = this.chat(p, m, who, K);
      if (node) { G.hud.clearSpeech(); p.talkT = 600; Dialogue.start(node, { npc: p, onClose: () => { p.talkT = 0.8; p.faceH = null; } }); return; }
    }
    G.hud.say(who, m.n > 1 && chance(0.6) ? pick(AGAIN) : pick(K.lines));
  }

  // a conversation with a choice, by personality
  chat(p, m, who, K) {
    const say = (text, choices) => ({ who, role: m.kind === 'radio' ? 'Radio fan' : m.kind[0].toUpperCase() + m.kind.slice(1), color: K.color, text, choices });
    switch (m.kind) {
      case 'radio': return say('Quick — best station on the dial. Go.', [
        { label: 'CLAUDE FM', then: () => say('Synthwave and sunsets. Respect.') },
        { label: 'TOKEN STREAM', then: () => say('Drum and bass at 172 BPM. You live dangerously.') },
        { label: 'HAIKU RADIO', then: () => say('Five, seven, five. Calm mind. Good choice.') },
        { label: 'No radio, I like the quiet', then: () => say('The quiet. Wow. Okay. Bold.') },
      ]);
      case 'thinker': return say('Do you think the city dreams when nobody is driving through it?', [
        { label: 'Every night', then: () => say('I knew it. The traffic lights blink in its sleep.') },
        { label: 'Only when it is idle', then: () => say('Idle dreams. That is beautiful. Or a power-saving mode.') },
        { label: 'Cities do not dream', then: () => say('That is exactly what a dreaming city would say.') },
      ]);
      case 'tourist': return say('Sorry — which way to Claude Tower? My map app keeps saying "it depends".', [
        { label: 'Point the way', then: () => { emit('sfx', 'token'); addTokens(15, 'tip'); return say('Thank you! Here, for your trouble. Do people tip here? I am tipping.'); } },
        { label: 'Look up. Biggest thing in the sky.', then: () => say('Oh. OH. Right. Thank you. Very helpful. Slightly rude.') },
      ]);
      case 'suspicious': return say('You have been following me for three blocks. Who sent you?', [
        { label: 'Nobody. Relax.', then: () => say('That is what somebody would say. I am watching you.') },
        { label: 'The tower sent me', then: () => say('...I knew it. Tell them I paid the parking fine. Mostly.') },
      ]);
      default: {
        const tip = chance(0.5);
        return say(tip ? 'You look like you get things done. I heard something you might like — for, say, 40 tokens?' : 'You look like someone looking for work. I hear things.', [
          tip ? { label: 'Deal', note: '40 ◈', disabled: G.save.tokens < 40, then: () => { if (!pay(40)) return null; const w = weightRumour(); return say(w ? `There is a Lost Weight glowing near ${w}` : 'Huh. Seems somebody already found them all. No refunds.'); } }
            : { label: 'What kind of work?', then: () => { const j = jobTip(); return say(j ? `People keep talking about "${j}". Check your map.` : 'Honestly? None. It is a quiet week.'); } },
          { label: 'No thanks', then: () => say(pick(['Suit yourself.', 'Fair. Have a good one.'])) },
        ]);
      }
    }
  }

  update(dt) {
    this.near = null;
    if (G.indoors || G.mode !== 'play') return;
    const pl = G.player;
    this.cool -= dt; this.bumpT -= dt;
    if (pl.vehicle || !pl.alive || pl.state !== 'foot') return;
    // pointing a gun at someone: hands up, then they run
    const tg = G.weapons && G.weapons.target;
    if (pl.aiming && tg && tg.kind === 'ped' && tg.obj.role === 'civ' && G.weapons.current.id === 'pistol' && tg.dist < 25) {
      const p = tg.obj;
      if (p.state !== 'flee' && p.state !== 'cower' && p.state !== 'ragdoll' && p.state !== 'down') {
        p.talkT = 0; p.state = 'cower'; p.stateT = 0; p.cowerT = 0.8 + Math.random(); p.fleeT = 8; p.fleeFrom = { x: pl.pos.x, z: pl.pos.z };
        if (this.cool <= 0) { this.cool = 3; G.hud.say(this.nameOf(p), pick(GUN), 1.6); }
      }
      return;
    }
    // walking into someone
    if (pl.speed > 2.2 && this.bumpT <= 0) {
      const b = G.peds.nearest(pl.pos.x, pl.pos.z, 0.62, (p) => p.role === 'civ' && p.state === 'walk' && Math.abs(p.pos.y - pl.pos.y) < 1);
      if (b) {
        this.bumpT = 2.5;
        b.talkT = 1.1; b.faceH = Math.atan2(pl.pos.x - b.pos.x, pl.pos.z - b.pos.z);
        // a good shove from a sprint pushes them aside
        if (pl.speed > 6) { const d = Math.hypot(b.pos.x - pl.pos.x, b.pos.z - pl.pos.z) || 1; b.pos.x += ((b.pos.x - pl.pos.x) / d) * 0.35; b.pos.z += ((b.pos.z - pl.pos.z) / d) * 0.35; }
        G.hud.say(this.nameOf(b), pick(BUMP), 1.5);
        emit('sfx', 'thud', b.pos.x, b.pos.z);
      }
    }
    // a car right beside you still gets E (F always does); a parked one a few steps away does not
    if (pl.aiming || G.interact.active || G.hud.promptNext || pl.nearestVehicle(1.6)) return;
    const p = this.candidate();
    if (!p) return;
    this.near = p;
    G.hud.prompt(`<kbd>E</kbd>Talk`);
    G.interact.active = true;
    if (Input.hit('KeyE') && this.cool <= 0) { this.cool = 0.6; this.talk(p); }
  }
  nameOf(p) { const m = this.memo.get(p.id); return (m ? m.name : NAMES[p.id % NAMES.length]).toUpperCase(); }
}

export const StreetTalk = new Street();
addPlugin({ update(dt) { StreetTalk.update(dt); } });
