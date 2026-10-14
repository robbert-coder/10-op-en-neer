# Stemmen van ElevenLabs voor de computerspelers. Draait in GitHub Actions (stemmen.yml), want daar staat de
# sleutel (secret ELEVENLABS_API_KEY) en is ElevenLabs bereikbaar.
#   python3 tools/elevenlabs.py zoek <uitvoermap>   Nederlandse stemmen uit de bibliotheek per accent, met de
#                                                    gratis voorbeeldjes (kost geen credits)
#   python3 tools/elevenlabs.py ontwerp <uitvoermap> Stemmen laten ontwerpen voor accenten die de bibliotheek
#                                                    niet heeft (Gronings, Rotterdams, Twents) en een heel lage
#                                                    mannenstem; per omschrijving drie voorbeelden
#   python3 tools/elevenlabs.py naam:<Naam> <map>    Eén stem op naam opzoeken, in de bibliotheek en in de
#                                                    eigen stemmen van het account
#   python3 tools/elevenlabs.py inspreken[:henk,kees] <map>  Alle voorspellingen en nat-zinnen (uit
#                                                    web/static/voices.js) inspreken met de stemmen in KEUZE
#   python3 tools/elevenlabs.py proef:<eigenaar>/<stem>/<Naam> <map>  Bibliotheekstem aan het account toevoegen en
#                                                    een paar spelzinnen laten inspreken (kost een paar honderd credits)
import base64, json, os, re, sys, urllib.error, urllib.parse, urllib.request

API = "https://api.elevenlabs.io/v1"
KEY = os.environ.get("ELEVENLABS_API_KEY", "")


def get(path, **params):
    url = f"{API}{path}?{urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})}"
    req = urllib.request.Request(url, headers={"xi-api-key": KEY, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


# Groepen waarin Robbert wil kiezen; een stem valt in de eerste groep waarvan een woord in naam,
# accent of beschrijving staat. Wat nergens bij past, is ABN (Nederlands zonder accent).
GROUPS = [
    ("Vlaams", ["vlaams", "flemish", "belg", "antwerp", "gent", "brussel"]),
    ("Gronings", ["grong", "groning", "gronings", "noord-ned", "northern dutch", "drent"]),
    ("Limburgs", ["limburg", "maastricht", "zachte g", "southern dutch", "brabant"]),
    ("Rotterdams", ["rotterdam", "010"]),
    ("Twents", ["twent", "tukker", "enschede", "achterhoek", "oost-ned", "eastern dutch"]),
    ("Amsterdams", ["amsterdam", "mokum"]),
]
DEEP = ["deep", "low", "bass", "diep", "lage", "laag", "zware", "raspy", "gravel", "rauw"]


def post(path, body):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


# (naam, omschrijving voor ElevenLabs, voorbeeldtekst in het accent). De tekst helpt het accent te horen.
DESIGNS = [
    ("Gronings man", "An older man from Groningen in the north of the Netherlands. Native Dutch speaker with a strong, "
     "broad Gronings regional accent. Warm, slow and dry-humoured, a bit gruff.",
     "Moi! Nou, dat wordt een mooi potje kaarten, heur. Ik zeg maar zo: vijf slagen, en dan zien we wel wat der van komt. "
     "Niks mis mit. Even rustig aan, wij hebben de tied."),
    ("Groningse vrouw", "A middle-aged woman from Groningen in the north of the Netherlands. Native Dutch speaker with a clear "
     "Gronings regional accent. Friendly, sober and down to earth.",
     "Moi allemaal! Ik zeg drie slagen, heur. En as het nait gaat, den gaat het nait. Kom op, schud die kaarten maar, "
     "wij hebben de hele middag."),
    ("Rotterdamse man", "A man in his forties from Rotterdam, the Netherlands. Native Dutch speaker with a strong Rotterdam "
     "accent, direct, loud and cheeky, working-class harbour vibe.",
     "Nou jongen, effe dimmen. Ik ga voor vier slagen en dan hebben we het erover gehad. Geen woorden maar daden, toch? "
     "Kom op, gooi die kaart d'r maar op."),
    ("Rotterdamse vrouw", "A woman in her fifties from Rotterdam, the Netherlands. Native Dutch speaker with a broad Rotterdam "
     "accent, outspoken, funny and warm.",
     "Ach schat, wat een kaarten heb ik nou weer. Ik zeg twee, en daar blijf ik bij. Niet zeuren, gewoon spelen, "
     "zo doen we dat hier in Rotterdam."),
    ("Twentse man", "An older man from Twente in the east of the Netherlands. Native Dutch speaker with a strong Twents "
     "regional accent, calm, modest and friendly, typical 'tukker'.",
     "Jao, dat wordt wat. Ik zeg mer drie slagen. Nich lullen mer poetsen, zeg wiej hier in Twente. "
     "Rustig an, dan komt het wal goed."),
    ("Twentse vrouw", "A middle-aged woman from Twente in the east of the Netherlands. Native Dutch speaker with a clear Twents "
     "regional accent, sober, kind and a little shy.",
     "Och, ik weet het nich hoor. Doe mer twee slagen. Het is mer een spelletje, nich dan? "
     "Wiej hebben in ieder geval gezellig."),
    ("Heel lage mannenstem", "A man in his sixties from the Netherlands with a very deep, low, resonant bass voice. "
     "Native Dutch speaker, standard accent, slow, calm and gravelly, like an old radio host.",
     "Zo. Ik zeg vier. Rustig aan, we hebben de hele avond. Schuif die kaarten maar naar mij toe, "
     "dan laat ik jullie eens zien hoe het moet."),
]


def ontwerp(out):
    os.makedirs(f"{out}/mp3", exist_ok=True)
    rows = []
    for i, (name, desc, text) in enumerate(DESIGNS):
        seed = 1000 + i  # zelfde seed en omschrijving geven later dezelfde stem terug
        try:
            data = post("/text-to-voice/design", {"voice_description": desc, "text": text, "model_id": "eleven_ttv_v3", "seed": seed})
        except Exception as e:  # noqa: BLE001
            print("ontwerpen mislukt", name, getattr(e, "read", lambda: b"")()[:300], e)
            continue
        for k, prev in enumerate(data.get("previews", [])[:3]):
            fn = f"mp3/ontwerp-{i}-{k}.mp3"
            open(f"{out}/{fn}", "wb").write(base64.b64decode(prev["audio_base_64"]))
            rows.append({"groep": name, "name": f"{name} {k + 1}", "description": desc, "seed": seed, "nr": k,
                         "generated_voice_id": prev.get("generated_voice_id"), "mp3": fn})
    json.dump(rows, open(f"{out}/ontwerp.json", "w"), ensure_ascii=False, indent=1)
    print(f"{len(rows)} ontworpen voorbeelden")


def group_of(v):
    text = " ".join(str(v.get(k) or "") for k in ("name", "accent", "description", "descriptive", "locale")).lower()
    for name, words in GROUPS:
        if any(w in text for w in words):
            return name
    return "ABN"


def zoek(out):
    os.makedirs(f"{out}/mp3", exist_ok=True)
    voices, seen = [], set()
    # Alle Nederlandstalige stemmen, en apart gezocht op de accenten (soms staat de taal er niet goed bij)
    queries = [dict(language="nl")] + [dict(search=w) for _, ws in GROUPS for w in ws[:2]]
    for q in queries:
        for page in range(10):
            try:
                data = get("/shared-voices", page_size=100, page=page, **q)
            except Exception as e:  # noqa: BLE001 - één mislukte zoekvraag mag de rest niet stoppen
                print("zoeken mislukt", q, e)
                break
            for v in data.get("voices", []):
                lang = (v.get("language") or "").lower()
                if v["voice_id"] in seen or (lang and lang not in ("nl", "dutch")) and "search" not in q:
                    continue
                if lang and lang not in ("nl", "dutch"):
                    continue
                seen.add(v["voice_id"])
                voices.append(v)
            if not data.get("has_more"):
                break
    for v in voices:
        v["groep"] = group_of(v)
        text = " ".join(str(v.get(k) or "") for k in ("name", "description", "descriptive")).lower()
        v["diep"] = v.get("gender") == "male" and any(w in text for w in DEEP)
    popular = lambda v: -(v.get("cloned_by_count") or v.get("usage_character_count_1y") or 0)
    picked = []
    for name in [g for g, _ in GROUPS] + ["ABN"]:
        for gender in ("male", "female"):
            picked += sorted([v for v in voices if v["groep"] == name and v.get("gender") == gender], key=popular)[:6]
    picked += sorted([v for v in voices if v["diep"] and v not in picked], key=popular)[:8]
    rows = []
    for v in picked:
        fn = f"mp3/{v['voice_id']}.mp3"
        try:
            urllib.request.urlretrieve(v["preview_url"], f"{out}/{fn}")
        except Exception as e:  # noqa: BLE001
            print("voorbeeld mislukt", v.get("name"), e)
            continue
        rows.append({k: v.get(k) for k in ("voice_id", "public_owner_id", "name", "gender", "age", "accent", "description",
                                          "descriptive", "use_case", "category", "groep", "diep", "cloned_by_count",
                                          "free_users_allowed", "notice_period")} | {"mp3": fn})
    json.dump(rows, open(f"{out}/stemmen.json", "w"), ensure_ascii=False, indent=1)
    print(f"{len(voices)} Nederlandse stemmen gevonden, {len(rows)} voorbeelden opgeslagen")
    for g in sorted({r["groep"] for r in rows}):
        print(g, sum(r["groep"] == g for r in rows))


def naam(out, wanted):
    os.makedirs(f"{out}/mp3", exist_ok=True)
    found = []
    for page in range(5):
        data = get("/shared-voices", page_size=100, page=page, search=wanted)
        found += [v | {"bron": "bibliotheek"} for v in data.get("voices", [])]
        if not data.get("has_more"):
            break
    try:
        found += [v | {"bron": "account", "voice_id": v["voice_id"]} for v in get("/voices").get("voices", [])
                  if wanted.lower() in (v.get("name") or "").lower()]
    except Exception as e:  # noqa: BLE001
        print("eigen stemmen ophalen mislukt", e)
    rows = []
    for v in found:
        fn = f"mp3/{v['voice_id']}.mp3"
        if v.get("preview_url"):
            try:
                urllib.request.urlretrieve(v["preview_url"], f"{out}/{fn}")
            except Exception as e:  # noqa: BLE001
                print("voorbeeld mislukt", v.get("name"), e)
                fn = None
        labels = v.get("labels") or {}
        rows.append({"bron": v["bron"], "voice_id": v["voice_id"], "public_owner_id": v.get("public_owner_id"),
                     "name": v.get("name"), "gender": v.get("gender") or labels.get("gender"),
                     "accent": v.get("accent") or labels.get("accent"), "language": v.get("language") or labels.get("language"),
                     "description": v.get("description"), "category": v.get("category"), "mp3": fn})
    json.dump(rows, open(f"{out}/naam.json", "w"), ensure_ascii=False, indent=1)
    print(f"{len(rows)} stemmen gevonden voor {wanted!r}")
    for r in rows:
        print(r["bron"], r["name"], r["voice_id"], r["language"], r["accent"])


PROEF = {
    "Vlaams": ["Allez, ik ga er twee halen, hè.", "Da's nu ne keer goed gespeeld, zenne!", "Amai, dat had ik nie verwacht."],
}


def tts(voice_id, text):
    req = urllib.request.Request(f"{API}/text-to-speech/{voice_id}?output_format=mp3_44100_128", method="POST",
                                 data=json.dumps({"text": text, "model_id": "eleven_multilingual_v2"}).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def account_voice(owner, voice, name):
    for v in get("/voices").get("voices", []):
        if v.get("name") == name or (v.get("sharing") or {}).get("original_voice_id") == voice:
            return v["voice_id"]
    try:
        return post(f"/voices/add/{owner}/{voice}", {"new_name": name})["voice_id"]
    except urllib.error.HTTPError as e:
        # Zonder recht voices_write: de bibliotheekstem rechtstreeks proberen
        print("toevoegen lukt niet:", e.code, e.read().decode(errors="replace")[:300])
        return voice


def proef(out, spec):
    owner, voice, name = spec.split("/", 2)
    os.makedirs(f"{out}/mp3", exist_ok=True)
    vid = account_voice(owner, voice, name)
    rows = []
    for group, lines in PROEF.items():
        for i, text in enumerate(lines):
            fn = f"mp3/proef-{name}-{group}-{i}.mp3"
            open(f"{out}/{fn}", "wb").write(tts(vid, text))
            rows.append({"name": name, "account_voice_id": vid, "groep": group, "text": text, "mp3": fn})
    json.dump(rows, open(f"{out}/proef.json", "w"), ensure_ascii=False, indent=1)
    print(f"{name}: {len(rows)} zinnen ingesproken (stem {vid})")


# Robbert koos deze stemmen op de luisterpagina (14 oktober 2026). Bibliotheekstemmen gaan rechtstreeks op
# voice_id; ontworpen stemmen worden eerst (één keer) als eigen stem in het account bewaard.
KEUZE = {
    "henk": {"ontwerp": "nxXBLGMUMfo1A7EdM35R", "naam": "Henk (heel lage mannenstem)", "omschrijving": DESIGNS[6][1]},
    "truus": {"ontwerp": "6BJ0RYaLcd17tZ1QUvZW", "naam": "Truus (Rotterdams)", "omschrijving": DESIGNS[3][1]},
    "kees": {"ontwerp": "J6NuhSPdcAhsoLgb8T3P", "naam": "Kees (Twents)", "omschrijving": DESIGNS[4][1]},
    "ria": {"stem": "D50w2srwVohKTPx9X6Th"},  # Evie (Vlaams)
    "bram": {"stem": "dLPO5AsXc3FZDbTh1IKa"},  # Ido (ABN)
    "gerda": {"ontwerp": "yT9L0gcO985AwRS9C0tf", "naam": "Gerda (Gronings)", "omschrijving": DESIGNS[1][1]},
    "sjef": {"stem": "5tiZStRJQ98Xw420MFFx"},  # Reinoud (Limburgs)
    "mo": {"stem": "MEdY7ytKGFW1Hy0uQq2T"},  # Jaimie (Amsterdams)
    "speler_man": {"stem": "60CwgZt94Yf7yYIXMDDe"},  # Peter
    "speler_vrouw": {"stem": "OlBRrVAItyi00MuGMbna"},  # Emma
}
# Ontworpen stemmen komen uit eleven_ttv_v3 en horen bij eleven_v3; bibliotheekstemmen bij multilingual v2
MODEL = {"ontwerp": "eleven_v3", "stem": "eleven_multilingual_v2"}


def js_object(src, name):
    m = re.search(r"export const " + name + r" = (\{.*?\n\});", src, re.S) or re.search(r"export const " + name + r" = (\{.*?\});", src, re.S)
    return json.loads(m.group(1))


def saved_voice(k):
    for v in get("/voices").get("voices", []):
        if v.get("name") == k["naam"]:
            return v["voice_id"]
    return post("/text-to-voice", {"voice_name": k["naam"], "voice_description": k["omschrijving"],
                                   "generated_voice_id": k["ontwerp"]})["voice_id"]


def speak(voice_id, model, text, path):
    import time
    body = {"text": text, "model_id": model, "language_code": "nl"}
    for attempt in range(6):
        req = urllib.request.Request(f"{API}/text-to-speech/{voice_id}?output_format=mp3_44100_128", method="POST",
                                     data=json.dumps(body).encode(),
                                     headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                open(path, "wb").write(r.read())
                return
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503) or attempt == 5:
                raise
            time.sleep(2 ** attempt)


def inspreken(out, only):
    import subprocess
    from concurrent.futures import ThreadPoolExecutor
    src = open(os.path.join(os.path.dirname(__file__), "..", "web", "static", "voices.js"), encoding="utf8").read()
    bid, wet = js_object(src, "BID_LINES"), js_object(src, "WET_LINES")
    os.makedirs(f"{out}/ruw", exist_ok=True)
    os.makedirs(f"{out}/mp3", exist_ok=True)
    who = [w for w in KEUZE if not only or w in only]
    ids, jobs = {}, []
    for w in who:
        k = KEUZE[w]
        ids[w] = (saved_voice(k), MODEL["ontwerp"]) if "ontwerp" in k else (k["stem"], MODEL["stem"])
        jobs += [(w, f"bod_{w}_{n}_{i}", t) for n, row in enumerate(bid[w]) for i, t in enumerate(row)]
        jobs += [(w, f"nat_{w}_{i}", t) for i, t in enumerate(wet.get(w, []))]
    print("stemmen:", ids, flush=True)
    print(len(jobs), "zinnen,", sum(len(t) for _, _, t in jobs), "tekens", flush=True)

    def one(job):
        w, name, text = job
        speak(*ids[w], text, f"{out}/ruw/{name}.mp3")
        # Stilte voor en achter weg, even hard als de rest, klein bestand (zoals de oude stemmen)
        f = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,"
             "areverse,loudnorm=I=-16:TP=-1.5")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{out}/ruw/{name}.mp3", "-af", f, "-ac", "1", "-ar", "22050",
                        "-c:a", "libmp3lame", "-q:a", "6", f"{out}/mp3/{name}.mp3"], check=True)
        d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{out}/mp3/{name}.mp3"],
                           capture_output=True, text=True).stdout
        return name, round(float(d) * 1000)

    with ThreadPoolExecutor(4) as pool:
        ms = dict(pool.map(one, jobs))
    res = {"bidMs": {w: [[ms[f"bod_{w}_{n}_{i}"] for i in range(len(row))] for n, row in enumerate(bid[w])] for w in who},
           "wetMs": {w: [ms[f"nat_{w}_{i}"] for i in range(len(wet[w]))] for w in who if w in wet},
           "stemmen": {w: {"voice_id": v, "model": m} for w, (v, m) in ids.items()}}
    json.dump(res, open(f"{out}/res.json", "w"), ensure_ascii=False)
    import shutil
    shutil.rmtree(f"{out}/ruw")
    print("klaar:", len(ms), "geluiden")


def main(stap, out):
    if stap.startswith("inspreken"):
        inspreken(out, stap[10:].split(",") if ":" in stap else None)
    elif stap.startswith("proef:"):
        proef(out, stap[6:])
    elif stap.startswith("naam:"):
        naam(out, stap[5:])
    else:
        {"zoek": zoek, "ontwerp": ontwerp}[stap](out)


if __name__ == "__main__":
    try:
        main(sys.argv[1], sys.argv[2])
    except urllib.error.HTTPError as e:
        # Als annotatie, zodat de reden ook zonder het volledige log te zien is
        print(f"::error::ElevenLabs {e.code} {e.url.split('?')[0]}: {e.read().decode(errors='replace')[:600]}")
        sys.exit(1)
