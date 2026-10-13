// Feestje aan het einde: stuiterende kaarten die een spoor achterlaten, zoals bij het oude Patience, en de
// winnaars die als poppetje uit het bord springen.
import { LABEL, SUIT } from "./cards.js";
import { $, esc, reducedMotion } from "./dom.js";
import { puppetBodySvg } from "./faces.js";
import { devParam } from "./validate.js";

let celebrating = false;
/** Loopt er nu een eindanimatie (dan wacht de uitslag)? */
export const isCelebrating = () => celebrating;

/** Tekent één kaart op een eigen klein canvas, zodat hij snel steeds opnieuw getekend kan worden. */
function cardSprite(code, w, dpr) {
  const h = Math.round(w * 1.42);
  const c = document.createElement("canvas");
  c.width = w * dpr;
  c.height = h * dpr;
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  const color = suit === 2 || suit === 4 ? "#D93636" : "#1E2430";
  const sym = SUIT[suit].replace("\uFE0E", "");
  const label = LABEL[rank] ?? String(rank);
  const rad = w * 0.12;
  g.beginPath();
  if (g.roundRect) g.roundRect(0.5, 0.5, w - 1, h - 1, rad);
  else g.rect(0.5, 0.5, w - 1, h - 1);
  g.fillStyle = "#FFFFFF";
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.25)";
  g.stroke();
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const font = (px) => `700 ${px}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  g.font = font(w * 0.26);
  g.fillText(label, w * 0.2, h * 0.14);
  g.font = font(w * 0.2);
  g.fillText(sym, w * 0.2, h * 0.3);
  g.font = font(rank >= 11 && rank <= 13 ? w * 0.5 : w * 0.56);
  g.fillText(rank >= 11 && rank <= 13 ? label : sym, w / 2, h * 0.56);
  return c;
}

/** De winnaar(s) springen als poppetje uit het speelbord en juichen. */
const WINNER_MODES = ["juichen", "lopen", "dansen", "salto"];

/**
 * [winners]: wie er gewonnen hebben, elk { name, me (ben jij het?), face (computerspeler of null), head (HTML) }.
 */
function winnerStage(winners, mode = null) {
  if (!winners?.length) return null;
  const felt = $("#table").getBoundingClientRect();
  const stage = document.createElement("div");
  // Elke keer een verrassing: juichen, over het bord lopen, dansen of een salto
  const act = WINNER_MODES.includes(mode) ? mode : WINNER_MODES[Math.floor(Math.random() * WINNER_MODES.length)];
  stage.className = `winner-stage mode-${act}`;
  const pw = Math.max(64, Math.min(130, (window.innerWidth * 0.3) / winners.length, felt.height * 0.32));
  stage.style.setProperty("--pw", `${pw}px`);
  stage.style.setProperty("--n", String(winners.length));
  stage.style.setProperty("--walk", `${Math.max(0, felt.width / 2 - (pw * winners.length) / 2 - 6)}px`);
  stage.style.left = `${felt.left + felt.width / 2}px`;
  stage.style.top = `${felt.top + felt.height * 0.8}px`;
  const title = winners.length === 1
    ? (winners[0].me ? "Jij wint!" : `${esc(winners[0].name)} wint!`)
    : `${winners.map((w) => (w.me ? "Jij" : esc(w.name))).join(", ").replace(/, ([^,]*)$/, " en $1")} winnen!`;
  const slices = Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join("");
  stage.innerHTML = `<div class="winner-banner">${title}</div><div class="nl-waving" aria-hidden="true"><span class="pole"></span><span class="cloth">${slices}</span></div><div class="puppets">${winners.map(({ face, head }, i) => {
    return `<div class="puppet" style="--d:${i * 0.15}s"><div class="pup-inner">
      <div class="avatar happy pup-head" data-who="${face ?? "mens"}">${head}</div>${puppetBodySvg(face ?? "mens")}</div></div>`;
  }).join("")}</div>`;
  document.body.appendChild(stage);
  return stage;
}

/** De eindanimaties met hun kans; de tienen die op en neer gaan komen het vaakst. */
const CELEBRATIONS = [["tien", 4], ["stuiter", 2], ["sneeuw", 2], ["weg", 2], ["vliegtuig", 2]];

function pickCelebration() {
  const forced = devParam("anim");
  if (CELEBRATIONS.some(([k]) => k === forced)) return forced;
  let r = Math.random() * CELEBRATIONS.reduce((n, [, w]) => n + w, 0);
  for (const [kind, weight] of CELEBRATIONS) if ((r -= weight) < 0) return kind;
  return "tien";
}

/**
 * Speelt een eindanimatie af (elke keer een andere), met de winnaars als poppetjes; tikken slaat hem over.
 * [mode] en [kind] kiezen een vaste animatie (voor tests); anders is het elke keer een verrassing.
 */
export function celebrate(winners, mode = null, kind = pickCelebration()) {
  if (celebrating || reducedMotion) return Promise.resolve();
  celebrating = true;
  return new Promise((resolve) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const canvas = document.createElement("canvas");
    canvas.className = "celebrate";
    canvas.dataset.kind = kind;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    document.body.appendChild(canvas);
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    const w = Math.round(Math.max(46, Math.min(90, W / 8)));
    const h = Math.round(w * 1.42);
    const sprites = new Map();
    const sprite = (code) => {
      if (!sprites.has(code)) sprites.set(code, cardSprite(code, w, dpr));
      return sprites.get(code);
    };
    const deck = [];
    for (let rank = 14; rank >= 2; rank--) for (let suit = 1; suit <= 4; suit++) deck.push(suit * 100 + rank);
    const randomCard = () => deck[Math.floor(Math.random() * deck.length)];
    let done = false;
    let started = performance.now();

    const stage = winnerStage(winners, mode);
    const finish = () => {
      if (done) return;
      done = true;
      canvas.classList.add("out");
      stage?.classList.add("out");
      setTimeout(() => { canvas.remove(); stage?.remove(); celebrating = false; resolve(); }, 450);
    };
    canvas.addEventListener("pointerdown", finish);
    stage?.addEventListener("pointerdown", finish);

    /** Tekent een kaart gedraaid rond zijn midden; sx < 1 knijpt hem smal (omdraaien). */
    const drawCard = (img, x, y, angle = 0, scale = 1, sx = 1) => {
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      g.scale(scale * sx, scale);
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.restore();
    };

    const kinds = {
      // Vier stapels bovenaan, zoals de azen bij Patience; de kaarten stuiteren en laten een spoor na
      stuiter() {
        const piles = [0, 1, 2, 3].map((i) => (W - w) * (0.14 + 0.24 * i));
        const active = [];
        const gravity = H / 1400;
        let launched = 0;
        let last = 0;
        return (now) => {
          if (launched < deck.length && now - last > 260 && active.length < 6) {
            const pile = launched % 4;
            const dir = piles[pile] + w / 2 < W / 2 ? 1 : -1;
            const speed = W / 260 + Math.random() * W / 160;
            active.push({
              img: sprite(deck[launched]), x: piles[pile], y: H * 0.08,
              vx: (Math.random() < 0.8 ? dir : -dir) * speed, vy: -Math.random() * H / 120,
            });
            launched++;
            last = now;
          }
          for (let i = active.length - 1; i >= 0; i--) {
            const c = active[i];
            c.vy += gravity;
            c.x += c.vx;
            c.y += c.vy;
            if (c.y + h > H) { c.y = H - h; c.vy = -c.vy * 0.82; }
            g.drawImage(c.img, c.x, c.y, w, h);
            if (c.x < -w || c.x > W) active.splice(i, 1);
          }
          return launched >= deck.length && active.length === 0;
        };
      },

      // Kaarten dwarrelen als sneeuwvlokken naar beneden, heen en weer wiegend
      sneeuw() {
        const flakes = Array.from({ length: 34 }, (_, i) => ({
          img: sprite(randomCard()), x: Math.random() * W, delay: i * 110 + Math.random() * 300,
          speed: H / (3000 + Math.random() * 1800), sway: 20 + Math.random() * 50,
          phase: Math.random() * 6.3, spin: (Math.random() - 0.5) * 0.002, scale: 0.45 + Math.random() * 0.45,
        }));
        return (now, t) => {
          g.clearRect(0, 0, W, H);
          let falling = 0;
          for (const f of flakes) {
            const age = t - f.delay;
            if (age < 0) { falling++; continue; }
            const y = -h + age * f.speed;
            if (y > H + h) continue;
            falling++;
            const x = f.x + Math.sin(age / 700 + f.phase) * f.sway;
            drawCard(f.img, x, y, Math.sin(age / 900 + f.phase) * 0.6 + age * f.spin, f.scale, Math.cos(age / 600 + f.phase));
          }
          return falling === 0;
        };
      },

      // Een stapel in het midden; de kaarten vliegen draaiend alle kanten op uit beeld
      weg() {
        const cards = deck.map((code, i) => {
          const a = Math.random() * Math.PI * 2;
          const v = Math.hypot(W, H) / (900 + Math.random() * 700);
          return { img: sprite(code), delay: 600 + i * 55, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            spin: (Math.random() - 0.5) * 0.02, jitter: (Math.random() - 0.5) * 0.3 };
        });
        return (now, t) => {
          g.clearRect(0, 0, W, H);
          let left = 0;
          for (let i = cards.length - 1; i >= 0; i--) {
            const c = cards[i];
            const age = Math.max(0, t - c.delay);
            const x = W / 2 + c.vx * age;
            const y = H / 2 + c.vy * age;
            const scale = 1 + age / 900;
            if (x < -w * 3 || x > W + w * 3 || y < -h * 3 || y > H + h * 3) continue;
            left++;
            drawCard(c.img, x, y - (age ? 0 : i * 0.4), c.jitter + c.spin * age, scale);
          }
          return left === 0;
        };
      },

      // Kaarten vouwen zich op tot papieren vliegtuigjes die rondjes vliegen
      vliegtuig() {
        const colors = ["#FFFFFF", "#FFE7A3", "#CFE8FF", "#FFD1D1", "#D7F5D0"];
        const planes = Array.from({ length: 7 }, (_, i) => {
          const code = randomCard();
          return { img: sprite(code), red: [2, 4].includes(Math.floor(code / 100)),
            hx: W * (0.12 + 0.76 * (i / 6)), hy: H * (0.3 + 0.3 * Math.random()),
            cx: W * (0.2 + 0.6 * (i / 6)), cy: H * (0.3 + 0.35 * Math.random()),
            r: Math.min(W, H) * (0.12 + 0.2 * Math.random()), dir: Math.random() < 0.5 ? 1 : -1,
            phase: Math.random() * 6.3, color: colors[i % colors.length], delay: i * 120 };
        });
        const pw = w * 0.9;
        const drawPlane = (p, x, y, angle, fold) => {
          g.save();
          g.translate(x, y);
          g.rotate(angle);
          g.scale(1, 1 - 0.35 * fold);
          // Romp: twee vleugels en de vouw in het midden
          g.beginPath();
          g.moveTo(pw * 0.55, 0);
          g.lineTo(-pw * 0.45, -pw * 0.38);
          g.lineTo(-pw * 0.3, 0);
          g.lineTo(-pw * 0.45, pw * 0.38);
          g.closePath();
          g.fillStyle = p.color;
          g.fill();
          g.strokeStyle = "rgba(0,0,0,.3)";
          g.lineWidth = 1;
          g.stroke();
          g.beginPath();
          g.moveTo(pw * 0.55, 0);
          g.lineTo(-pw * 0.3, 0);
          g.lineTo(-pw * 0.42, pw * 0.08);
          g.closePath();
          g.fillStyle = "rgba(0,0,0,.15)";
          g.fill();
          g.fillStyle = p.red ? "#D93636" : "#1E2430";
          g.beginPath();
          g.arc(-pw * 0.12, -pw * 0.14, pw * 0.05, 0, Math.PI * 2);
          g.fill();
          g.restore();
        };
        const FOLD = 1100;
        const FLY = 6200;
        return (now, t) => {
          g.clearRect(0, 0, W, H);
          let flying = 0;
          for (const p of planes) {
            const age = t - p.delay;
            if (age < 0) { flying++; continue; }
            if (age < FOLD) {
              // Eerst de kaart, die dichtvouwt: smaller en platter, en dan het vliegtuigje
              flying++;
              const k = age / FOLD;
              if (k < 0.55) drawCard(p.img, p.hx, p.hy, 0, 1 - k * 0.4, 1 - k / 0.55 * 0.85);
              else drawPlane(p, p.hx, p.hy, -Math.PI / 2, 1 - (k - 0.55) / 0.45);
              continue;
            }
            const f = age - FOLD;
            const a = p.phase + p.dir * f / 900;
            // Rondjes rond een eigen middelpunt; na afloop vliegt hij weg naar boven
            const out = Math.max(0, f - FLY);
            const x = p.cx + Math.cos(a) * p.r + (p.hx - p.cx) * Math.max(0, 1 - f / 600);
            const y = p.cy + Math.sin(a) * p.r * 0.6 - out * H / 1200 + (p.hy - p.cy) * Math.max(0, 1 - f / 600);
            if (y < -pw * 2) continue;
            flying++;
            const angle = out > 0 ? -Math.PI / 2 : a + p.dir * Math.PI / 2;
            drawPlane(p, x, y, angle, 0);
          }
          return flying === 0;
        };
      },

      // Alle kaarten draaien om tot een tien en gaan in een golf op en neer
      tien() {
        const cols = Math.max(4, Math.min(9, Math.floor(W / (w * 1.25))));
        const rows = Math.max(2, Math.min(4, Math.floor((H * 0.75) / (h * 1.2))));
        const gapX = W / cols;
        const gapY = (H * 0.8) / rows;
        const cards = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const suit = 1 + ((r + c) % 4);
            cards.push({ from: sprite(randomCard()), ten: sprite(suit * 100 + 10),
              x: gapX * (c + 0.5), y: H * 0.12 + gapY * (r + 0.5), wave: c * 0.55 + r * 0.3,
              flip: 400 + (c + r) * 90 });
          }
        }
        const END = 7600;
        return (now, t) => {
          g.clearRect(0, 0, W, H);
          for (const c of cards) {
            const appear = Math.min(1, t / 350);
            const k = Math.min(1, Math.max(0, (t - c.flip) / 500));
            const img = k < 0.5 ? c.from : c.ten;
            const sx = Math.abs(Math.cos(k * Math.PI));
            // Op en neer: na het omdraaien springen de tienen in een golf
            const bounce = k >= 1 ? Math.abs(Math.sin((t - c.flip - 500) / 330 - c.wave)) * gapY * 0.35 : 0;
            const leave = Math.max(0, t - END + 900) / 900;
            const y = c.y - bounce + leave * leave * H;
            drawCard(img, c.x, y, 0, 0.8 * appear, Math.max(0.02, sx));
          }
          return t > END;
        };
      },
    };

    const step = kinds[kind]();
    const frame = (now) => {
      if (done) return;
      if (step(now, now - started) || now - started > 11000) finish();
      else requestAnimationFrame(frame);
    };
    // De tafel blijft zichtbaar, de kaarten tekenen eroverheen
    requestAnimationFrame((now) => { started = now; frame(now); });
  });
}
