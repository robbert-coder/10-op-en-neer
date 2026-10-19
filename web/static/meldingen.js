// Beheerpagina: de ingestuurde bugs en ideeën lezen (alleen met de beheercode uit supabase-meldingen.sql).
import { fetchReports, markReport } from "./cloud.js";
import { cleanReport } from "./feedback.js";
import { esc } from "./dom.js";
import { locale, t } from "./i18n.js";

const CODE_KEY = "beheercode";
const root = document.getElementById("reports");
let code = "";
let reports = [];
let showDone = false;
let status = "";

/** De bewaarde beheercode (alleen op dit apparaat), zodat je hem niet elke keer hoeft te typen. */
function storedCode() {
  try { return localStorage.getItem(CODE_KEY) ?? ""; } catch { return ""; }
}
function storeCode(v) {
  try { if (v) localStorage.setItem(CODE_KEY, v); else localStorage.removeItem(CODE_KEY); } catch { /* privémodus */ }
}

/**
 * Een melding uit de database controleren voordat hij getoond wordt. Nodig omdat iedereen meldingen kan
 * insturen: tekst gaat altijd door esc(), en een schermafbeelding alleen als echte JPEG.
 */
function cleanStored(r) {
  const clean = cleanReport({ ...r, text: String(r?.text ?? "") });
  if (!clean) return null;
  const date = new Date(r.date);
  return { ...clean, id: Number(r.id) || 0, klaar: r.klaar === true, date: Number.isNaN(date.getTime()) ? null : date };
}

async function load() {
  status = t("Laden…");
  render();
  try {
    const data = await fetchReports(code);
    if (data === null) { status = t("Deze beheercode klopt niet."); code = ""; storeCode(""); reports = []; }
    else { reports = (Array.isArray(data) ? data : []).map(cleanStored).filter(Boolean); status = ""; storeCode(code); }
  } catch {
    status = t("De database is nu niet bereikbaar.");
  }
  render();
}

function render() {
  if (!code) {
    root.innerHTML = `<div class="dialog rp-login"><h3>${t("Meldingen")}</h3><p>${t("Vul je beheercode in.")}</p>
      <form id="rp-form"><input type="password" id="rp-code" autocomplete="current-password" maxlength="100">
      <button class="primary" type="submit">${t("Openen")}</button></form><p class="fb-status bad">${esc(status)}</p></div>`;
    document.getElementById("rp-form").addEventListener("submit", (e) => {
      e.preventDefault();
      code = document.getElementById("rp-code").value.trim();
      if (code) load();
    });
    return;
  }
  const list = reports.filter((r) => showDone || !r.klaar);
  const open = reports.filter((r) => !r.klaar).length;
  root.innerHTML = `<header class="rp-head"><h2>${t("Meldingen")}</h2>
      <span>${t("{n} open, {m} in totaal", { n: open, m: reports.length })}</span>
      <label class="fb-shot-row"><input type="checkbox" id="rp-done" ${showDone ? "checked" : ""}>${t("Ook afgehandelde")}</label>
      <button type="button" id="rp-reload">${t("Vernieuwen")}</button><button type="button" id="rp-logout">${t("Afmelden")}</button></header>
    <p class="fb-status">${esc(status)}</p>
    ${list.length === 0 ? `<p class="empty-note">${t("Geen meldingen.")}</p>` : list.map((r) => `
      <article class="rp-item ${r.klaar ? "done" : ""}">
        <div class="rp-meta"><b class="rp-num">#${r.id}</b><b class="rp-kind ${r.kind}">${r.kind === "bug" ? t("Bug") : t("Idee")}</b>
          <span>${r.date ? esc(r.date.toLocaleString(locale)) : ""}</span><span>${esc(r.name)}</span><span>v${esc(r.version)}</span>
          <button type="button" data-klaar="${r.id}" data-to="${r.klaar ? "0" : "1"}">${r.klaar ? t("Weer open") : t("Afgehandeld")}</button></div>
        <p class="rp-text">${esc(r.text)}</p>
        <small class="rp-device">${esc(r.device)}</small>
        ${r.shot ? `<img class="fb-preview rp-shot" alt="${t("Schermafbeelding")}" src="${r.shot}">` : ""}
      </article>`).join("")}`;
  document.getElementById("rp-done").addEventListener("change", (e) => { showDone = e.target.checked; render(); });
  document.getElementById("rp-reload").addEventListener("click", load);
  document.getElementById("rp-logout").addEventListener("click", () => { code = ""; storeCode(""); reports = []; status = ""; render(); });
}

root.addEventListener("click", async (e) => {
  // Een tik op de schermafbeelding maakt hem groot (en weer klein)
  const shot = e.target.closest(".rp-shot");
  if (shot) { shot.classList.toggle("big"); return; }
  const b = e.target.closest("[data-klaar]");
  if (!b) return;
  b.disabled = true;
  try {
    await markReport(code, Number(b.dataset.klaar), b.dataset.to === "1");
    await load();
  } catch {
    status = t("Opslaan lukt nu niet.");
    render();
  }
});

code = storedCode();
if (code) load(); else render();
