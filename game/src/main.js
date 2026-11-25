// Dapur Nusantara Rush — boot and the one loop.
// Screens: title, play, paused, game over. Input is read every frame, the
// world advances in fixed 1/60 s steps, the renderer paints what is there.
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, FIELD, INGREDIENTS, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_SERVED, EVENT_EXPIRED, EVENT_OVER, EVENT_WRONG,
  EVENT_COOKED, EVENT_CHOPPED, EVENT_PLATED, EVENT_LEVELUP, EVENT_BURNT,
  STATION_CHOP, STATION_WOK, STATION_GRILL, STATION_PLATE, STATION_TRASH,
  STATIONS, ING_BIN, ORDER_BOARD, ORDER_TICKET,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { createAudio } from './audio.js';

const MAX_FRAME = 0.25;

/** Bin keyboard index: Digit1-9 -> 0-8, Digit0 -> 9, Q -> 10, E -> 11, R -> 12. */
function binIndex(code) {
  const digit = /^Digit([1-9])$/.exec(code);
  if (digit) return Number(digit[1]) - 1;
  if (code === 'Digit0') return 9;
  if (code === 'KeyQ') return 10;
  if (code === 'KeyE') return 11;
  if (code === 'KeyR') return 12;
  return -1;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
// Ultra HD split: staged screenshots render at 3x supersampling for maximum
// sharpness; live play uses 2x so the game stays smooth.
const renderer = createRenderer(canvas, shot ? { ss: 3 } : { ss: 2 });
const audio = createAudio();

function toLogical(px, py) {
  // The renderer scales the 1280x720 field to fit; invert that mapping.
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
  const ox = (rect.width - FIELD.width * scale) / 2;
  const oy = (rect.height - FIELD.height * scale) / 2;
  return { x: (px * rect.width - ox) / scale, y: (py * rect.height - oy) / scale };
}

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}

function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  let t = 0.6;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, t);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, toLogical);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let time = 0;

  function announce(message) { status.textContent = message; }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Main! Ambil bahan, masak, sajikan sebelum pelanggan kabur.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopSizzle();
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    announce(`Selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function react(events) {
    if (events & EVENT_SERVED) { audio.ding(); }
    else if (events & EVENT_WRONG) { audio.buzz(); }
    else if (events & EVENT_COOKED) { audio.stopSizzle(); audio.plate(); }
    else if (events & EVENT_CHOPPED) { audio.chop(); }
    else if (events & EVENT_PLATED) { audio.plate(); }
    if (events & EVENT_LEVELUP) { audio.levelup(); }
    if (events & EVENT_BURNT) { audio.stopSizzle(); audio.buzz(); }
    if (events & EVENT_EXPIRED) { audio.buzz(); }
    if (events & EVENT_OVER) endGame();
  }

  /** One click in logical coordinates. Returns nothing; sounds via react. */
  function handleClick(p) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) { startGame(); return; }
    if (screen !== SCREEN_PLAY) return;
    const s = world.state;
    // Order tickets: serve the ready plate.
    if (inRect(p, ORDER_BOARD)) {
      for (let i = 0; i < s.orders.length; i += 1) {
        const y = ORDER_BOARD.y + ORDER_TICKET.dy + i * ORDER_TICKET.step;
        if (p.x >= ORDER_BOARD.x + 8 && p.x <= ORDER_BOARD.x + ORDER_BOARD.w - 8 && p.y >= y && p.y <= y + ORDER_TICKET.h) {
          react(world.serveOrder(s.orders[i].id));
          return;
        }
      }
    }
    // Ingredient bins.
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const r = { x: ING_BIN.x + i * (ING_BIN.w + ING_BIN.gap), y: ING_BIN.y, w: ING_BIN.w, h: ING_BIN.h };
      if (inRect(p, r)) {
        const ev = world.pickIngredient(INGREDIENTS[i].id);
        if (ev === 0) audio.pop(); else audio.buzz();
        return;
      }
    }
    // Stations: a finished job is collected with a click, otherwise used.
    for (const kind of [STATION_CHOP, STATION_WOK, STATION_GRILL, STATION_PLATE, STATION_TRASH]) {
      const r = STATIONS[kind];
      if (!inRect(p, r)) continue;
      if (s.station.kind === kind && s.station.progress >= s.station.total) {
        react(world.collectStation());
        return;
      }
      const ev = world.useStation(kind);
      if (ev === 0) {
        if (kind === STATION_WOK || kind === STATION_GRILL) audio.startSizzle();
        else audio.pop();
      } else if (ev !== EVENT_PLATED) {
        audio.buzz();
      }
      react(ev);
      return;
    }
  }

  function handleKeys() {
    for (const code of input.takeKeys()) {
      if (screen !== SCREEN_PLAY) continue;
      const idx = binIndex(code);
      if (idx >= 0 && idx < INGREDIENTS.length) {
        const ev = world.pickIngredient(INGREDIENTS[idx].id);
        if (ev === 0) audio.pop(); else audio.buzz();
        continue;
      }
      const station = { KeyC: STATION_CHOP, KeyW: STATION_WOK, KeyG: STATION_GRILL, KeyP: STATION_PLATE, KeyT: STATION_TRASH }[code];
      if (!station) continue;
      const s = world.state;
      if (s.station.kind === station && s.station.progress >= s.station.total) {
        react(world.collectStation());
        continue;
      }
      const ev = world.useStation(station);
      if (ev === 0 && (station === STATION_WOK || station === STATION_GRILL)) audio.startSizzle();
      react(ev);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED; audio.stopSizzle(); announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY; announce('Lanjut main.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    handleActions();
    handleKeys();
    for (const click of input.takeClicks()) handleClick(click);
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        react(world.step(STEP));
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, time);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Jeda.');
    }
  });

  announce('Dapur Nusantara Rush. Klik atau tekan Spasi untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
