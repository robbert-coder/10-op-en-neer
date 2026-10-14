# Stemmen van ElevenLabs voor de computerspelers. Draait in GitHub Actions (stemmen.yml), want daar staat de
# sleutel (secret ELEVENLABS_API_KEY) en is ElevenLabs bereikbaar.
#   python3 tools/elevenlabs.py zoek <uitvoermap>   Nederlandse stemmen uit de bibliotheek per accent, met de
#                                                    gratis voorbeeldjes (kost geen credits)
import json, os, re, sys, urllib.parse, urllib.request

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
    {"zoek": zoek}[sys.argv[1]](sys.argv[2])
