# Stemmen van ElevenLabs voor de computerspelers. Draait in GitHub Actions (stemmen.yml), want daar staat de
# sleutel (secret ELEVENLABS_API_KEY) en is ElevenLabs bereikbaar.
#   python3 tools/elevenlabs.py zoek <uitvoermap>   Nederlandse stemmen uit de bibliotheek per accent, met de
#                                                    gratis voorbeeldjes (kost geen credits)
#   python3 tools/elevenlabs.py ontwerp <uitvoermap> Stemmen laten ontwerpen voor accenten die de bibliotheek
#                                                    niet heeft (Gronings, Rotterdams, Twents) en een heel lage
#                                                    mannenstem; per omschrijving drie voorbeelden
import base64, json, os, re, sys, urllib.parse, urllib.request

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


if __name__ == "__main__":
    {"zoek": zoek, "ontwerp": ontwerp}[sys.argv[1]](sys.argv[2])
