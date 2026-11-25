// Keyboard and pointer input for the warung.
// Clicks are reported as logical playfield coordinates (1280x720) so the loop
// can hit-test bins, stations and order tickets. Keys: 1-9, 0, Q, E, R
// ingredients (13 bins), C chop, W wok, G grill, P plate, T trash,
// Space confirm, Esc pause, M mute.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['Escape']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas, toLogical) {
  let actions = 0;
  let clicks = [];
  let keys = new Set();

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (/^Digit[0-9]$/.test(event.code) || /^Key[CFWGPTQER]$/.test(event.code)) {
      keys.add(event.code);
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    clicks.push(toLogical(px, py));
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    takeKeys() {
      const taken = keys;
      keys = new Set();
      return taken;
    },
  };
}
