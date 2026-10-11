# 10 op en neer voor Android en de browser

Het Nederlandse kaartspel **10 op en neer** (ook bekend als Boerenbridge, Oh Hell, Bollen of Chinees poepen) als Android-app en als webapp voor iPhone, iPad en computer. Je speelt tegen drie computerspelers.

Deze app is een port van het Windows-spel [10 op en neer](https://sourceforge.net/projects/tienopenneer/) van A.A. Brink (Visual Basic 6, 2008). De spelregels, de puntentelling en de strategie van de computerspelers zijn één op één overgezet naar Kotlin.

## Wat zit erin

- Beide varianten: **10 op en neer** (1 t/m 10 t/m 1 kaarten) en **Boerenbridge** (tot 13 kaarten, strafpunten)
- Instelbaar: rondmaken toegestaan en verplicht introeven
- Computerspelers met dezelfde strategie als het origineel
- Scorelijst, laatste slag bekijken, tips, highscores per variant
- De originele geluidjes (slag te veel, slag te weinig, goed voorspeld, medespeler nat, applaus), uit te zetten bij Instellingen
- Het spel wordt automatisch bewaard; je kunt altijd verder waar je gebleven was

Nog niet overgezet: netwerkspel, de helpster Tineke en statistieken.

De geluiden in `app/src/main/res/raw/` komen uit het installatieprogramma van het origineel en zijn omgezet naar OGG. Een deel ervan lijkt afkomstig uit oude Windows-geluidspakketten; controleer de rechten voordat je de app openbaar verspreidt.

De uitgesproken voorspellingen (`bod_*.ogg`) zijn gemaakt met de Piper-stemmen nl_NL-pim, nl_NL-ronnie, nl_BE-nathalie en nl_BE-rdh (CC0).

## Webversie (iPhone en iPad)

`web/` bevat dezelfde spelregels en computerspelers, omgezet naar JavaScript met Kotlin/JS, plus een webpagina die je op het beginscherm kunt zetten (PWA). Na de eerste keer openen werkt het spel ook zonder internet.

- Bouwen: `./gradlew :web:site`, de site staat dan in `web/build/site`
- Online zetten gebeurt via GitHub Pages met `.github/workflows/web.yml`. Zet daarvoor eenmalig bij *Settings > Pages* de bron op *GitHub Actions*.
- Op de iPhone: open de site in Safari, tik op *Deel* en kies *Zet op beginscherm*.

## Opbouw

- `web/` – de webversie: `src/jsMain` maakt de spelcode bruikbaar in de browser, `static/` is de pagina
- `engine/` – de spellogica en de computerspelers in pure Kotlin, met unittests
- `app/` – de Android-app met Jetpack Compose

## Bouwen

```
./gradlew :engine:test        # spellogica testen
./gradlew :app:assembleDebug  # APK in app/build/outputs/apk/debug/
```

Elke push naar `main` bouwt via GitHub Actions een APK (te downloaden bij de run onder *Artifacts*). Een tag `v*` maakt een release met de APK.

## Licentie

GNU General Public License v3, net als het origineel. Zie [LICENSE](LICENSE).
