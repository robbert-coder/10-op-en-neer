// Een bug of idee melden vanuit het spel. De melding gaat naar de Supabase-database (supabase-meldingen.sql);
// wie de beheercode kent, leest ze op meldingen.html. Los van het scherm, zodat de controles te testen zijn.

/** Soorten meldingen. */
export const REPORT_KINDS = ["bug", "idee"];
/** Grenzen, gelijk aan die in supabase-meldingen.sql. */
export const REPORT_TEXT_MIN = 3;
export const REPORT_TEXT_MAX = 2000;
export const REPORT_SHOT_MAX = 900000;
const SHOT_PREFIX = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/;

/** Is dit een schermafbeelding die we veilig kunnen tonen en versturen (alleen een JPEG als data-URL)? */
export const isShot = (v) => typeof v === "string" && v.length <= REPORT_SHOT_MAX && SHOT_PREFIX.test(v);

/** Tekst zonder stuurtekens, ingekort. Regeleinden blijven, want een melding mag uit meer regels bestaan. */
function cleanLongText(v, max) {
  if (typeof v !== "string") return "";
  return v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f\u2028\u2029]/g, " ").trim().slice(0, max);
}

/**
 * Een melding controleren voordat hij verstuurd of getoond wordt: soort, tekst, versie, apparaat, naam en
 * eventueel een schermafbeelding. Geeft null als hij niet klopt (bijvoorbeeld een te korte tekst).
 * Nodig omdat meldingen van iedereen komen en later in een pagina worden getoond.
 */
export function cleanReport(r) {
  if (!r || typeof r !== "object") return null;
  const kind = REPORT_KINDS.includes(r.kind) ? r.kind : null;
  const text = cleanLongText(r.text, REPORT_TEXT_MAX);
  if (!kind || text.length < REPORT_TEXT_MIN) return null;
  return {
    kind,
    text,
    version: cleanLongText(r.version, 20).replace(/\n/g, " "),
    device: cleanLongText(r.device, 300).replace(/\n/g, " "),
    name: cleanLongText(r.name, 24).replace(/\n/g, " "),
    shot: isShot(r.shot) ? r.shot : null,
  };
}

/** Het html2canvas-script pas laden als iemand een melding met schermafbeelding maakt (het is groot). */
let loading = null;
function loadHtml2canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "vendor/html2canvas.min.js";
    s.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error("geen html2canvas")));
    s.onerror = () => { loading = null; reject(new Error("laden mislukt")); };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Een schermafbeelding van het spel als JPEG (data-URL), hoogstens 1200 pixels breed en klein genoeg om te
 * versturen. Geeft null als het niet lukt; de melding kan dan zonder.
 */
export async function captureScreen(el = document.getElementById("app")) {
  try {
    const h2c = await loadHtml2canvas();
    const scale = Math.min(1, 1200 / Math.max(1, el.clientWidth)) * Math.min(2, window.devicePixelRatio || 1);
    const canvas = await h2c(el, { backgroundColor: "#2A1B12", scale, logging: false, useCORS: true });
    return canvasToShot(canvas);
  } catch { /* zonder schermafbeelding */ }
  return null;
}

/** Een tekenvel als JPEG (data-URL), zo nodig met minder kwaliteit tot hij klein genoeg is; anders null. */
export function canvasToShot(canvas) {
  for (const quality of [0.7, 0.5, 0.35]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (isShot(url)) return url;
  }
  return null;
}

/**
 * Een plek op het scherm (vinger of muis) omrekenen naar pixels van de schermafbeelding, die kleiner getoond
 * wordt dan hij is. Nodig om op de juiste plek te tekenen als je iets aanwijst.
 */
export function toImagePoint(clientX, clientY, rect, width, height) {
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * width;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * height;
  return [Math.min(width, Math.max(0, x)), Math.min(height, Math.max(0, y))];
}

/** Een korte beschrijving van het apparaat, zodat een bug na te spelen is. */
export function deviceText(isApp) {
  const ua = navigator.userAgent.replace(/\s+/g, " ").slice(0, 200);
  return `${isApp ? "app" : "web"} · ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1} · ${ua}`;
}
