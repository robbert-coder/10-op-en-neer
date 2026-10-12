# Maakt de uitgesproken voorspellingen en nat-opmerkingen van de computerspelers met Piper-stemmen (CC0).
# Gebruik: python3 tools/stemmen.py <map met vits-piper-modellen> <uitvoermap met wav/ en mp3/>
import json, sys, re, subprocess, sherpa_onnx, soundfile as sf
P, OUT = sys.argv[1], sys.argv[2]
W = ["nul","één","twee","drie","vier","vijf","zes","zeven","acht","negen","tien","elf","twaalf","dertien"]
cap = lambda t: (t[0].upper() + t[1:]).replace("Één", "Eén")
# Kort en zonder rijm; elke computerspeler zijn eigen toon. Variant 0 is alleen het getal.
BID = {
 "henk":  ["{N}.", "{N}, denk ik.", "Doe maar {N}.", "Laat ik zeggen: {N}.", "Hm. {N}.", "{N}, als het meezit.", "Voorzichtig: {N}."],  # rustig, bedachtzaam
 "truus": ["{N}!", "Ik zeg {N}!", "{N}, hoor.", "Oeh, {N}!", "Gewoon {N}, schat!", "Ik ga voor {N}!", "{N}, wat spannend!"],  # vrolijk, dramatisch
 "kees":  ["{N}!", "Gewoon {N}.", "{N}, man.", "{N}. Makkelijk.", "Doe {N}.", "{N}, wat dacht je?", "Komt ie: {N}."],       # nuchter, brutaal
 "ria":   ["{N}.", "{N} graag.", "Ik waag {N}.", "Doe mij maar {N}, lieverd.", "{N}, dacht ik zo.", "Och, {N} maar.", "Laat ik {N} zeggen."],  # gezellige oma
 "bram":  ["{N}.", "{N}, easy.", "Ik ga voor {N}, bro.", "{N}, let's go!", "Sowieso {N}.", "{N}. Vet.", "{N}, echt wel."],  # student
 "gerda": ["{N}.", "{N}. Let maar op.", "{N}. Precies {N}.", "Noteer maar: {N}.", "{N}, en dat haal ik ook.", "{N}. Geen discussie.", "Ik neem er {N}. Uiteraard."],  # fanatiek
 "sjef":  ["{N}.", "{N}, jong.", "Ach, doe maar {N}.", "{N}, hè.", "Hèhè, {N}.", "{N}, op z'n gemak.", "Zet maar {N} op de lat."],  # caféman
 "mo":    ["{N}.", "{N}, en nu jullie!", "{N}. Ik voel het!", "{N}, zeker weten. Of niet.", "Doe maar {N}, voor de gezelligheid.", "{N}! Applaus graag.", "{N}, toch?"],  # grappenmaker
}
# Nat: balend, teleurgesteld, boos of een zucht; per speler een eigen stijl en genoeg afwisseling
WET = {
 "henk": ["Pfoe.", "Hè, verdorie.", "Dat had ik niet verwacht.", "Zo. Daar ga ik.", "Tja. Jammer dan.", "Hmpf. Nat.",
          "Dat is balen.", "Ach, wat een kaarten.", "Daar ga ik dan.", "Hm. Niet best.", "Dat zag ik niet aankomen.", "Ach ja, het hoort erbij."],
 "truus": ["Oh nee, toch!", "Nee hè!", "Dat meen je niet!", "Oh, wat jammer nou!", "Bah! Nat!", "Hè, wat flauw!",
           "Nou moe!", "Dat is nou pech!", "Oh, wat een drama!", "Nee, nee, nee!", "Dat is toch niet eerlijk!", "Help, ik zink!"],
 "kees": ["Pfoe, zeg.", "Balen, man!", "Ach, kom op!", "Dat slaat nergens op.", "Nat. Lekker.", "Wat een rotkaarten!",
          "Jemig.", "Ja hoor. Nat.", "Lekker dan.", "Pech, gewoon pech.", "Kom op zeg!", "Die kaarten, man."],
 "ria": ["Oei!", "Oh jee, daar ga ik!", "Nou ja zeg!", "Hè bah!", "Ach, mijn hemel.", "Dat valt tegen!",
         "Zucht.", "Dat had ik niet zien aankomen!", "Oh lieve hemel!", "Nou, daar zit ik dan.", "Och, och, och.", "Dat is jammer, lieverd."],
 "bram": ["Echt niet!", "Wat? Nee!", "Bro, serieus?", "Dat is zo vaag!", "Oké, dat ging mis.", "Kansloos.",
          "Nee man, nat!", "Dikke pech.", "Huh? Hoe dan?", "Dat is cringe.", "Rip.", "Nou, dat was het dan."],
 "gerda": ["Onacceptabel.", "Dat had niet mogen gebeuren.", "Verdorie nog aan toe!", "Dit is zeer vervelend.", "Grr. Nat.", "Dat reken ik mezelf aan.",
           "Volgende ronde beter.", "Hoe kan dat nou?", "Belachelijk.", "Niet goed. Helemaal niet goed.", "Daar baal ik van.", "Dat noteer ik niet graag."],
 "sjef": ["Ach jong, nat.", "Hèhè, daar gaan we.", "Da's nou jammer.", "Nou moe, jong.", "Ach, er zijn ergere dingen.", "Zonde, hè.",
          "Daar heb ik een biertje op nodig.", "Mijn hemel, jong.", "Pfoeh, jong.", "Da's balen, hè.", "Nou ja, gezellig is het wel.", "Ach, volgende keer beter."],
 "mo": ["Oeps!", "Dat was de bedoeling. Echt.", "Ik doe het expres, hoor.", "Nat? Ik? Nee joh!", "Even een duikje nemen.", "Plons!",
        "Zie je wel, ik ben een waterrat.", "Haha, mislukt!", "Dat was een test.", "Ik zwem wel terug.", "Iemand een handdoek?", "Hoppa, nat."],
}
# (model, lengte (hoger = langzamer), toonhoogte)
VOICE = {"henk": ("nl_NL-ronnie-medium", 1.05, 0.93), "truus": ("nl_BE-nathalie-medium", 1.0, 1.0),
         "kees": ("nl_BE-rdh-medium", 1.1, 1.0), "ria": ("nl_BE-nathalie-medium", 0.95, 1.12),
         "bram": ("nl_NL-pim-medium", 0.92, 1.1), "gerda": ("nl_BE-nathalie-medium", 1.08, 0.9),
         "sjef": ("nl_NL-ronnie-medium", 1.12, 0.84), "mo": ("nl_BE-rdh-medium", 0.95, 1.12)}
ONLY = sys.argv[3].split(",") if len(sys.argv) > 3 else list(VOICE)
res = {"bid": {}, "wet": {}, "bidMs": {}, "wetMs": {}}
for v, (m, ls, pitch) in VOICE.items():
    if v not in ONLY: continue
    dd = f"{P}/vits-piper-{m}"
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{dd}/{m}.onnx", tokens=f"{dd}/tokens.txt", data_dir=f"{dd}/espeak-ng-data", length_scale=ls), num_threads=4)))
    rows = [[cap(t.replace("{N}", W[n])) for t in BID[v]] for n in range(14)]
    jobs = [(f"bod_{v}_{n}_{k}", t) for n, row in enumerate(rows) for k, t in enumerate(row)]
    jobs += [(f"nat_{v}_{k}", t) for k, t in enumerate(WET[v])]
    ms = {}
    for name, t in jobs:
        a = tts.generate(t, sid=0, speed=1.0); sf.write(f"{OUT}/wav/{name}.wav", a.samples, a.sample_rate)
        sr = a.sample_rate
        f = (f"asetrate={sr}*{pitch},aresample={sr}," if pitch != 1.0 else "") + "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5"
        subprocess.run(["ffmpeg","-loglevel","error","-y","-i",f"{OUT}/wav/{name}.wav","-af",f,"-ac","1","-ar","22050","-c:a","libmp3lame","-q:a","6",f"{OUT}/mp3/{name}.mp3"], check=True)
        d = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{OUT}/mp3/{name}.mp3"], capture_output=True, text=True).stdout)
        ms[name] = round(d * 1000)
    res["bid"][v] = rows; res["wet"][v] = WET[v]
    res["bidMs"][v] = [[ms[f"bod_{v}_{n}_{k}"] for k in range(len(BID[v]))] for n in range(14)]
    res["wetMs"][v] = [ms[f"nat_{v}_{k}"] for k in range(len(WET[v]))]
    print(v, "ok", flush=True)
    json.dump(res, open(f"{OUT}/res.json", "w", encoding="utf8"), ensure_ascii=False)
json.dump(res, open(f"{OUT}/res.json", "w", encoding="utf8"), ensure_ascii=False)
