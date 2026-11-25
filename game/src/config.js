// Dapur Nusantara Rush — every tuning number and colour in one place.
// Playfield is a fixed 1280x720 logical area; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds. */
export const SHIFT_SECONDS = 180;

export const HEARTS = 3;
export const BURN_SECONDS = 4;
export const VIP_CHANCE = 0.25;

/** Three levels inside one 180 s shift. Pressure grows for real: patience
 *  shrinks, orders spawn faster, more tickets fit the board, new dishes
 *  unlock, VIPs arrive in Rush Hour — and in Rush Hour a wok/grill job left
 *  more than BURN_SECONDS after it finishes burns and must be trashed. */
export const LEVEL_AT = [0, 60, 120];
export const LEVELS = [
  {
    name: 'BUKA WARUNG', patience: 45, spawn: 11, maxOrders: 2,
    dishes: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh'], unlock: [],
  },
  {
    name: 'JAM MAKAN SIANG', patience: 35, spawn: 8, maxOrders: 3,
    dishes: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh', 'soto-ayam', 'gado-gado', 'es-jeruk', 'nasi-uduk'],
    unlock: ['soto-ayam', 'gado-gado', 'es-jeruk', 'nasi-uduk'],
  },
  {
    name: 'RUSH HOUR', patience: 25, spawn: 6, maxOrders: 4,
    dishes: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh', 'soto-ayam', 'gado-gado', 'es-jeruk', 'nasi-uduk', 'rendang', 'martabak', 'bakso-mie', 'ayam-bakar'],
    unlock: ['rendang', 'martabak', 'bakso-mie', 'ayam-bakar'],
  },
];

// --- Ingredients -------------------------------------------------------------
// id, label, colour, drawn shape, what station turns it into what.
// 13 bins on the counter (keys 1-9, 0, Q, E, R), each bin 92 px wide.

export const CHOP_SECONDS = 1.6;
export const COOK_SECONDS = 3.0;
export const GRILL_SECONDS = 3.2;

// --- Ingredients -------------------------------------------------------------
// id, label, colour, emoji-free drawn shape, what station turns it into what.
export const INGREDIENTS = [
  { id: 'nasi', label: 'Nasi', color: '#f5efe0', shape: 'bowl' },
  { id: 'mie', label: 'Mie', color: '#f2c94c', shape: 'nest' },
  { id: 'ayam', label: 'Ayam', color: '#e88a7a', shape: 'drum' },
  { id: 'telur', label: 'Telur', color: '#fdf3d0', shape: 'egg' },
  { id: 'sayur', label: 'Sayur', color: '#6fbf5a', shape: 'leaf' },
  { id: 'kecap', label: 'Kecap', color: '#5a3220', shape: 'bottle' },
  { id: 'teh', label: 'Teh', color: '#c98a3d', shape: 'cup' },
  { id: 'es', label: 'Es', color: '#aee6f5', shape: 'cube' },
  { id: 'tahu', label: 'Tahu', color: '#f7f0dc', shape: 'cube' },
  { id: 'kacang', label: 'Kacang', color: '#d9a066', shape: 'nuts' },
  { id: 'jeruk', label: 'Jeruk', color: '#f08a1d', shape: 'orange' },
  { id: 'sambal', label: 'Sambal', color: '#c0392b', shape: 'bowl-red' },
  { id: 'kuah', label: 'Kuah', color: '#c98a3d', shape: 'broth' },
];

/** Keyboard label per bin: 1-9, then 0, Q, E, R. */
export const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'E', 'R'];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// Chopping: raw -> chopped / squeezed. Cooking: raw -> cooked. Grilling.
export const CHOP = { ayam: 'ayam-potong', sayur: 'sayur-potong', jeruk: 'jeruk-peras' };
export const COOK = {
  nasi: 'nasi-goreng', mie: 'mie-goreng', telur: 'telur-dadar',
  ayam: 'ayam-rendang', kacang: 'bumbu-kacang', tahu: 'tahu-goreng',
  'ayam-potong': 'ayam-suwir',
};
export const GRILL = { 'ayam-potong': 'sate-ayam', ayam: 'ayam-bakar' };

export const ITEM_LABEL = {
  nasi: 'Nasi', mie: 'Mie', ayam: 'Ayam', telur: 'Telur', sayur: 'Sayur',
  kecap: 'Kecap', teh: 'Teh', es: 'Es Batu',
  tahu: 'Tahu', kacang: 'Kacang', jeruk: 'Jeruk', sambal: 'Sambal', kuah: 'Kuah',
  'ayam-potong': 'Ayam Potong', 'sayur-potong': 'Sayur Potong', 'jeruk-peras': 'Jeruk Peras',
  'nasi-goreng': 'Nasi Goreng', 'mie-goreng': 'Mie Goreng', 'telur-dadar': 'Telur Dadar',
  'sate-ayam': 'Sate Ayam', 'ayam-rendang': 'Rendang Ayam', 'bumbu-kacang': 'Bumbu Kacang',
  'tahu-goreng': 'Tahu Goreng', 'ayam-suwir': 'Ayam Suwir', 'ayam-bakar': 'Ayam Bakar',
  gosong: 'Gosong!',
};

export const ITEM_COLOR = {
  nasi: '#f5efe0', mie: '#f2c94c', ayam: '#e88a7a', telur: '#fdf3d0', sayur: '#6fbf5a',
  kecap: '#5a3220', teh: '#c98a3d', es: '#aee6f5',
  tahu: '#f7f0dc', kacang: '#d9a066', jeruk: '#f08a1d', sambal: '#c0392b', kuah: '#d99a4a',
  'ayam-potong': '#e88a7a', 'sayur-potong': '#6fbf5a', 'jeruk-peras': '#f08a1d',
  'nasi-goreng': '#d98a3d', 'mie-goreng': '#e0a83c', 'telur-dadar': '#f7d774', 'sate-ayam': '#b06a2e',
  'ayam-rendang': '#6b3410', 'bumbu-kacang': '#a06a2e', 'tahu-goreng': '#d9a83c',
  'ayam-suwir': '#e8c89a', 'ayam-bakar': '#8a4a1e', gosong: '#1a1a1a',
};

// --- Dishes (plate recipes) ---------------------------------------------------
// 12 dishes: 4 from level 1, 4 unlock at level 2, 4 unlock at level 3.
export const DISHES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi-goreng', 'telur-dadar', 'kecap'], price: 15000, color: '#d98a3d', icon: 'bowl' },
  { id: 'mie-goreng', name: 'Mie Goreng', needs: ['mie-goreng', 'sayur-potong', 'kecap'], price: 14000, color: '#e0a83c', icon: 'nest' },
  { id: 'sate-ayam', name: 'Sate Ayam', needs: ['sate-ayam', 'kecap'], price: 18000, color: '#b06a2e', icon: 'skewer' },
  { id: 'es-teh', name: 'Es Teh', needs: ['teh', 'es'], price: 8000, color: '#c98a3d', icon: 'cup' },
  { id: 'soto-ayam', name: 'Soto Ayam', needs: ['ayam-suwir', 'telur-dadar', 'kuah'], price: 17000, color: '#d99a4a', icon: 'broth' },
  { id: 'gado-gado', name: 'Gado-Gado', needs: ['sayur-potong', 'tahu-goreng', 'bumbu-kacang'], price: 16000, color: '#a06a2e', icon: 'bowl' },
  { id: 'es-jeruk', name: 'Es Jeruk', needs: ['jeruk-peras', 'es'], price: 9000, color: '#f08a1d', icon: 'cup' },
  { id: 'nasi-uduk', name: 'Nasi Uduk', needs: ['nasi', 'telur-dadar', 'sambal'], price: 13000, color: '#f5efe0', icon: 'bowl' },
  { id: 'rendang', name: 'Rendang', needs: ['ayam-rendang', 'nasi'], price: 22000, color: '#6b3410', icon: 'bowl' },
  { id: 'martabak', name: 'Martabak', needs: ['telur-dadar', 'sayur-potong', 'sambal'], price: 15000, color: '#e0a83c', icon: 'fold' },
  { id: 'bakso-mie', name: 'Bakso Mie', needs: ['kuah', 'mie', 'tahu-goreng'], price: 18000, color: '#d99a4a', icon: 'broth' },
  { id: 'ayam-bakar', name: 'Ayam Bakar', needs: ['ayam-bakar', 'nasi', 'kecap'], price: 20000, color: '#8a4a1e', icon: 'drum' },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const PALETTE = {
  backdrop: '#2b1d12',
  wall: '#f7e8c9',
  wallStripe: '#e8c98f',
  floor: '#8a5a2e',
  counter: '#a06a35',
  counterTop: '#c98d4e',
  board: '#3d2a18',
  boardPaper: '#fff8e6',
  panel: '#fff8e6',
  ink: '#2b1d12',
  muted: '#7a5a38',
  accent: '#c0392b',
  gold: '#f2c94c',
  green: '#4e9b47',
  red: '#c0392b',
  timer: '#c0392b',
  hand: '#ffe9a8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Best score between visits (this browser only). */
export const BEST_KEY = 'dapur-nusantara.best';
