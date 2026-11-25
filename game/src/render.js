// Drawing only: the warung, the food, the people — pixels out.
// Realism is done in code, not assets: layered radial gradients for skin and
// food, glossy highlights, cast shadows, drifting steam, flickering flames
// under the wok and glowing embers under the grill, wood grain on the counter.
// The 1280x720 playfield is scaled to fit the window and centred.
import { FIELD, FONT, PALETTE, INGREDIENTS, ITEM_COLOR, ITEM_LABEL, DISHES, DISH_BY_ID, LEVELS, KEY_LABELS, HEARTS } from './config.js';
import { STATIONS, STATION_CHOP, STATION_WOK, STATION_GRILL, STATION_PLATE, STATION_TRASH, ING_BIN, ORDER_BOARD, ORDER_TICKET } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const SKINS = ['#f2c89b', '#e8b07e', '#c98d5f', '#8a5a34'];
const HAIRS = ['#2b1d12', '#4a2f18', '#111111', '#6b3a1e'];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function grain(ctx, x, y, w, h, base, dark) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = dark;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const yy = y + 8 + i * ((h - 16) / 4);
    ctx.beginPath();
    ctx.moveTo(x + 4, yy);
    ctx.bezierCurveTo(x + w * 0.3, yy + 3, x + w * 0.6, yy - 3, x + w - 4, yy + 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function gloss(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w / 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** One wisp of steam, animated by time t (seconds) and phase p. */
function steam(ctx, x, y, t, p, scale) {
  const rise = ((t * 22 + p * 40) % 46);
  const alpha = 0.34 * (1 - rise / 46);
  const sway = Math.sin((t + p) * 2.2) * 5;
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x + sway, y - rise, 7 * scale, 12 * scale, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - sway * 0.6 + 8, y - rise - 8, 5 * scale, 9 * scale, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Dark smoke from something burnt, same motion as steam but grey. */
function smoke(ctx, x, y, t, p, scale) {
  const rise = ((t * 18 + p * 40) % 46);
  const alpha = 0.5 * (1 - rise / 46);
  const sway = Math.sin((t + p) * 1.8) * 6;
  ctx.fillStyle = `rgba(40,40,40,${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x + sway, y - rise, 9 * scale, 13 * scale, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - sway * 0.6 + 9, y - rise - 9, 6 * scale, 10 * scale, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Layered flame under a station, flickering with time. */
function flames(ctx, x, y, w, t) {
  for (let i = 0; i < 5; i += 1) {
    const fx = x + (w / 5) * i + w / 10;
    const fl = 16 + Math.sin(t * 9 + i * 2.1) * 6 + Math.sin(t * 23 + i) * 3;
    const grad = ctx.createLinearGradient(fx, y, fx, y - fl - 14);
    grad.addColorStop(0, '#ff7a1a');
    grad.addColorStop(0.55, '#ffb02e');
    grad.addColorStop(1, 'rgba(255,230,120,0.9)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx - 9, y);
    ctx.quadraticCurveTo(fx - 11, y - fl * 0.6, fx, y - fl - 8);
    ctx.quadraticCurveTo(fx + 11, y - fl * 0.6, fx + 9, y);
    ctx.closePath();
    ctx.fill();
  }
}

/** Draw one ingredient / cooked item, centred at (x, y), radius r. */
export function drawItem(ctx, id, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  const s = r / 30;
  ctx.scale(s, s);
  const c = ITEM_COLOR[id] || '#ddd';
  if (id === 'nasi') {
    const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 26);
    g.addColorStop(0, '#fffdf4'); g.addColorStop(1, '#e8dcc0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 2, 24, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i += 1) {
      const a = (i * 2.399) % (Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 14, -4 - Math.abs(Math.sin(a)) * 12, 3, 1.6, a, 0, Math.PI * 2); ctx.fill();
    }
    // A few toasted grains for depth.
    ctx.fillStyle = '#d9c48f';
    for (let i = 0; i < 5; i += 1) {
      const a = (i * 1.7 + 0.6) % (Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 10, -2 - Math.abs(Math.sin(a)) * 8, 2.4, 1.3, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-7, -12, 9, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'mie' || id === 'mie-goreng') {
    ctx.strokeStyle = id === 'mie' ? '#f2c94c' : '#d99a2b';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 5 + i * 3.1, i * 0.9, i * 0.9 + Math.PI * 1.25);
      ctx.stroke();
    }
    // Oily sheen between strands.
    ctx.strokeStyle = 'rgba(255,220,120,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(2, 2, 10, 0.6, 2.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-4, -6, 12, 3.6, 5.2); ctx.stroke();
    if (id === 'mie-goreng') {
      ctx.fillStyle = '#6fbf5a';
      ctx.fillRect(-14, -4, 7, 3); ctx.fillRect(6, 8, 7, 3); ctx.fillRect(-2, 12, 6, 3);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(2, -12, 5, 3); ctx.fillRect(-12, 6, 4, 3);
      ctx.fillStyle = '#f7d774'; ctx.fillRect(10, -10, 5, 3);
    }
  } else if (id === 'ayam') {
    const g = ctx.createRadialGradient(-8, -8, 2, 0, 0, 26);
    g.addColorStop(0, '#f2a08e'); g.addColorStop(1, '#c96a55');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-3, 2, 17, 14, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7ead6';
    ctx.fillRect(10, -8, 12, 5); ctx.fillRect(10, 2, 12, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-8, -6, 8, 5, -0.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fdf6e0';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(190,160,110,0.5)';
    ctx.beginPath(); ctx.ellipse(0, 4, 13, 17, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(-5, -8, 5, 7, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sayur' || id === 'sayur-potong') {
    ctx.fillStyle = '#4e9b47';
    for (let i = 0; i < 3; i += 1) {
      ctx.save(); ctx.rotate(-0.5 + i * 0.5);
      ctx.beginPath(); ctx.ellipse(0, -8, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f6b2a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -20); ctx.stroke();
    if (id === 'sayur-potong') {
      ctx.fillStyle = '#7cc46a';
      ctx.fillRect(-14, 6, 28, 4); ctx.fillRect(-10, 12, 22, 4);
    }
  } else if (id === 'kecap') {
    ctx.fillStyle = '#3a1e10';
    rr(ctx, -9, -18, 18, 36, 5); ctx.fill();
    ctx.fillStyle = '#5a3220'; rr(ctx, -5, -24, 10, 8, 3); ctx.fill();
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(-9, -4, 18, 12);
    ctx.fillStyle = '#c0392b'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KECAP', 0, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-7, -14, 3, 28);
  } else if (id === 'teh') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.moveTo(-13, -12); ctx.lineTo(13, -12); ctx.lineTo(9, 14); ctx.lineTo(-9, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b06a1e';
    ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(11, -8); ctx.lineTo(8, 12); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-4, -4, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(14, 0, 7, -1.2, 1.2); ctx.stroke();
  } else if (id === 'es') {
    ctx.fillStyle = '#aee6f5';
    for (const [dx, dy, rot] of [[-8, -4, 0.3], [8, -6, -0.2], [0, 8, 0.1]]) {
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(rot);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-8, -8, 16, 4);
      // Cracks inside the ice.
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(2, 2); ctx.lineTo(6, 6); ctx.stroke();
      ctx.fillStyle = '#aee6f5';
      ctx.restore();
    }
  } else if (id === 'ayam-potong') {
    ctx.fillStyle = '#e88a7a';
    for (const [dx, dy] of [[-9, -6], [9, -6], [0, 8]]) {
      rr(ctx, dx - 8, dy - 7, 16, 14, 3); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-14, -11, 8, 3); ctx.fillRect(4, -11, 8, 3);
  } else if (id === 'nasi-goreng') {
    const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 26);
    g.addColorStop(0, '#e8a54b'); g.addColorStop(1, '#a86a1e');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 2, 24, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7d774'; ctx.fillRect(-12, -8, 8, 4); ctx.fillRect(4, -12, 8, 4);
    ctx.fillStyle = '#6fbf5a'; ctx.fillRect(-4, -6, 6, 3); ctx.fillRect(10, -4, 6, 3);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-16, -2, 5, 3); ctx.fillRect(8, 2, 4, 3);
    // Individual rice grains on the mound.
    ctx.fillStyle = '#fff3cf';
    for (let i = 0; i < 10; i += 1) {
      const a = (i * 2.1 + 0.4) % (Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12, -2 - Math.abs(Math.sin(a)) * 8, 2.6, 1.4, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-8, -10, 9, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur-dadar') {
    const g = ctx.createLinearGradient(0, -14, 0, 14);
    g.addColorStop(0, '#fbe08a'); g.addColorStop(1, '#e0a83c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b07a1e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -2, 18, 8, 0, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 3, 15, 6, 0, 0.4, Math.PI - 0.4); ctx.stroke();
    // Browned spots where the egg crisped.
    ctx.fillStyle = '#c98a2e';
    ctx.beginPath(); ctx.ellipse(-12, 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -6, 2.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2, 6, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-8, -5, 8, 3, -0.2, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sate-ayam') {
    ctx.strokeStyle = '#c98d4e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.stroke();
    for (const dx of [-14, 0, 14]) {
      const g = ctx.createRadialGradient(dx - 2, -3, 1, dx, 0, 9);
      g.addColorStop(0, '#c98a4a'); g.addColorStop(1, '#7a4416');
      ctx.fillStyle = g;
      rr(ctx, dx - 8, -8, 16, 15, 4); ctx.fill();
      ctx.fillStyle = '#3a2410'; ctx.fillRect(dx - 5, -5, 3, 2); ctx.fillRect(dx + 2, 2, 3, 2);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-20, -7, 6, 2); ctx.fillRect(-6, -7, 6, 2); ctx.fillRect(8, -7, 6, 2);
    // Peanut-sauce drizzle over the skewers + onion slices.
    ctx.strokeStyle = '#a06a2e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, 4); ctx.quadraticCurveTo(-7, 8, 6, 3); ctx.quadraticCurveTo(14, 0, 22, 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-18, 8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 9, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'tahu') {
    const g = ctx.createLinearGradient(-12, -12, 12, 12);
    g.addColorStop(0, '#fffdf2'); g.addColorStop(1, '#e8ddc0');
    ctx.fillStyle = g;
    rr(ctx, -14, -12, 28, 24, 4); ctx.fill();
    ctx.fillStyle = 'rgba(180,150,90,0.5)';
    ctx.fillRect(-8, -6, 3, 2); ctx.fillRect(4, 2, 3, 2); ctx.fillRect(-2, 6, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-12, -10, 24, 3);
  } else if (id === 'kacang') {
    for (const [dx, dy, rot] of [[-10, -4, 0.4], [8, -8, -0.3], [0, 2, 0.1], [-2, 10, 0.5], [11, 8, -0.5]]) {
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(rot);
      const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
      g.addColorStop(0, '#e8b878'); g.addColorStop(1, '#a06a2e');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  } else if (id === 'jeruk') {
    const g = ctx.createRadialGradient(-7, -9, 2, 0, 0, 26);
    g.addColorStop(0, '#ffb347'); g.addColorStop(1, '#d96a0a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,70,0,0.45)';
    for (const [dx, dy] of [[-8, 4], [6, 8], [10, -6], [-2, -10], [-14, -2], [14, 4], [0, 12], [-4, 14]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4e9b47';
    ctx.beginPath(); ctx.ellipse(10, -20, 9, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-8, -10, 7, 4, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'jeruk-peras') {
    ctx.fillStyle = '#e86a0a';
    ctx.beginPath(); ctx.arc(0, 2, 22, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcf7a';
    ctx.beginPath(); ctx.arc(0, 0, 19, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * 17, -Math.cos(a) * 17); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-8, -12, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.ellipse(0, 8, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-6, -8, 2, 0, -2, 22);
    g.addColorStop(0, '#e5534b'); g.addColorStop(1, '#8a1a10');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8e6';
    ctx.fillRect(-8, -8, 3, 2); ctx.fillRect(4, -6, 3, 2); ctx.fillRect(-2, -4, 2, 2);
    ctx.fillRect(10, -4, 3, 2); ctx.fillRect(-14, -2, 2, 2); ctx.fillRect(0, -10, 2, 2);
    ctx.fillStyle = '#6fbf5a'; ctx.fillRect(-12, -4, 4, 2); ctx.fillRect(8, -8, 4, 2);
    // Oil droplets on the sambal.
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
    ctx.beginPath(); ctx.arc(-4, -12, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-7, -10, 7, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'kuah') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.ellipse(0, 6, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-6, -4, 2, 0, 2, 24);
    g.addColorStop(0, '#e8b45c'); g.addColorStop(1, '#a86a1e');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 2, 23, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Meatballs floating in the broth + scallions + fried shallots.
    for (const [bx, by] of [[-10, 2], [8, -2]]) {
      const bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
      bg.addColorStop(0, '#d9a06a'); bg.addColorStop(1, '#8a5a2e');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(bx - 2, by - 2, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#6fbf5a';
    ctx.beginPath(); ctx.arc(-8, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath(); ctx.arc(0, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b06a2e';
    ctx.fillRect(-14, -6, 3, 2); ctx.fillRect(12, 2, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-8, -3, 7, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam-suwir') {
    ctx.strokeStyle = '#e8c89a'; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
      ctx.lineWidth = 5 - (i % 2);
      ctx.beginPath();
      ctx.moveTo(-18 + i * 8, -10 + (i % 2) * 6);
      ctx.quadraticCurveTo(-10 + i * 8, 2, -14 + i * 8, 14 - (i % 3) * 4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,110,50,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-10, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(6, 8); ctx.stroke();
  } else if (id === 'ayam-rendang') {
    for (const [dx, dy] of [[-12, -4], [6, -8], [-2, 8]]) {
      const g = ctx.createRadialGradient(dx - 2, dy - 3, 1, dx, dy, 11);
      g.addColorStop(0, '#8a4a1e'); g.addColorStop(1, '#3a1c08');
      ctx.fillStyle = g;
      rr(ctx, dx - 9, dy - 8, 18, 15, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,180,80,0.5)'; ctx.fillRect(dx - 6, dy - 6, 6, 2);
    }
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-16, 2, 4, 2); ctx.fillRect(10, -2, 4, 2);
    // Coconut flakes + oily sheen on the rendang.
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(-14, -10, 4, 2); ctx.fillRect(2, -12, 4, 2); ctx.fillRect(8, 6, 4, 2);
    ctx.fillStyle = 'rgba(255,200,100,0.35)';
    ctx.beginPath(); ctx.ellipse(-6, -12, 12, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,140,0.4)';
    ctx.beginPath(); ctx.ellipse(4, 4, 10, 3, 0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bumbu-kacang') {
    const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 24);
    g.addColorStop(0, '#c98d4e'); g.addColorStop(1, '#7a4a16');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 2, 22, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8b878'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, 2, 14, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(2, 8, 14, -2); ctx.stroke();
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(-10, -8, 3, 2); ctx.fillRect(2, -4, 3, 2); ctx.fillRect(8, -10, 3, 2);
    ctx.fillRect(-4, 2, 3, 2); ctx.fillRect(10, 0, 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-7, -11, 8, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'tahu-goreng') {
    const g = ctx.createLinearGradient(-12, -12, 12, 12);
    g.addColorStop(0, '#f2cd6a'); g.addColorStop(0.6, '#d9a83c'); g.addColorStop(1, '#a06a1e');
    ctx.fillStyle = g;
    rr(ctx, -14, -12, 28, 24, 4); ctx.fill();
    ctx.fillStyle = '#7a4a16';
    ctx.fillRect(-10, -8, 4, 3); ctx.fillRect(4, 4, 4, 3); ctx.fillRect(-2, 6, 4, 2);
    ctx.fillRect(8, -8, 3, 2); ctx.fillRect(-6, 2, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-12, -10, 24, 3);
  } else if (id === 'ayam-bakar') {
    const g = ctx.createRadialGradient(-8, -8, 2, 0, 0, 26);
    g.addColorStop(0, '#c98a4a'); g.addColorStop(1, '#6b3410');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-3, 2, 17, 14, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7ead6';
    ctx.fillRect(10, -8, 12, 5); ctx.fillRect(10, 2, 12, 5);
    ctx.strokeStyle = '#2b1408'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-4, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(4, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(12, 2); ctx.stroke();
    // Sweet-soy glaze sheen.
    ctx.fillStyle = 'rgba(255,190,90,0.5)';
    ctx.beginPath(); ctx.ellipse(-6, -10, 9, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-8, -6, 8, 5, -0.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'gosong') {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(-6, 2, 14, 11, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, 4, 12, 9, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.ellipse(-8, -4, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,120,120,0.7)';
    ctx.beginPath(); ctx.ellipse(0, -12, 5, 8, 0.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

const SKIN_DARK = ['#d9a06e', '#c98d5f', '#a06a3e', '#6e4526'];

/** A realistic face: oval head, shaded skin, real eyes with iris, nose, lips,
 *  brows that carry the mood, and one of four distinct identities:
 *  0 young man (short side-part hair), 1 woman in a hijab, 2 older man with
 *  a cap and moustache, 3 woman with long hair and a bun.
 *  mood 0 happy, 1 neutral, 2 worried, 3 angry. Small radii (r < 18, the
 *  order-board thumbnails) get the same face with the finest detail skipped. */
function drawFace(ctx, x, y, r, skinIdx, mood, t) {
  const style = skinIdx % 4;
  const skin = SKINS[style];
  const shade = SKIN_DARK[style];
  const hair = HAIRS[style];
  const big = r >= 18;

  // Hair behind the head (hijab / long hair under-layer).
  if (style === 1) {
    ctx.fillStyle = '#7a2436';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 1.2, r * 1.24, 0, 0, Math.PI * 2); ctx.fill();
  } else if (style === 3) {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.35, r * 1.12, r * 1.28, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Ears, with an inner-ear curve so they read as real ears.
  if (big) {
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.ellipse(x - r * 0.92, y + r * 0.05, r * 0.1, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.92, y + r * 0.05, r * 0.1, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.5)';
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath(); ctx.arc(x - r * 0.92, y + r * 0.05, r * 0.05, -1.2, 1.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.92, y + r * 0.05, r * 0.05, Math.PI - 1.4, Math.PI + 1.2); ctx.stroke();
  }
  // Soft cheekbone shadow under each cheek (revisi pelanggan 12:13 WIB).
  if (big) {
    ctx.fillStyle = 'rgba(120,60,25,0.14)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.55, y + r * 0.3, r * 0.24, r * 0.12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.55, y + r * 0.3, r * 0.24, r * 0.12, -0.2, 0, Math.PI * 2); ctx.fill();
  }

  // Face: oval, radial skin gradient, soft shadow on the lower right.
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r * 1.25);
  g.addColorStop(0, skin); g.addColorStop(0.7, skin); g.addColorStop(1, shade);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.92, r * 1.06, 0, 0, Math.PI * 2); ctx.fill();
  // Forehead highlight.
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.55, r * 0.4, r * 0.22, -0.2, 0, Math.PI * 2); ctx.fill();

  // Hair / headwear on top of the head.
  if (style === 0) {
    // Short hair with a side part: cap over the crown + fringe sweep.
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.3, r * 0.96, r * 0.78, 0, Math.PI, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.3, y - r * 0.42, r * 0.5, r * 0.3, -0.3, Math.PI, 0);
    ctx.fill();
    // Texture strokes: individual hair strands sweeping from the part.
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(1, r * 0.04);
    for (const [dx, dy] of [[-0.4, -0.75], [0, -0.85], [0.4, -0.72], [-0.6, -0.6], [0.6, -0.58], [-0.15, -0.9]]) {
      ctx.beginPath(); ctx.moveTo(x + dx * r, y + dy * r); ctx.quadraticCurveTo(x + (dx + 0.15) * r, y + (dy - 0.12) * r, x + (dx + 0.3) * r, y + (dy - 0.05) * r); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, r * 0.035);
    for (const [dx, dy] of [[-0.2, -0.8], [0.2, -0.82]]) {
      ctx.beginPath(); ctx.moveTo(x + dx * r, y + dy * r); ctx.quadraticCurveTo(x + (dx + 0.1) * r, y + (dy - 0.1) * r, x + (dx + 0.22) * r, y + (dy - 0.04) * r); ctx.stroke();
    }
    // Sideburns.
    ctx.fillStyle = hair;
    ctx.fillRect(x - r * 0.95, y - r * 0.1, r * 0.08, r * 0.35);
    ctx.fillRect(x + r * 0.87, y - r * 0.1, r * 0.08, r * 0.35);
  } else if (style === 1) {
    // Hijab frame: rim around the face opening + folds + knot under the chin.
    ctx.strokeStyle = '#7a2436'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.98, r * 1.1, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.08, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.08, Math.PI * 1.4, Math.PI * 1.85); ctx.stroke();
    // Natural cloth folds radiating from the crown + a sheen on the rim.
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1, r * 0.04);
    for (const a of [Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75]) {
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.55, y - r * 0.1 + Math.sin(a) * r * 0.55);
      ctx.lineTo(x + Math.cos(a) * r * 1.02, y - r * 0.1 + Math.sin(a) * r * 1.02);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.0, Math.PI * 1.3, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = '#5a1a28';
    ctx.beginPath(); ctx.ellipse(x, y + r * 1.18, r * 0.22, r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  } else if (style === 2) {
    // Baseball cap: dome, brim, button, side hair tufts.
    ctx.fillStyle = '#2e4a6b';
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.42, r * 0.92, r * 0.62, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#22384f';
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.3, r * 1.02, r * 0.2, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath(); ctx.arc(x, y - r * 1.0, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.02); ctx.lineTo(x, y - r * 0.45); ctx.stroke();
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(x - r * 0.95, y - r * 0.15, r * 0.1, r * 0.3);
    ctx.fillRect(x + r * 0.85, y - r * 0.15, r * 0.1, r * 0.3);
  } else {
    // Long hair: side locks framing the face + bun on top.
    ctx.fillStyle = hair;
    rr(ctx, x - r * 1.08, y - r * 0.2, r * 0.24, r * 1.3, r * 0.12); ctx.fill();
    rr(ctx, x + r * 0.84, y - r * 0.2, r * 0.24, r * 1.3, r * 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - r * 1.05, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath(); ctx.moveTo(x - r * 0.96, y); ctx.lineTo(x - r * 0.96, y + r * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.96, y); ctx.lineTo(x + r * 0.96, y + r * 0.6); ctx.stroke();
    // Extra strands over each lock + a shine on the bun.
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath(); ctx.moveTo(x - r * 0.88, y - r * 0.1); ctx.lineTo(x - r * 0.88, y + r * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.88, y - r * 0.1); ctx.lineTo(x + r * 0.88, y + r * 0.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath(); ctx.arc(x, y - r * 1.05, r * 0.18, Math.PI * 1.2, Math.PI * 1.7); ctx.stroke();
  }

  // Nose: bridge highlight for 3D volume, soft shadow line + nostril shade.
  if (big) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.02, y - r * 0.05, r * 0.05, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.45)';
    ctx.lineWidth = Math.max(1, r * 0.05); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.06, y - r * 0.02);
    ctx.quadraticCurveTo(x + r * 0.14, y + r * 0.28, x, y + r * 0.32);
    ctx.stroke();
    ctx.fillStyle = 'rgba(90,50,20,0.35)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.08, y + r * 0.34, r * 0.07, r * 0.04, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.08, y + r * 0.34, r * 0.07, r * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Eyes: white, iris, pupil, glint — or closed happy arcs.
  const eyeY = y - r * 0.12;
  const eyeDX = r * 0.36;
  if (mood === 0) {
    ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(x + s * eyeDX, eyeY + r * 0.06, r * 0.16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
  } else {
    const open = mood === 3 ? 0.07 : 0.11;
    for (const s of [-1, 1]) {
      const ex = x + s * eyeDX;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(ex, eyeY, r * 0.17, r * open, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2f18';
      ctx.beginPath(); ctx.arc(ex, eyeY, r * 0.085, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(ex, eyeY, r * 0.045, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex - r * 0.03, eyeY - r * 0.035, r * 0.025, 0, Math.PI * 2); ctx.fill();
      // Upper eyelid crease + lashes on the outer corner (big faces only).
      if (big) {
        ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = Math.max(1, r * 0.035); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ex, eyeY - r * 0.02, r * 0.18, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + s * r * 0.16, eyeY - r * 0.1); ctx.lineTo(ex + s * r * 0.22, eyeY - r * 0.16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + s * r * 0.12, eyeY - r * 0.12); ctx.lineTo(ex + s * r * 0.17, eyeY - r * 0.19); ctx.stroke();
      }
    }
  }

  // Brows: tapered strokes, angled by mood (inner end toward the nose).
  ctx.strokeStyle = hair; ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const bx = x + s * eyeDX;
    const by = eyeY - r * 0.26;
    const innerX = bx + s * r * 0.16;
    const outerX = bx - s * r * 0.16;
    ctx.beginPath();
    if (mood === 0) { ctx.moveTo(outerX, by + r * 0.04); ctx.quadraticCurveTo(bx, by - r * 0.08, innerX, by); }
    else if (mood === 1) { ctx.moveTo(outerX, by); ctx.lineTo(innerX, by - r * 0.02); }
    else if (mood === 2) { ctx.moveTo(outerX, by + r * 0.05); ctx.lineTo(innerX, by - r * 0.09); }
    else { ctx.moveTo(outerX, by - r * 0.05); ctx.lineTo(innerX, by + r * 0.09); }
    ctx.stroke();
  }

  // Mouth: lips, shaped by mood.
  const mouthY = y + r * 0.48;
  const lip = style === 1 || style === 3 ? '#a04a3e' : '#7a3a2a';
  if (mood === 0) {
    ctx.fillStyle = '#6e2a1e';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.32, mouthY);
    ctx.quadraticCurveTo(x, mouthY + r * 0.42, x + r * 0.32, mouthY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, mouthY + r * 0.02);
    ctx.quadraticCurveTo(x, mouthY + r * 0.14, x + r * 0.28, mouthY + r * 0.02);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.strokeStyle = lip; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 1) { ctx.moveTo(x - r * 0.28, mouthY); ctx.lineTo(x + r * 0.28, mouthY); }
    else if (mood === 2) { ctx.arc(x, mouthY + r * 0.3, r * 0.3, Math.PI * 1.15, Math.PI * 1.85); }
    else { ctx.moveTo(x - r * 0.28, mouthY + r * 0.1); ctx.lineTo(x + r * 0.28, mouthY - r * 0.06); }
    ctx.stroke();
    // Lower-lip volume highlight under the mouth line (big faces).
    if (big) {
      ctx.fillStyle = 'rgba(255,150,130,0.45)';
      ctx.beginPath(); ctx.ellipse(x, mouthY + r * 0.12, r * 0.16, r * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Moustache for the older man.
  if (style === 2 && big) {
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath(); ctx.ellipse(x - r * 0.16, mouthY - r * 0.1, r * 0.2, r * 0.09, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.16, mouthY - r * 0.1, r * 0.2, r * 0.09, 0.25, 0, Math.PI * 2); ctx.fill();
  }

  // Blush when happy, sweat drop when worried / angry.
  if (mood === 0) {
    ctx.fillStyle = 'rgba(255,120,120,0.4)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.58, y + r * 0.28, r * 0.15, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.58, y + r * 0.28, r * 0.15, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  } else if (big && (mood === 2 || mood === 3)) {
    ctx.fillStyle = 'rgba(140,200,240,0.9)';
    ctx.beginPath(); ctx.arc(x + r * 0.72, y - r * 0.42, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.72, y - r * 0.62);
    ctx.lineTo(x + r * 0.63, y - r * 0.42);
    ctx.lineTo(x + r * 0.81, y - r * 0.42);
    ctx.closePath(); ctx.fill();
  }
}

export function createRenderer(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  // Supersample factor: opts.ss overrides (shot mode uses 3 for maximum
  // screenshot sharpness, live play uses 2 for smoothness); otherwise
  // adaptive by window area.

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    // ULTRA HD (aturan permanen user, 2026-11-25 11:54 WIB): supersample the
    // backing store so text and edges stay razor-sharp when the browser
    // composites the canvas down. Screenshot files stay 1280x720 (RULES
    // cap: long side at most 1280), but every pixel in them is rendered
    // from a much higher-resolution backing store. Live play uses 2x
    // (2560x1440 backing at 720p) for smoothness; staged shots use 3x
    // (3840x2160) for maximum sharpness — the backing pixel count is what
    // costs frames in software rendering, so the split buys both.
    const w0 = window.innerWidth * ratio;
    const h0 = window.innerHeight * ratio;
    const ss = opts.ss ?? ((w0 * h0 <= 1000000) ? 3 : (w0 * h0 <= 2500000) ? 2 : 1);
    const width = Math.round(w0 * ss);
    const height = Math.round(h0 * ss);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, `${bold ? 'bold ' : ''}${size}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }

  function bar(x, y, w, h, frac, color, bg) {
    ctx.fillStyle = bg || 'rgba(0,0,0,0.35)';
    rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color;
    if (frac > 0.01) { rr(ctx, x, y, Math.max(h, w * frac), h, h / 2); ctx.fill(); }
  }

  function drawWall(t, state) {
    // Warm tiled wall + window with evening sky + hanging lamps.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, 300);
    ctx.fillStyle = PALETTE.wallStripe;
    for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 0, 3, 300);
    ctx.fillRect(0, 148, FIELD.width, 3);
    // Window: dusky sky, sun, rooftops.
    ctx.fillStyle = '#7a4a6e';
    rr(ctx, 520, 24, 230, 110, 8); ctx.fill();
    const sky = ctx.createLinearGradient(520, 24, 520, 134);
    sky.addColorStop(0, '#e8a34c'); sky.addColorStop(1, '#7a4a6e');
    ctx.fillStyle = sky; rr(ctx, 526, 30, 218, 98, 6); ctx.fill();
    ctx.fillStyle = '#fff2c0';
    ctx.beginPath(); ctx.arc(690, 62, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2f3a';
    ctx.beginPath(); ctx.moveTo(526, 128); ctx.lineTo(576, 96); ctx.lineTo(630, 128); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(612, 128); ctx.lineTo(678, 88); ctx.lineTo(744, 128); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3d2a18'; ctx.lineWidth = 4;
    ctx.strokeRect(520, 24, 230, 110);
    // Menu board: all 12 dishes in two columns; dishes not yet unlocked at
    // the current level are dimmed, so the board shows the progression.
    // NOTE: the HUD bar covers y 0-64 and is drawn after the wall, so the
    // panel must start below y 64 or its title/first row get covered.
    const pool = state ? LEVELS[(state.level || 1) - 1].dishes : DISHES.map((d) => d.id);
    ctx.fillStyle = '#3d2a18';
    rr(ctx, 752, 72, 190, 116, 8); ctx.fill();
    ctx.fillStyle = '#f2c94c';
    text('MENU WARUNG • 12', 847, 92, 16, '#f2c94c', 'center', true);
    DISHES.forEach((d, i) => {
      const col = i < 6 ? 0 : 1;
      const row = i % 6;
      const unlocked = pool.includes(d.id);
      ctx.globalAlpha = unlocked ? 1 : 0.4;
      text(`${d.name} ${Math.round(d.price / 1000)}rb`, 760 + col * 96, 108 + row * 13, 11, unlocked ? '#fff8e6' : '#c9bfa8', 'left');
      ctx.globalAlpha = 1;
    });
    // Hanging lamps.
    for (const lx of [180, 1120]) {
      ctx.strokeStyle = '#3d2a18'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 34); ctx.stroke();
      const lg = ctx.createRadialGradient(lx, 44, 2, lx, 44, 26);
      lg.addColorStop(0, 'rgba(255,220,130,0.9)'); lg.addColorStop(1, 'rgba(255,220,130,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, 44, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.moveTo(lx - 16, 40); ctx.lineTo(lx + 16, 40); ctx.lineTo(lx + 8, 58); ctx.lineTo(lx - 8, 58); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(lx, 52, 5, 0, Math.PI * 2); ctx.fill();
    }
    // Shelf with jars.
    ctx.fillStyle = '#6b4423'; ctx.fillRect(340, 120, 150, 8);
    for (let i = 0; i < 3; i += 1) {
      const jx = 352 + i * 48;
      ctx.fillStyle = ['#c98a3d', '#6fbf5a', '#c0392b'][i];
      rr(ctx, jx, 88, 30, 32, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(jx + 3, 92, 5, 24);
    }
  }

  function drawHud(state, t) {
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, FIELD.width, 64);
    ctx.fillStyle = '#f2c94c';
    text('🍜 DAPUR NUSANTARA RUSH', 16, 42, 22, '#f2c94c', 'left', true);
    // Level pill: LV + level name, between the title and the timer.
    ctx.fillStyle = '#3d2a18';
    rr(ctx, 360, 10, 190, 44, 10); ctx.fill();
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 2;
    rr(ctx, 360, 10, 190, 44, 10); ctx.stroke();
    text(`LV ${state.level || 1}`, 372, 40, 20, '#f2c94c', 'left', true);
    text(state.levelName || '', 424, 40, 13, '#fff8e6', 'left', true);
    // Shift timer — big, with urgency colour.
    const mins = Math.floor(state.timeLeft / 60);
    const secs = Math.floor(state.timeLeft % 60);
    const timerText = `${mins}:${String(secs).padStart(2, '0')}`;
    const urgent = state.timeLeft <= 30;
    ctx.fillStyle = urgent && Math.floor(t * 2) % 2 === 0 ? '#ff6a5a' : '#fff8e6';
    rr(ctx, 560, 10, 160, 44, 10); ctx.fill();
    text('⏱ ' + timerText, 640, 42, 26, urgent ? '#c0392b' : '#2b1d12', 'center', true);
    text('Skor ' + state.score.toLocaleString('id-ID'), 760, 42, 24, '#fff8e6', 'left', true);
    text('Rp ' + state.coins.toLocaleString('id-ID'), 960, 42, 24, '#f2c94c', 'left', true);
    for (let i = 0; i < HEARTS; i += 1) {
      ctx.fillStyle = i < state.hearts ? '#e5534b' : 'rgba(255,255,255,0.2)';
      const hx = 1160 + i * 30;
      ctx.beginPath();
      ctx.moveTo(hx, 44);
      ctx.bezierCurveTo(hx - 12, 30, hx - 20, 40, hx, 52);
      ctx.bezierCurveTo(hx + 20, 40, hx + 12, 30, hx, 44);
      ctx.fill();
    }
    if (state.combo >= 2) {
      text(`x${state.combo}`, 905, 42, 22, '#7ee787', 'left', true);
    }
  }

  function drawOrders(state, highlightId) {
    const b = ORDER_BOARD;
    grain(ctx, b.x, b.y, b.w, b.h, '#6b4423', '#4a2f18');
    ctx.strokeStyle = '#3d2a18'; ctx.lineWidth = 4; ctx.strokeRect(b.x, b.y, b.w, b.h);
    text('📋 ORDER BOARD', b.x + 14, b.y + 26, 20, '#f2c94c', 'left', true);
    if (state.orders.length === 0) {
      text('Belum ada pesanan…', b.x + 14, b.y + 60, 16, '#fff8e6', 'left');
      return;
    }
    state.orders.forEach((order, i) => {
      const y = b.y + ORDER_TICKET.dy + i * ORDER_TICKET.step;
      const frac = Math.max(0, order.patience / order.maxPatience);
      const mood = frac > 0.6 ? 1 : frac > 0.3 ? 2 : 3;
      const isHi = highlightId === order.id;
      ctx.fillStyle = isHi ? '#ffe9a8' : PALETTE.boardPaper;
      rr(ctx, b.x + 8, y, b.w - 16, ORDER_TICKET.h, 6); ctx.fill();
      if (isHi) { ctx.strokeStyle = '#4e9b47'; ctx.lineWidth = 3; rr(ctx, b.x + 8, y, b.w - 16, ORDER_TICKET.h, 6); ctx.stroke(); }
      else if (order.vip) { ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; rr(ctx, b.x + 8, y, b.w - 16, ORDER_TICKET.h, 6); ctx.stroke(); }
      drawFace(ctx, b.x + 32, y + 21, 14, order.face, mood, 0);
      const dish = DISH_BY_ID[order.dish];
      text(order.name, b.x + 56, y + 19, 16, '#2b1d12', 'left', true);
      if (order.vip) text('★ VIP', b.x + 56, y + 36, 11, '#b07a1e', 'left', true);
      // Recipe as mini ingredient icons (no text overlap with the timer).
      dish.needs.forEach((need, ni) => {
        const ix = b.x + (order.vip ? 104 : 64) + ni * 30;
        drawItem(ctx, need, ix, y + 33, 10, 0);
        if (ni < dish.needs.length - 1) text('+', ix + 13, y + 37, 11, '#7a5a38', 'center', true);
      });
      bar(b.x + 196, y + 9, 76, 7, frac, frac > 0.5 ? '#4e9b47' : frac > 0.25 ? '#f2c94c' : '#c0392b');
      if (isHi) {
        ctx.fillStyle = '#4e9b47';
        rr(ctx, b.x + 196, y + 22, 76, 17, 8); ctx.fill();
        text('👉 SERVE!', b.x + 234, y + 35, 12, '#fff', 'center', true);
      } else {
        text(`${Math.ceil(order.patience)}s`, b.x + 234, y + 34, 12, '#7a5a38', 'center', true);
      }
    });
  }

  function drawCustomers(state, t) {
    // Four stools at the top-right; a customer sits where an order is live.
    // Each customer is a distinct person: neck, shoulders, collared shirt,
    // arms resting, and a realistic face (see drawFace).
    const slots = [988, 1071, 1154, 1234];
    const shirts = ['#4a7ab8', '#b84a6e', '#4e9b47', '#7a4a9b'];
    slots.forEach((cx, i) => {
      const order = state.orders[i];
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(cx - 34, 210, 68, 10);
      ctx.fillRect(cx - 26, 220, 8, 34); ctx.fillRect(cx + 18, 220, 8, 34);
      if (!order) {
        text('— kosong —', cx, 200, 12, '#7a5a38', 'center');
        return;
      }
      const frac = order.patience / order.maxPatience;
      const mood = frac > 0.6 ? 0 : frac > 0.3 ? 1 : frac > 0.15 ? 2 : 3;
      const bob = Math.sin(t * 2 + i) * 2;
      const shirt = shirts[i % 3];
      const skin = SKINS[order.face % SKINS.length];
      // Neck with shadow under the chin.
      ctx.fillStyle = skin;
      ctx.fillRect(cx - 7, 164 + bob, 14, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(cx - 7, 164 + bob, 14, 5);
      // Shoulders / shirt with shading, collar, buttons.
      const sg = ctx.createLinearGradient(cx, 176 + bob, cx, 228 + bob);
      sg.addColorStop(0, shirt); sg.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = sg;
      rr(ctx, cx - 34, 176 + bob, 68, 50, 14); ctx.fill();
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath(); ctx.moveTo(cx - 13, 178 + bob); ctx.lineTo(cx, 194 + bob); ctx.lineTo(cx - 2, 178 + bob); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 13, 178 + bob); ctx.lineTo(cx, 194 + bob); ctx.lineTo(cx + 2, 178 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(cx, 204 + bob, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, 216 + bob, 2, 0, Math.PI * 2); ctx.fill();
      // Shirt folds: soft vertical creases so the cloth is not a flat block.
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const fx of [-20, -6, 10, 22]) {
        ctx.beginPath();
        ctx.moveTo(cx + fx, 182 + bob);
        ctx.quadraticCurveTo(cx + fx + 3, 202 + bob, cx + fx - 2, 224 + bob);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 26, 184 + bob); ctx.lineTo(cx - 26, 220 + bob); ctx.stroke();
      // Arms resting: shirt sleeves + hands with fingers on the table edge.
      ctx.fillStyle = shirt;
      rr(ctx, cx - 38, 196 + bob, 13, 26, 6); ctx.fill();
      rr(ctx, cx + 25, 196 + bob, 13, 26, 6); ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(cx - 31, 224 + bob, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 31, 224 + bob, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(120,60,25,0.6)'; ctx.lineWidth = 1.2;
      for (const hx of [cx - 31, cx + 31]) {
        for (const fy of [222, 225, 228]) {
          ctx.beginPath(); ctx.moveTo(hx - 3, fy + bob); ctx.lineTo(hx + 3, fy + bob); ctx.stroke();
        }
      }
      drawFace(ctx, cx, 150 + bob, 26, order.face, mood, t);
      // Speech bubble with the dish they want (gold star for a VIP).
      ctx.fillStyle = order.vip ? '#fff2c0' : '#fff';
      rr(ctx, cx - 44, 92, 88, 34, 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 8, 126); ctx.lineTo(cx + 8, 126); ctx.lineTo(cx, 138); ctx.closePath(); ctx.fill();
      text(order.vip ? `★ ${order.name}` : order.name, cx, 114, order.vip ? 11 : 12, '#2b1d12', 'center', true);
    });
  }

  function drawStationBase(st, t, state) {
    const busy = state.station.kind === st;
    const done = busy && state.station.progress >= state.station.total;
    const s = STATIONS[st];
    shadow(ctx, s.x, s.y + s.h - 6, s.w, 10);
    if (st === STATION_CHOP) {
      grain(ctx, s.x, s.y, s.w, s.h, '#d9a05b', '#a06a35');
      ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3; ctx.strokeRect(s.x, s.y, s.w, s.h);
      // Knife.
      ctx.fillStyle = '#c8ccd4';
      ctx.beginPath(); ctx.moveTo(s.x + 130, s.y + 20); ctx.lineTo(s.x + 168, s.y + 20); ctx.lineTo(s.x + 168, s.y + 34); ctx.lineTo(s.x + 130, s.y + 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3d2a18'; ctx.fillRect(s.x + 168, s.y + 23, 16, 8);
      // The item being chopped, drawn big on the board (revisi 12:13 WIB).
      if (state.station.kind === STATION_CHOP) {
        drawItem(ctx, state.station.input, s.x + 90, s.y + 62, 30, t);
        ctx.fillStyle = '#6fbf5a';
        for (let i = 0; i < 6; i += 1) ctx.fillRect(s.x + 30 + i * 12, s.y + 66 + (i % 2) * 8, 9, 5);
      }
    } else if (st === STATION_WOK) {
      ctx.fillStyle = '#1d1d22';
      rr(ctx, s.x, s.y + 58, s.w, 26, 8); ctx.fill();
      flames(ctx, s.x + 14, s.y + 92, s.w - 28, t);
      // Wok bowl.
      const wg = ctx.createRadialGradient(s.x + 90, s.y + 40, 6, s.x + 90, s.y + 46, 80);
      wg.addColorStop(0, '#3a3a42'); wg.addColorStop(1, '#141416');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 46, 82, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#565660';
      ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 44, 76, 28, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2a2a30';
      ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 44, 72, 25, 0, Math.PI, 0); ctx.fill();
      // Food in the wok — big and filling the pan (revisi 12:13 WIB).
      if (state.station.kind === STATION_WOK) {
        drawItem(ctx, state.station.result, s.x + 90, s.y + 42, 40, t);
        if (state.station.burnt) {
          smoke(ctx, s.x + 70, s.y + 30, t, 0.2, 1);
          smoke(ctx, s.x + 110, s.y + 30, t, 0.7, 1);
        } else {
          steam(ctx, s.x + 70, s.y + 30, t, 0.2, 1);
          steam(ctx, s.x + 110, s.y + 30, t, 0.7, 1);
        }
      }
      ctx.fillStyle = 'rgba(255,180,60,0.5)';
      ctx.beginPath(); ctx.ellipse(s.x + 60, s.y + 38, 16, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    } else if (st === STATION_GRILL) {
      ctx.fillStyle = '#3a3a42';
      rr(ctx, s.x, s.y + 40, s.w, 52, 8); ctx.fill();
      // Glowing embers.
      for (let i = 0; i < 7; i += 1) {
        const ex = s.x + 18 + i * 22;
        const glow = 0.5 + Math.sin(t * 5 + i * 1.7) * 0.3;
        ctx.fillStyle = `rgba(255,${Math.floor(90 + glow * 80)},30,${glow.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(ex, s.y + 78, 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath(); ctx.moveTo(s.x + 10, s.y + 52 + i * 6); ctx.lineTo(s.x + s.w - 10, s.y + 52 + i * 6); ctx.stroke();
      }
      if (state.station.kind === STATION_GRILL) {
        drawItem(ctx, state.station.result, s.x + 90, s.y + 52, 40, t);
        if (state.station.burnt) {
          smoke(ctx, s.x + 90, s.y + 34, t, 0.4, 0.9);
        } else {
          steam(ctx, s.x + 90, s.y + 34, t, 0.4, 0.9);
        }
      }
    } else if (st === STATION_PLATE) {
      grain(ctx, s.x, s.y, s.w, s.h, '#c98d4e', '#8a5a2e');
      ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3; ctx.strokeRect(s.x, s.y, s.w, s.h);
      // White plate.
      const pg = ctx.createRadialGradient(s.x + 90, s.y + 52, 4, s.x + 90, s.y + 56, 62);
      pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#d9d2c4');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 56, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 56, 50, 20, 0, 0, Math.PI * 2); ctx.stroke();
      // Components on the plate — big, heaped, overlapping like a real
      // served dish (revisi 12:13 WIB: r 17 -> 24, spacing 38 -> 48).
      state.plate.forEach((item, i) => {
        drawItem(ctx, item, s.x + 42 + i * 48, s.y + 52, 24, t);
      });
      if (state.plateReady) {
        const pulse = 0.6 + Math.sin(t * 5) * 0.4;
        ctx.strokeStyle = `rgba(78,155,71,${pulse.toFixed(2)})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(s.x + 90, s.y + 56, 78, 36, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#4e9b47';
        rr(ctx, s.x + 18, s.y + 92, 144, 22, 8); ctx.fill();
        text('✓ SIAP DISAJIKAN!', s.x + 90, s.y + 108, 14, '#fff', 'center', true);
      }
    } else if (st === STATION_TRASH) {
      ctx.fillStyle = '#5a5f6a';
      rr(ctx, s.x + 22, s.y + 24, 66, 76, 8); ctx.fill();
      ctx.fillStyle = '#3a3e46';
      rr(ctx, s.x + 16, s.y + 16, 78, 14, 6); ctx.fill();
      ctx.fillStyle = '#8a8f9a';
      ctx.fillRect(s.x + 44, s.y + 8, 22, 10);
    }
    // Label at the top inside the station (bottom holds the progress bar).
    text(s.label, s.x + s.w / 2, s.y + 18, 15, '#fff8e6', 'center', true);
    // Progress ring/bar when busy.
    if (busy) {
      const frac = state.station.progress / state.station.total;
      if (state.station.burnt) {
        bar(s.x + 8, s.y + s.h - 26, s.w - 16, 10, 1, '#c0392b');
        ctx.fillStyle = '#c0392b';
        rr(ctx, s.x + 24, s.y - 26, s.w - 48, 22, 8); ctx.fill();
        text('🔥 GOSONG! BUANG', s.x + s.w / 2, s.y - 10, 12, '#fff', 'center', true);
      } else {
        bar(s.x + 8, s.y + s.h - 26, s.w - 16, 10, frac, done ? '#4e9b47' : '#f2c94c');
        if (done) {
          const pulse = 0.7 + Math.sin(t * 6) * 0.3;
          ctx.fillStyle = `rgba(78,155,71,${pulse.toFixed(2)})`;
          rr(ctx, s.x + 40, s.y - 26, s.w - 80, 22, 8); ctx.fill();
          text('✓ AMBIL!', s.x + s.w / 2, s.y - 10, 14, '#fff', 'center', true);
        }
      }
    }
  }

  function drawChef(state, t) {
    const x = state.chefX;
    const y = 470;
    ctx.save();
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y + 86, 46, 8, 0, 0, Math.PI * 2); ctx.fill();
    // White chef coat: shaded, with collar, buttons, and a red apron on straps.
    const cg = ctx.createLinearGradient(x, y, x, y + 84);
    cg.addColorStop(0, '#fdfaf2'); cg.addColorStop(1, '#cfc8b8');
    ctx.fillStyle = cg;
    rr(ctx, x - 34, y, 68, 84, 16); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - 12, y + 2); ctx.lineTo(x, y + 16); ctx.lineTo(x - 2, y + 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 12, y + 2); ctx.lineTo(x, y + 16); ctx.lineTo(x + 2, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3d2a18';
    for (const by of [26, 44, 62]) { ctx.beginPath(); ctx.arc(x, y + by, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 30, y + 4, 8, 30);
    ctx.fillRect(x + 22, y + 4, 8, 30);
    ctx.fillRect(x - 34, y + 32, 68, 52);
    ctx.fillStyle = '#a93226';
    ctx.fillRect(x - 34, y + 32, 68, 6);
    ctx.fillStyle = '#e8b07e';
    rr(ctx, x - 14, y + 56, 28, 16, 3); ctx.fill();
    ctx.strokeStyle = '#a93226'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 14, y + 56, 28, 16);
    // Arms: white sleeves reaching to the counter, skin hands.
    ctx.strokeStyle = '#f2ede2'; ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 28, y + 22); ctx.lineTo(x - 52, y + 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 28, y + 22); ctx.lineTo(x + 52, y + 52); ctx.stroke();
    ctx.fillStyle = '#e8b07e';
    ctx.beginPath(); ctx.arc(x - 54, y + 54, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 54, y + 54, 8, 0, Math.PI * 2); ctx.fill();
    // Head + proper pleated chef toque (cloth, not a cloud): band + crown
    // with vertical fold lines and lobe shading.
    drawFace(ctx, x, y - 22, 26, 0, 0, t);
    // Moustache above the smile.
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath(); ctx.ellipse(x - 7, y - 12, 9, 3.5, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 7, y - 12, 9, 3.5, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 13, y - 64, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 70, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 13, y - 64, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x + 12, y - 62, 8, 12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 76); ctx.quadraticCurveTo(x - 8, y - 62, x - 6, y - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6, y - 76); ctx.quadraticCurveTo(x + 8, y - 62, x + 6, y - 50); ctx.stroke();
    ctx.fillStyle = '#fdfaf2';
    ctx.fillRect(x - 27, y - 52, 54, 10);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 27, y - 47, 54, 4);
    // Hand item.
    if (state.hand) {
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(x + 56, y + 56, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c98a3d'; ctx.lineWidth = 2; ctx.stroke();
      drawItem(ctx, state.hand, x + 56, y + 56, 20, t);
    }
    ctx.restore();
  }

  function drawIngredients(state, t) {
    const b = ING_BIN;
    text('🧺 BAHAN DI MEJA — klik untuk ambil  •  13 bahan, 12 menu', b.x, b.y - 8, 16, '#fff8e6', 'left', true);
    INGREDIENTS.forEach((ing, i) => {
      const x = b.x + i * (b.w + b.gap);
      const y = b.y;
      const held = state.hand === ing.id;
      grain(ctx, x, y, b.w, b.h, held ? '#ffe9a8' : '#8a5a2e', '#4a2f18');
      ctx.strokeStyle = held ? '#f2c94c' : '#3d2a18'; ctx.lineWidth = held ? 4 : 2;
      ctx.strokeRect(x, y, b.w, b.h);
      // Bowl / tray (food sits 4 px higher so the bigger r27 drawing
      // never clips the bin label below it).
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath(); ctx.ellipse(x + b.w / 2, y + 48, b.w * 0.38, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9bfa8';
      ctx.beginPath(); ctx.ellipse(x + b.w / 2, y + 46, b.w * 0.34, 12, 0, 0, Math.PI * 2); ctx.fill();
      drawItem(ctx, ing.id, x + b.w / 2, y + 40, 27, t);
      // Held bin is light yellow (#ffe9a8): white label text is invisible
      // on it, so the held label is drawn dark.
      text(ing.label, x + b.w / 2, y + 84, 13, held ? '#2b1d12' : '#fff8e6', 'center', true);
      text(KEY_LABELS[i], x + 8, y + 18, 12, '#f2c94c', 'left', true);
      if (held) text('✓ DI TANGAN', x + b.w / 2, y + 102, 10, '#c0392b', 'center', true);
    });
  }

  function drawFloaters(state) {
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.min(1, f.life);
      text(f.text, f.x, f.y - (1.4 - f.life) * 30, 22, f.color, 'center', true);
      ctx.globalAlpha = 1;
    }
  }

  function drawLevelBanner(state) {
    if (!state.levelBanner || state.levelBanner <= 0) return;
    const sub = state.level === 2
      ? 'Menu baru dibuka: Soto Ayam • Gado-Gado • Es Jeruk • Nasi Uduk'
      : 'Semua 12 menu buka • Pelanggan VIP datang • Awas, masakan bisa gosong!';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 180, FIELD.width, 100);
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(0, 180, FIELD.width, 4);
    ctx.fillRect(0, 276, FIELD.width, 4);
    text(`LEVEL ${state.level} — ${state.levelName}`, FIELD.width / 2, 228, 36, '#f2c94c', 'center', true);
    text(sub, FIELD.width / 2, 262, 17, '#fff8e6', 'center');
  }

  // Cinematic grade (revisi 12:21 WIB — screenshot lebih realis): warm
  // golden-hour light, depth, fire glow, extra steam, vignette. Called
  // after the scene is drawn but BEFORE title/game-over panels, so the
  // panels stay crisp. All values are deterministic for a given t (shot
  // mode paints at fixed t = 0.6); live play flickers gently with t.
  function cinematicGrade(state, screen, t) {
    ctx.save();
    // 1. Warm golden-hour wash: amber from above, deep warm shade below.
    let wash = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    wash.addColorStop(0, 'rgba(255,170,80,0.17)');
    wash.addColorStop(0.45, 'rgba(255,170,80,0.05)');
    wash.addColorStop(1, 'rgba(30,16,8,0.12)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // 2. Depth: the far wall sits slightly darker/desaturated so the
    // foreground (food, people, counter) pops forward.
    ctx.fillStyle = 'rgba(24,12,28,0.10)';
    ctx.fillRect(0, 64, FIELD.width, 196);
    // 3. Additive light: lamp pools, sun glow, fire glow (lighter blend).
    ctx.globalCompositeOperation = 'lighter';
    for (const lx of [180, 1120]) {
      const pool = ctx.createRadialGradient(lx, 60, 4, lx, 60, 170);
      pool.addColorStop(0, 'rgba(255,205,110,0.28)');
      pool.addColorStop(1, 'rgba(255,205,110,0)');
      ctx.fillStyle = pool;
      ctx.beginPath(); ctx.arc(lx, 60, 150, 0, Math.PI * 2); ctx.fill();
      // Cone of lamplight falling to the counter.
      const cone = ctx.createLinearGradient(0, 58, 0, 300);
      cone.addColorStop(0, 'rgba(255,205,110,0.10)');
      cone.addColorStop(1, 'rgba(255,205,110,0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lx - 14, 58); ctx.lineTo(lx + 14, 58);
      ctx.lineTo(lx + 60, 300); ctx.lineTo(lx - 60, 300);
      ctx.closePath(); ctx.fill();
    }
    // Sun glow in the window.
    const sun = ctx.createRadialGradient(690, 62, 4, 690, 62, 110);
    sun.addColorStop(0, 'rgba(255,240,190,0.45)');
    sun.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = sun;
    ctx.beginPath(); ctx.arc(690, 62, 90, 0, Math.PI * 2); ctx.fill();
    // Fire glow: wok flames + grill embers, gently pulsing.
    const flick = 0.75 + Math.sin(t * 6) * 0.12 + Math.sin(t * 11) * 0.06;
    const wokGlow = ctx.createRadialGradient(620, 380, 6, 620, 380, 170);
    wokGlow.addColorStop(0, `rgba(255,140,40,${(0.38 * flick).toFixed(3)})`);
    wokGlow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = wokGlow;
    ctx.beginPath(); ctx.arc(620, 380, 170, 0, Math.PI * 2); ctx.fill();
    const grillGlow = ctx.createRadialGradient(820, 380, 6, 820, 380, 130);
    grillGlow.addColorStop(0, `rgba(255,110,30,${(0.28 * flick).toFixed(3)})`);
    grillGlow.addColorStop(1, 'rgba(255,110,30,0)');
    ctx.fillStyle = grillGlow;
    ctx.beginPath(); ctx.arc(820, 380, 120, 0, Math.PI * 2); ctx.fill();
    // Warm bounce light on the counter front + golden strip along the
    // counter top edge, as if the low sun / lamps rake across the wood.
    const bounce = ctx.createLinearGradient(0, 436, 0, 480);
    bounce.addColorStop(0, 'rgba(255,180,90,0.10)');
    bounce.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = bounce;
    ctx.fillRect(320, 436, 944, 44);
    const strip = ctx.createLinearGradient(320, 0, 1264, 0);
    strip.addColorStop(0, 'rgba(255,190,100,0.02)');
    strip.addColorStop(0.5, 'rgba(255,190,100,0.12)');
    strip.addColorStop(1, 'rgba(255,190,100,0.02)');
    ctx.fillStyle = strip;
    ctx.fillRect(320, 268, 944, 12);
    ctx.restore();
    // Warm halo behind the modal panels (title / game-over): the panel
    // overlay darkens the scene, so the halo keeps the frame glowing
    // instead of flat black around the panel edges.
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      const halo = ctx.createRadialGradient(640, 360, 60, 640, 360, 480);
      halo.addColorStop(0, 'rgba(255,180,90,0.12)');
      halo.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    // 4. Extra steam catching the light — only over stations that are
    // actually cooking / plated, so a staged shot never lies about the
    // game state. (steam() draws pale ellipses; phases fixed = stable.)
    if (screen === SCREEN_PLAY) {
      if (state.station.kind === 'wok') {
        steam(ctx, 595, 330, t, 0.05, 1.6);
        steam(ctx, 640, 330, t, 0.55, 1.6);
        steam(ctx, 620, 320, t, 0.85, 1.4);
      }
      if (state.station.kind === 'grill') steam(ctx, 820, 340, t, 0.3, 1.4);
      if (state.plate.length > 0) steam(ctx, 1020, 330, t, 0.75, 1.3);
      if (state.plateReady) steam(ctx, 1020, 330, t, 0.4, 1.5);
    } else if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      steam(ctx, 620, 330, t, 0.2, 1.3);
    }
    // 5. Vignette: dark warm corners, centre untouched so HUD/text stay
    // legible even at 300 px thumbnail.
    ctx.save();
    const vig = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.42,
      FIELD.width / 2, FIELD.height / 2, FIELD.width * 0.72);
    vig.addColorStop(0, 'rgba(20,10,5,0)');
    vig.addColorStop(1, 'rgba(20,10,5,0.24)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.restore();
  }

  function drawPanel(title, lines, prompt, accent) {
    const w = 640;
    const h = 150 + lines.length * 34;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    // Warm dark overlay (not neutral black) so modal screens keep the
    // golden-hour mood instead of going flat grey.
    ctx.fillStyle = 'rgba(26,14,6,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = accent || '#c0392b'; ctx.lineWidth = 4;
    rr(ctx, x, y, w, h, 14); ctx.stroke();
    text(title, FIELD.width / 2, y + 62, 44, '#2b1d12', 'center', true);
    lines.forEach((line, i) => text(line, FIELD.width / 2, y + 108 + i * 34, 21, '#5a4632', 'center'));
    text(prompt, FIELD.width / 2, y + h - 28, 22, '#c0392b', 'center', true);
  }

  function draw(state, screen, best, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawWall(t, state);
    // Floor.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 560, FIELD.width, 160);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < FIELD.width; x += 80) ctx.fillRect(x, 560, 2, 160);
    // Counter top band behind stations.
    grain(ctx, 320, 268, 944, 168, PALETTE.counter, '#6b4423');
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(320, 268, 944, 14);
    gloss(ctx, 320, 268, 944, 14);
    drawHud(state, t);
    drawOrders(state, state.plateReady ? state.orders.find((o) => o.dish === state.plateReady)?.id : null);
    drawCustomers(state, t);
    drawStationBase(STATION_CHOP, t, state);
    drawStationBase(STATION_WOK, t, state);
    drawStationBase(STATION_GRILL, t, state);
    drawStationBase(STATION_PLATE, t, state);
    drawStationBase(STATION_TRASH, t, state);
    // Plate slots readout under the plate station.
    text('Piring: ' + (state.plate.length === 0 ? 'kosong' : state.plate.map((p) => ITEM_LABEL[p]).join(' + ')), 930, 470, 14, '#fff8e6', 'left');
    drawChef(state, t);
    drawIngredients(state, t);
    drawFloaters(state);
    drawLevelBanner(state);
    // Cinematic grade over the scene (not the modal panels below).
    cinematicGrade(state, screen, t);
    // Hand badge.
    if (state.hand) {
      ctx.fillStyle = '#2b1d12';
      rr(ctx, 560, 560, 160, 28, 10); ctx.fill();
      text('Di tangan: ' + ITEM_LABEL[state.hand], 640, 580, 16, '#ffe9a8', 'center', true);
    }
    // Hint bar.
    text('Klik bahan → klik stasiun (C potong, W goreng, G panggang, P piring) → sajikan ke order • 1-9, 0, Q, E, R bahan • Esc jeda • M bisu', 640, 712, 13, 'rgba(255,248,230,0.75)', 'center');

    if (screen === SCREEN_TITLE) {
      drawPanel('🍜 DAPUR NUSANTARA RUSH', [
        'Warung Borneo: 12 menu Nusantara, 3 level!',
        'Buka Warung → Jam Makan Siang → Rush Hour.',
        'Ambil bahan, potong / goreng / panggang,',
        'rakit di piring, sajikan sebelum pelanggan kabur.',
        'Di Rush Hour masakan bisa gosong — VIP kasih tip besar!',
        `Skor terbaik: ${best.toLocaleString('id-ID')}   •   Shift 3 menit, 3 nyawa`,
      ], 'Klik atau tekan Spasi untuk mulai', '#c0392b');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('⏸ JEDA', ['Wajan menunggu. Pelanggan juga menunggu.', ''], 'Tekan Esc / Spasi untuk lanjut', '#4a7ab8');
    } else if (screen === SCREEN_OVER) {
      const won = state.timeLeft <= 0 && state.hearts > 0;
      const newServed = (state.servedDishes || []).filter((d) => !['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh'].includes(d));
      const newNames = newServed.length > 0
        ? newServed.map((d) => DISH_BY_ID[d]?.name ?? d).join(', ')
        : '— belum ada —';
      drawPanel(won ? '🎉 SHIFT SELESAI!' : '😞 WARUNG TUTUP', [
        state.overReason,
        `Hidangan disajikan: ${state.served}   •   Kombo terbaik: x${state.bestCombo}`,
        `Skor: ${state.score.toLocaleString('id-ID')}   •   Koin: Rp${state.coins.toLocaleString('id-ID')}   •   Terbaik: ${Math.max(best, state.score).toLocaleString('id-ID')}`,
        `Level tercapai: ${state.levelReached || 1} (${(LEVELS[(state.levelReached || 1) - 1] || LEVELS[0]).name})   •   VIP: ${state.vipServed || 0}   •   Gosong: ${state.burnt || 0}`,
        `Menu baru disajikan: ${newNames}`,
      ], 'Klik atau tekan Spasi untuk main lagi', won ? '#4e9b47' : '#c0392b');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
