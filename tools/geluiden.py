"""Maakt de spelgeluidjes in web/static/sounds/ helemaal zelf, met klanksynthese (geen opnames van anderen).

Gebruik: python3 tools/geluiden.py   (vereist numpy en ffmpeg)
"""
import pathlib
import subprocess
import wave

import numpy as np

RATE = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "web" / "static" / "sounds"
rng = np.random.default_rng(10)


def t(sec):
    return np.arange(int(sec * RATE)) / RATE


def env(n, attack=0.005, release=0.2):
    """Snel aan, langzaam uitsterven."""
    x = np.arange(n) / RATE
    a = np.minimum(1, x / attack)
    return a * np.exp(-x / release)


def bell(freq, sec, release=0.35, vol=0.5):
    x = t(sec)
    s = sum(w * np.sin(2 * np.pi * freq * m * x) for m, w in ((1, 1), (2, 0.45), (3, 0.2), (4.2, 0.12)))
    return vol * s * env(len(x), 0.004, release)


def brass(freq, sec, vol=0.35, vibrato=0.0, slide=0.0):
    """Koperachtige toon: zaagtand met wat boventonen, optioneel vibrato of glijden."""
    x = t(sec)
    f = freq * (1 + slide * x / sec) * (1 + vibrato * np.sin(2 * np.pi * 5.5 * x))
    phase = 2 * np.pi * np.cumsum(f) / RATE
    s = sum(np.sin(k * phase) / k for k in range(1, 8))
    a = np.minimum(1, x / 0.03) * np.minimum(1, (sec - x) / 0.06)
    return vol * s * a


def mix(*parts):
    n = max(off + len(p) for off, p in parts)
    out = np.zeros(n)
    for off, p in parts:
        out[off:off + len(p)] += p
    return out


def at(sec):
    return int(sec * RATE)


def clap():
    n = at(0.08)
    noise = rng.standard_normal(n)
    # Een klap: kort ruisstootje, iets hoog gefilterd
    noise = np.diff(noise, prepend=0)
    return noise * env(n, 0.001, 0.018) * 0.5


def applause(sec, density=40):
    out = np.zeros(at(sec))
    for _ in range(int(sec * density)):
        start = rng.integers(0, len(out) - at(0.1))
        c = clap() * rng.uniform(0.3, 1)
        out[start:start + len(c)] += c
    # Aanzwellen en uitsterven
    x = np.arange(len(out)) / len(out)
    return out * np.minimum(1, x / 0.15) * np.minimum(1, (1 - x) / 0.35)


def save(name, s):
    s = s / max(1e-9, np.max(np.abs(s))) * 0.85
    pcm = (s * 32767).astype(np.int16)
    wav = OUT / f"{name}.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k",
                    str(OUT / f"{name}.mp3")], check=True)
    wav.unlink()


C5, E5, G5, C6, E6, G6 = 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0

# Goed voorspeld: een vrolijk belletjesloopje omhoog
save("goed_voorspeld", mix(*[(at(i * 0.09), bell(f, 0.6, 0.25)) for i, f in enumerate((C5, E5, G5, C6))]))

# Slag te veel: een glijfluitje dat omlaag zakt, "oei"
x = t(0.7)
f = 900 * np.exp(-x * 2.2) + 250
whistle = 0.5 * np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.minimum(1, x / 0.02) * np.minimum(1, (0.7 - x) / 0.1)
save("slag_te_veel", whistle)

# Slag te weinig: twee korte doffe tikjes omlaag, "boe-boe"
def thud(freq, sec=0.12):
    x = t(sec)
    return 0.6 * np.sin(2 * np.pi * np.cumsum(freq * (1 - 0.4 * x / sec)) / RATE) * env(len(x), 0.002, 0.05)
save("slag_te_weinig", mix((0, thud(330)), (at(0.13), thud(247))))

# Medespeler nat: druppels die in het water plonzen
def drop(freq, sec=0.18):
    x = t(sec)
    f = freq * (1 + 2.5 * x / sec)
    return 0.6 * np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(x), 0.002, 0.06)
save("medespeler_nat", mix((0, drop(500)), (at(0.22), drop(420)), (at(0.42), drop(600, 0.25))))

# Onvoorkombare ondergang: treurige trombone, "wah wah wah waaah"
save("onvoorkombare_ondergang", mix(
    (0, brass(233, 0.3)), (at(0.32), brass(220, 0.3)), (at(0.64), brass(207.7, 0.3)),
    (at(0.96), brass(196, 0.9, vibrato=0.025, slide=-0.04))))

# Goed gespeeld: een korte fanfare met fonkelende belletjes
fanfare = mix((0, brass(G5 / 2, 0.16)), (at(0.18), brass(G5 / 2, 0.16)), (at(0.36), brass(C5, 0.7, vibrato=0.01)),
              (at(0.36), brass(E5, 0.7, vol=0.2)), (at(0.36), brass(G5, 0.7, vol=0.15)))
sparkle = mix(*[(at(1.0 + i * 0.07), bell(f, 0.5, 0.18, 0.25)) for i, f in enumerate((C6, E6, G6, C6 * 2, G6))])
save("goed_gespeeld", mix((0, fanfare), (0, sparkle), (at(1.1), applause(1.8, 30) * 0.6)))

# Zeer goed gespeeld: grotere fanfare, belletjes en een lang applaus
big = mix((0, brass(C5, 0.15)), (at(0.17), brass(E5, 0.15)), (at(0.34), brass(G5, 0.15)),
          (at(0.51), brass(C6, 1.0, vibrato=0.012)), (at(0.51), brass(G5, 1.0, vol=0.2)), (at(0.51), brass(E5, 1.0, vol=0.2)))
bells = mix(*[(at(1.3 + i * 0.08), bell(f, 0.5, 0.2, 0.22)) for i, f in enumerate((G5, C6, E6, G6, E6, G6, C6 * 2))])
save("zeer_goed_gespeeld", mix((0, big), (0, bells), (at(1.2), applause(5.0, 55) * 0.8)))
print("klaar")
