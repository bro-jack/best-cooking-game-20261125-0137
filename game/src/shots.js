// Screenshot scenes behind ?shot=start|play|serve|end.
// Each stages a real game state (orders, plate, station progress, timer)
// through the world's own reset/serve path, so the frame is what a real
// game looks like at that moment, and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function setOrders(world, specs) {
  world.state.orders = specs.map((s, i) => ({
    id: i + 1,
    dish: s.dish,
    name: s.name,
    needs: [...s.needs],
    patience: s.patience,
    maxPatience: s.maxPatience ?? s.patience,
    face: s.face,
    vip: !!s.vip,
  }));
}

/** Stage `world` to the named scene and return the screen to draw and best. */
export function stageShot(name, world) {
  const s = world.state;
  if (name === 'play') {
    // Rush Hour (level 3): 4 orders incl. a VIP, a new dish mid-assembly.
    world.reset();
    s.level = 3;
    s.levelName = 'RUSH HOUR';
    s.levelReached = 3;
    s.timeLeft = 50;
    s.elapsed = 130;
    s.score = 5200;
    s.coins = 128000;
    s.combo = 3;
    s.served = 9;
    setOrders(world, [
      { dish: 'bakso-mie', name: 'Bakso Mie', needs: ['kuah', 'mie', 'tahu-goreng'], patience: 18, maxPatience: 25, face: 1, vip: true },
      { dish: 'soto-ayam', name: 'Soto Ayam', needs: ['ayam-suwir', 'telur-dadar', 'kuah'], patience: 22, maxPatience: 25, face: 2 },
      { dish: 'rendang', name: 'Rendang', needs: ['ayam-rendang', 'nasi'], patience: 15, maxPatience: 25, face: 0 },
      { dish: 'ayam-bakar', name: 'Ayam Bakar', needs: ['ayam-bakar', 'nasi', 'kecap'], patience: 20, maxPatience: 25, face: 3 },
    ]);
    // Rendang mid-assembly: wok frying ayam into rendang, plate holds rendang.
    s.station = { kind: 'wok', progress: 1.9, total: 3.0, input: 'ayam', result: 'ayam-rendang', doneAt: null, burnt: false };
    s.plate = ['ayam-rendang'];
    s.hand = 'kuah';
    s.chefX = 620;
    // A just-earned coin floater: the kitchen feels alive, mid-rush.
    s.floaters = [{ text: '+Rp15.000', x: 700, y: 290, life: 0.9, color: '#7ee787' }];
    return { screen: SCREEN_PLAY, best: 5200 };
  }
  if (name === 'serve') {
    // Jam Makan Siang (level 2): a new dish (Bakso Mie) complete and ready.
    world.reset();
    s.level = 2;
    s.levelName = 'JAM MAKAN SIANG';
    s.levelReached = 2;
    s.timeLeft = 96;
    s.elapsed = 84;
    s.score = 3200;
    s.coins = 91000;
    s.combo = 4;
    s.served = 6;
    setOrders(world, [
      { dish: 'bakso-mie', name: 'Bakso Mie', needs: ['kuah', 'mie', 'tahu-goreng'], patience: 30, maxPatience: 35, face: 1 },
      { dish: 'soto-ayam', name: 'Soto Ayam', needs: ['ayam-suwir', 'telur-dadar', 'kuah'], patience: 18, maxPatience: 35, face: 3 },
    ]);
    // Plate complete and ready: the matching order glows for serving.
    s.plate = ['kuah', 'mie', 'tahu-goreng'];
    s.plateReady = 'bakso-mie';
    s.hand = null;
    s.chefX = 620;
    s.floaters = [{ text: '+Rp18.000', x: 1020, y: 290, life: 0.95, color: '#7ee787' }];
    return { screen: SCREEN_PLAY, best: 3200 };
  }
  if (name === 'end') {
    world.reset();
    s.level = 3;
    s.levelName = 'RUSH HOUR';
    s.levelReached = 3;
    s.timeLeft = 0;
    s.elapsed = 180;
    s.score = 14200;
    s.coins = 312000;
    s.served = 18;
    s.bestCombo = 7;
    s.combo = 0;
    s.hearts = 2;
    s.vipServed = 2;
    s.burnt = 1;
    s.servedDishes = ['nasi-goreng', 'mie-goreng', 'soto-ayam', 'bakso-mie', 'rendang', 'es-jeruk'];
    s.orders = [];
    s.over = true;
    s.overReason = 'Shift selesai! Warung tutup dengan bangga.';
    return { screen: SCREEN_OVER, best: 14200 };
  }
  // start (default): title over a live kitchen with two orders waiting.
  world.reset();
  s.timeLeft = 180;
  setOrders(world, [
    { dish: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi-goreng', 'telur-dadar', 'kecap'], patience: 41, face: 0 },
    { dish: 'es-jeruk', name: 'Es Jeruk', needs: ['jeruk-peras', 'es'], patience: 35, face: 2 },
  ]);
  s.chefX = 640;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { STEP };
