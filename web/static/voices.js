// Wat de spelers zeggen bij hun voorspelling en als ze nat gaan. Bij elke tekst hoort een geluid:
// sounds/bod_<speler>_<bod>_<variant>.mp3 en sounds/nat_<speler>_<variant>.mp3 (Engels: voices-en.js, sounds/en/), ingesproken met ElevenLabs-stemmen (tools/elevenlabs.py); alleen "speler" (niet meer
// gebruikt) is nog een Piper-stem (CC0, tools/stemmen.py).
// Variant 0 is alleen het getal; die wordt het vaakst gekozen. Voorspellingen zijn kort en rijmen niet;
// bij nat gaan balt elke computerspeler op zijn eigen manier.

export const BID_LINES = {
 "speler": [
  [
   "Nul.",
   "Ik zeg nul.",
   "Niks voor mij."
  ],
  [
   "Eén.",
   "Doe maar één.",
   "Eén voor mij."
  ],
  [
   "Twee.",
   "Ik denk twee.",
   "Ik neem er twee."
  ],
  [
   "Drie.",
   "Ik zeg drie.",
   "Ik ga voor drie."
  ],
  [
   "Vier.",
   "Doe maar vier.",
   "Vier voor mij."
  ],
  [
   "Vijf.",
   "Ik denk vijf.",
   "Ik neem er vijf."
  ],
  [
   "Zes.",
   "Ik zeg zes.",
   "Ik ga voor zes."
  ],
  [
   "Zeven.",
   "Doe maar zeven.",
   "Zeven voor mij."
  ],
  [
   "Acht.",
   "Ik denk acht.",
   "Ik neem er acht."
  ],
  [
   "Negen.",
   "Ik zeg negen.",
   "Ik ga voor negen."
  ],
  [
   "Tien.",
   "Doe maar tien.",
   "Tien voor mij."
  ],
  [
   "Elf.",
   "Ik denk elf.",
   "Ik neem er elf."
  ],
  [
   "Twaalf.",
   "Ik zeg twaalf.",
   "Ik ga voor twaalf."
  ],
  [
   "Dertien.",
   "Doe maar dertien.",
   "Dertien voor mij."
  ]
 ],
 "henk": [
  [
   "Nul.",
   "Nul, denk ik.",
   "Doe maar nul.",
   "Laat ik zeggen: nul.",
   "Hm. nul.",
   "Nul, als het meezit.",
   "Voorzichtig: nul."
  ],
  [
   "Eén.",
   "Eén, denk ik.",
   "Doe maar één.",
   "Laat ik zeggen: één.",
   "Hm. één.",
   "Eén, als het meezit.",
   "Voorzichtig: één."
  ],
  [
   "Twee.",
   "Twee, denk ik.",
   "Doe maar twee.",
   "Laat ik zeggen: twee.",
   "Hm. twee.",
   "Twee, als het meezit.",
   "Voorzichtig: twee."
  ],
  [
   "Drie.",
   "Drie, denk ik.",
   "Doe maar drie.",
   "Laat ik zeggen: drie.",
   "Hm. drie.",
   "Drie, als het meezit.",
   "Voorzichtig: drie."
  ],
  [
   "Vier.",
   "Vier, denk ik.",
   "Doe maar vier.",
   "Laat ik zeggen: vier.",
   "Hm. vier.",
   "Vier, als het meezit.",
   "Voorzichtig: vier."
  ],
  [
   "Vijf.",
   "Vijf, denk ik.",
   "Doe maar vijf.",
   "Laat ik zeggen: vijf.",
   "Hm. vijf.",
   "Vijf, als het meezit.",
   "Voorzichtig: vijf."
  ],
  [
   "Zes.",
   "Zes, denk ik.",
   "Doe maar zes.",
   "Laat ik zeggen: zes.",
   "Hm. zes.",
   "Zes, als het meezit.",
   "Voorzichtig: zes."
  ],
  [
   "Zeven.",
   "Zeven, denk ik.",
   "Doe maar zeven.",
   "Laat ik zeggen: zeven.",
   "Hm. zeven.",
   "Zeven, als het meezit.",
   "Voorzichtig: zeven."
  ],
  [
   "Acht.",
   "Acht, denk ik.",
   "Doe maar acht.",
   "Laat ik zeggen: acht.",
   "Hm. acht.",
   "Acht, als het meezit.",
   "Voorzichtig: acht."
  ],
  [
   "Negen.",
   "Negen, denk ik.",
   "Doe maar negen.",
   "Laat ik zeggen: negen.",
   "Hm. negen.",
   "Negen, als het meezit.",
   "Voorzichtig: negen."
  ],
  [
   "Tien.",
   "Tien, denk ik.",
   "Doe maar tien.",
   "Laat ik zeggen: tien.",
   "Hm. tien.",
   "Tien, als het meezit.",
   "Voorzichtig: tien."
  ],
  [
   "Elf.",
   "Elf, denk ik.",
   "Doe maar elf.",
   "Laat ik zeggen: elf.",
   "Hm. elf.",
   "Elf, als het meezit.",
   "Voorzichtig: elf."
  ],
  [
   "Twaalf.",
   "Twaalf, denk ik.",
   "Doe maar twaalf.",
   "Laat ik zeggen: twaalf.",
   "Hm. twaalf.",
   "Twaalf, als het meezit.",
   "Voorzichtig: twaalf."
  ],
  [
   "Dertien.",
   "Dertien, denk ik.",
   "Doe maar dertien.",
   "Laat ik zeggen: dertien.",
   "Hm. dertien.",
   "Dertien, als het meezit.",
   "Voorzichtig: dertien."
  ]
 ],
 "truus": [
  [
   "Nul!",
   "Ik zeg nul!",
   "Nul, hoor.",
   "Oeh, nul!",
   "Gewoon nul, schat!",
   "Ik ga voor nul!",
   "Nul, wat spannend!"
  ],
  [
   "Eén!",
   "Ik zeg één!",
   "Eén, hoor.",
   "Oeh, één!",
   "Gewoon één, schat!",
   "Ik ga voor één!",
   "Eén, wat spannend!"
  ],
  [
   "Twee!",
   "Ik zeg twee!",
   "Twee, hoor.",
   "Oeh, twee!",
   "Gewoon twee, schat!",
   "Ik ga voor twee!",
   "Twee, wat spannend!"
  ],
  [
   "Drie!",
   "Ik zeg drie!",
   "Drie, hoor.",
   "Oeh, drie!",
   "Gewoon drie, schat!",
   "Ik ga voor drie!",
   "Drie, wat spannend!"
  ],
  [
   "Vier!",
   "Ik zeg vier!",
   "Vier, hoor.",
   "Oeh, vier!",
   "Gewoon vier, schat!",
   "Ik ga voor vier!",
   "Vier, wat spannend!"
  ],
  [
   "Vijf!",
   "Ik zeg vijf!",
   "Vijf, hoor.",
   "Oeh, vijf!",
   "Gewoon vijf, schat!",
   "Ik ga voor vijf!",
   "Vijf, wat spannend!"
  ],
  [
   "Zes!",
   "Ik zeg zes!",
   "Zes, hoor.",
   "Oeh, zes!",
   "Gewoon zes, schat!",
   "Ik ga voor zes!",
   "Zes, wat spannend!"
  ],
  [
   "Zeven!",
   "Ik zeg zeven!",
   "Zeven, hoor.",
   "Oeh, zeven!",
   "Gewoon zeven, schat!",
   "Ik ga voor zeven!",
   "Zeven, wat spannend!"
  ],
  [
   "Acht!",
   "Ik zeg acht!",
   "Acht, hoor.",
   "Oeh, acht!",
   "Gewoon acht, schat!",
   "Ik ga voor acht!",
   "Acht, wat spannend!"
  ],
  [
   "Negen!",
   "Ik zeg negen!",
   "Negen, hoor.",
   "Oeh, negen!",
   "Gewoon negen, schat!",
   "Ik ga voor negen!",
   "Negen, wat spannend!"
  ],
  [
   "Tien!",
   "Ik zeg tien!",
   "Tien, hoor.",
   "Oeh, tien!",
   "Gewoon tien, schat!",
   "Ik ga voor tien!",
   "Tien, wat spannend!"
  ],
  [
   "Elf!",
   "Ik zeg elf!",
   "Elf, hoor.",
   "Oeh, elf!",
   "Gewoon elf, schat!",
   "Ik ga voor elf!",
   "Elf, wat spannend!"
  ],
  [
   "Twaalf!",
   "Ik zeg twaalf!",
   "Twaalf, hoor.",
   "Oeh, twaalf!",
   "Gewoon twaalf, schat!",
   "Ik ga voor twaalf!",
   "Twaalf, wat spannend!"
  ],
  [
   "Dertien!",
   "Ik zeg dertien!",
   "Dertien, hoor.",
   "Oeh, dertien!",
   "Gewoon dertien, schat!",
   "Ik ga voor dertien!",
   "Dertien, wat spannend!"
  ]
 ],
 "kees": [
  [
   "Nul!",
   "Gewoon nul.",
   "Nul, man.",
   "Nul. Makkelijk.",
   "Doe nul.",
   "Nul, wat dacht je?",
   "Komt ie: nul."
  ],
  [
   "Eén!",
   "Gewoon één.",
   "Eén, man.",
   "Eén. Makkelijk.",
   "Doe één.",
   "Eén, wat dacht je?",
   "Komt ie: één."
  ],
  [
   "Twee!",
   "Gewoon twee.",
   "Twee, man.",
   "Twee. Makkelijk.",
   "Doe twee.",
   "Twee, wat dacht je?",
   "Komt ie: twee."
  ],
  [
   "Drie!",
   "Gewoon drie.",
   "Drie, man.",
   "Drie. Makkelijk.",
   "Doe drie.",
   "Drie, wat dacht je?",
   "Komt ie: drie."
  ],
  [
   "Vier!",
   "Gewoon vier.",
   "Vier, man.",
   "Vier. Makkelijk.",
   "Doe vier.",
   "Vier, wat dacht je?",
   "Komt ie: vier."
  ],
  [
   "Vijf!",
   "Gewoon vijf.",
   "Vijf, man.",
   "Vijf. Makkelijk.",
   "Doe vijf.",
   "Vijf, wat dacht je?",
   "Komt ie: vijf."
  ],
  [
   "Zes!",
   "Gewoon zes.",
   "Zes, man.",
   "Zes. Makkelijk.",
   "Doe zes.",
   "Zes, wat dacht je?",
   "Komt ie: zes."
  ],
  [
   "Zeven!",
   "Gewoon zeven.",
   "Zeven, man.",
   "Zeven. Makkelijk.",
   "Doe zeven.",
   "Zeven, wat dacht je?",
   "Komt ie: zeven."
  ],
  [
   "Acht!",
   "Gewoon acht.",
   "Acht, man.",
   "Acht. Makkelijk.",
   "Doe acht.",
   "Acht, wat dacht je?",
   "Komt ie: acht."
  ],
  [
   "Negen!",
   "Gewoon negen.",
   "Negen, man.",
   "Negen. Makkelijk.",
   "Doe negen.",
   "Negen, wat dacht je?",
   "Komt ie: negen."
  ],
  [
   "Tien!",
   "Gewoon tien.",
   "Tien, man.",
   "Tien. Makkelijk.",
   "Doe tien.",
   "Tien, wat dacht je?",
   "Komt ie: tien."
  ],
  [
   "Elf!",
   "Gewoon elf.",
   "Elf, man.",
   "Elf. Makkelijk.",
   "Doe elf.",
   "Elf, wat dacht je?",
   "Komt ie: elf."
  ],
  [
   "Twaalf!",
   "Gewoon twaalf.",
   "Twaalf, man.",
   "Twaalf. Makkelijk.",
   "Doe twaalf.",
   "Twaalf, wat dacht je?",
   "Komt ie: twaalf."
  ],
  [
   "Dertien!",
   "Gewoon dertien.",
   "Dertien, man.",
   "Dertien. Makkelijk.",
   "Doe dertien.",
   "Dertien, wat dacht je?",
   "Komt ie: dertien."
  ]
 ],
 "ria": [
  [
   "Nul.",
   "Nul graag.",
   "Ik waag nul.",
   "Doe mij maar nul, lieverd.",
   "Nul, dacht ik zo.",
   "Och, nul maar.",
   "Laat ik nul zeggen."
  ],
  [
   "Eén.",
   "Eén graag.",
   "Ik waag één.",
   "Doe mij maar één, lieverd.",
   "Eén, dacht ik zo.",
   "Och, één maar.",
   "Laat ik één zeggen."
  ],
  [
   "Twee.",
   "Twee graag.",
   "Ik waag twee.",
   "Doe mij maar twee, lieverd.",
   "Twee, dacht ik zo.",
   "Och, twee maar.",
   "Laat ik twee zeggen."
  ],
  [
   "Drie.",
   "Drie graag.",
   "Ik waag drie.",
   "Doe mij maar drie, lieverd.",
   "Drie, dacht ik zo.",
   "Och, drie maar.",
   "Laat ik drie zeggen."
  ],
  [
   "Vier.",
   "Vier graag.",
   "Ik waag vier.",
   "Doe mij maar vier, lieverd.",
   "Vier, dacht ik zo.",
   "Och, vier maar.",
   "Laat ik vier zeggen."
  ],
  [
   "Vijf.",
   "Vijf graag.",
   "Ik waag vijf.",
   "Doe mij maar vijf, lieverd.",
   "Vijf, dacht ik zo.",
   "Och, vijf maar.",
   "Laat ik vijf zeggen."
  ],
  [
   "Zes.",
   "Zes graag.",
   "Ik waag zes.",
   "Doe mij maar zes, lieverd.",
   "Zes, dacht ik zo.",
   "Och, zes maar.",
   "Laat ik zes zeggen."
  ],
  [
   "Zeven.",
   "Zeven graag.",
   "Ik waag zeven.",
   "Doe mij maar zeven, lieverd.",
   "Zeven, dacht ik zo.",
   "Och, zeven maar.",
   "Laat ik zeven zeggen."
  ],
  [
   "Acht.",
   "Acht graag.",
   "Ik waag acht.",
   "Doe mij maar acht, lieverd.",
   "Acht, dacht ik zo.",
   "Och, acht maar.",
   "Laat ik acht zeggen."
  ],
  [
   "Negen.",
   "Negen graag.",
   "Ik waag negen.",
   "Doe mij maar negen, lieverd.",
   "Negen, dacht ik zo.",
   "Och, negen maar.",
   "Laat ik negen zeggen."
  ],
  [
   "Tien.",
   "Tien graag.",
   "Ik waag tien.",
   "Doe mij maar tien, lieverd.",
   "Tien, dacht ik zo.",
   "Och, tien maar.",
   "Laat ik tien zeggen."
  ],
  [
   "Elf.",
   "Elf graag.",
   "Ik waag elf.",
   "Doe mij maar elf, lieverd.",
   "Elf, dacht ik zo.",
   "Och, elf maar.",
   "Laat ik elf zeggen."
  ],
  [
   "Twaalf.",
   "Twaalf graag.",
   "Ik waag twaalf.",
   "Doe mij maar twaalf, lieverd.",
   "Twaalf, dacht ik zo.",
   "Och, twaalf maar.",
   "Laat ik twaalf zeggen."
  ],
  [
   "Dertien.",
   "Dertien graag.",
   "Ik waag dertien.",
   "Doe mij maar dertien, lieverd.",
   "Dertien, dacht ik zo.",
   "Och, dertien maar.",
   "Laat ik dertien zeggen."
  ]
 ],
 "bram": [
  [
   "Nul.",
   "Nul, easy.",
   "Ik ga voor nul, bro.",
   "Nul, let's go!",
   "Sowieso nul.",
   "Nul. Vet.",
   "Nul, echt wel."
  ],
  [
   "Eén.",
   "Eén, easy.",
   "Ik ga voor één, bro.",
   "Eén, let's go!",
   "Sowieso één.",
   "Eén. Vet.",
   "Eén, echt wel."
  ],
  [
   "Twee.",
   "Twee, easy.",
   "Ik ga voor twee, bro.",
   "Twee, let's go!",
   "Sowieso twee.",
   "Twee. Vet.",
   "Twee, echt wel."
  ],
  [
   "Drie.",
   "Drie, easy.",
   "Ik ga voor drie, bro.",
   "Drie, let's go!",
   "Sowieso drie.",
   "Drie. Vet.",
   "Drie, echt wel."
  ],
  [
   "Vier.",
   "Vier, easy.",
   "Ik ga voor vier, bro.",
   "Vier, let's go!",
   "Sowieso vier.",
   "Vier. Vet.",
   "Vier, echt wel."
  ],
  [
   "Vijf.",
   "Vijf, easy.",
   "Ik ga voor vijf, bro.",
   "Vijf, let's go!",
   "Sowieso vijf.",
   "Vijf. Vet.",
   "Vijf, echt wel."
  ],
  [
   "Zes.",
   "Zes, easy.",
   "Ik ga voor zes, bro.",
   "Zes, let's go!",
   "Sowieso zes.",
   "Zes. Vet.",
   "Zes, echt wel."
  ],
  [
   "Zeven.",
   "Zeven, easy.",
   "Ik ga voor zeven, bro.",
   "Zeven, let's go!",
   "Sowieso zeven.",
   "Zeven. Vet.",
   "Zeven, echt wel."
  ],
  [
   "Acht.",
   "Acht, easy.",
   "Ik ga voor acht, bro.",
   "Acht, let's go!",
   "Sowieso acht.",
   "Acht. Vet.",
   "Acht, echt wel."
  ],
  [
   "Negen.",
   "Negen, easy.",
   "Ik ga voor negen, bro.",
   "Negen, let's go!",
   "Sowieso negen.",
   "Negen. Vet.",
   "Negen, echt wel."
  ],
  [
   "Tien.",
   "Tien, easy.",
   "Ik ga voor tien, bro.",
   "Tien, let's go!",
   "Sowieso tien.",
   "Tien. Vet.",
   "Tien, echt wel."
  ],
  [
   "Elf.",
   "Elf, easy.",
   "Ik ga voor elf, bro.",
   "Elf, let's go!",
   "Sowieso elf.",
   "Elf. Vet.",
   "Elf, echt wel."
  ],
  [
   "Twaalf.",
   "Twaalf, easy.",
   "Ik ga voor twaalf, bro.",
   "Twaalf, let's go!",
   "Sowieso twaalf.",
   "Twaalf. Vet.",
   "Twaalf, echt wel."
  ],
  [
   "Dertien.",
   "Dertien, easy.",
   "Ik ga voor dertien, bro.",
   "Dertien, let's go!",
   "Sowieso dertien.",
   "Dertien. Vet.",
   "Dertien, echt wel."
  ]
 ],
 "gerda": [
  [
   "Nul.",
   "Nul. Let maar op.",
   "Nul. Precies nul.",
   "Noteer maar: nul.",
   "Nul, en dat haal ik ook.",
   "Nul. Geen discussie.",
   "Ik neem er nul. Uiteraard."
  ],
  [
   "Eén.",
   "Eén. Let maar op.",
   "Eén. Precies één.",
   "Noteer maar: één.",
   "Eén, en dat haal ik ook.",
   "Eén. Geen discussie.",
   "Ik neem er één. Uiteraard."
  ],
  [
   "Twee.",
   "Twee. Let maar op.",
   "Twee. Precies twee.",
   "Noteer maar: twee.",
   "Twee, en dat haal ik ook.",
   "Twee. Geen discussie.",
   "Ik neem er twee. Uiteraard."
  ],
  [
   "Drie.",
   "Drie. Let maar op.",
   "Drie. Precies drie.",
   "Noteer maar: drie.",
   "Drie, en dat haal ik ook.",
   "Drie. Geen discussie.",
   "Ik neem er drie. Uiteraard."
  ],
  [
   "Vier.",
   "Vier. Let maar op.",
   "Vier. Precies vier.",
   "Noteer maar: vier.",
   "Vier, en dat haal ik ook.",
   "Vier. Geen discussie.",
   "Ik neem er vier. Uiteraard."
  ],
  [
   "Vijf.",
   "Vijf. Let maar op.",
   "Vijf. Precies vijf.",
   "Noteer maar: vijf.",
   "Vijf, en dat haal ik ook.",
   "Vijf. Geen discussie.",
   "Ik neem er vijf. Uiteraard."
  ],
  [
   "Zes.",
   "Zes. Let maar op.",
   "Zes. Precies zes.",
   "Noteer maar: zes.",
   "Zes, en dat haal ik ook.",
   "Zes. Geen discussie.",
   "Ik neem er zes. Uiteraard."
  ],
  [
   "Zeven.",
   "Zeven. Let maar op.",
   "Zeven. Precies zeven.",
   "Noteer maar: zeven.",
   "Zeven, en dat haal ik ook.",
   "Zeven. Geen discussie.",
   "Ik neem er zeven. Uiteraard."
  ],
  [
   "Acht.",
   "Acht. Let maar op.",
   "Acht. Precies acht.",
   "Noteer maar: acht.",
   "Acht, en dat haal ik ook.",
   "Acht. Geen discussie.",
   "Ik neem er acht. Uiteraard."
  ],
  [
   "Negen.",
   "Negen. Let maar op.",
   "Negen. Precies negen.",
   "Noteer maar: negen.",
   "Negen, en dat haal ik ook.",
   "Negen. Geen discussie.",
   "Ik neem er negen. Uiteraard."
  ],
  [
   "Tien.",
   "Tien. Let maar op.",
   "Tien. Precies tien.",
   "Noteer maar: tien.",
   "Tien, en dat haal ik ook.",
   "Tien. Geen discussie.",
   "Ik neem er tien. Uiteraard."
  ],
  [
   "Elf.",
   "Elf. Let maar op.",
   "Elf. Precies elf.",
   "Noteer maar: elf.",
   "Elf, en dat haal ik ook.",
   "Elf. Geen discussie.",
   "Ik neem er elf. Uiteraard."
  ],
  [
   "Twaalf.",
   "Twaalf. Let maar op.",
   "Twaalf. Precies twaalf.",
   "Noteer maar: twaalf.",
   "Twaalf, en dat haal ik ook.",
   "Twaalf. Geen discussie.",
   "Ik neem er twaalf. Uiteraard."
  ],
  [
   "Dertien.",
   "Dertien. Let maar op.",
   "Dertien. Precies dertien.",
   "Noteer maar: dertien.",
   "Dertien, en dat haal ik ook.",
   "Dertien. Geen discussie.",
   "Ik neem er dertien. Uiteraard."
  ]
 ],
 "sjef": [
  [
   "Nul.",
   "Nul, jong.",
   "Ach, doe maar nul.",
   "Nul, hè.",
   "Hèhè, nul.",
   "Nul, op z'n gemak.",
   "Zet maar nul op de lat."
  ],
  [
   "Eén.",
   "Eén, jong.",
   "Ach, doe maar één.",
   "Eén, hè.",
   "Hèhè, één.",
   "Eén, op z'n gemak.",
   "Zet maar één op de lat."
  ],
  [
   "Twee.",
   "Twee, jong.",
   "Ach, doe maar twee.",
   "Twee, hè.",
   "Hèhè, twee.",
   "Twee, op z'n gemak.",
   "Zet maar twee op de lat."
  ],
  [
   "Drie.",
   "Drie, jong.",
   "Ach, doe maar drie.",
   "Drie, hè.",
   "Hèhè, drie.",
   "Drie, op z'n gemak.",
   "Zet maar drie op de lat."
  ],
  [
   "Vier.",
   "Vier, jong.",
   "Ach, doe maar vier.",
   "Vier, hè.",
   "Hèhè, vier.",
   "Vier, op z'n gemak.",
   "Zet maar vier op de lat."
  ],
  [
   "Vijf.",
   "Vijf, jong.",
   "Ach, doe maar vijf.",
   "Vijf, hè.",
   "Hèhè, vijf.",
   "Vijf, op z'n gemak.",
   "Zet maar vijf op de lat."
  ],
  [
   "Zes.",
   "Zes, jong.",
   "Ach, doe maar zes.",
   "Zes, hè.",
   "Hèhè, zes.",
   "Zes, op z'n gemak.",
   "Zet maar zes op de lat."
  ],
  [
   "Zeven.",
   "Zeven, jong.",
   "Ach, doe maar zeven.",
   "Zeven, hè.",
   "Hèhè, zeven.",
   "Zeven, op z'n gemak.",
   "Zet maar zeven op de lat."
  ],
  [
   "Acht.",
   "Acht, jong.",
   "Ach, doe maar acht.",
   "Acht, hè.",
   "Hèhè, acht.",
   "Acht, op z'n gemak.",
   "Zet maar acht op de lat."
  ],
  [
   "Negen.",
   "Negen, jong.",
   "Ach, doe maar negen.",
   "Negen, hè.",
   "Hèhè, negen.",
   "Negen, op z'n gemak.",
   "Zet maar negen op de lat."
  ],
  [
   "Tien.",
   "Tien, jong.",
   "Ach, doe maar tien.",
   "Tien, hè.",
   "Hèhè, tien.",
   "Tien, op z'n gemak.",
   "Zet maar tien op de lat."
  ],
  [
   "Elf.",
   "Elf, jong.",
   "Ach, doe maar elf.",
   "Elf, hè.",
   "Hèhè, elf.",
   "Elf, op z'n gemak.",
   "Zet maar elf op de lat."
  ],
  [
   "Twaalf.",
   "Twaalf, jong.",
   "Ach, doe maar twaalf.",
   "Twaalf, hè.",
   "Hèhè, twaalf.",
   "Twaalf, op z'n gemak.",
   "Zet maar twaalf op de lat."
  ],
  [
   "Dertien.",
   "Dertien, jong.",
   "Ach, doe maar dertien.",
   "Dertien, hè.",
   "Hèhè, dertien.",
   "Dertien, op z'n gemak.",
   "Zet maar dertien op de lat."
  ]
 ],
 "mo": [
  [
   "Nul.",
   "Nul, en nu jullie!",
   "Nul. Ik voel het!",
   "Nul, zeker weten. Of niet.",
   "Doe maar nul, voor de gezelligheid.",
   "Nul! Applaus graag.",
   "Nul, toch?"
  ],
  [
   "Eén.",
   "Eén, en nu jullie!",
   "Eén. Ik voel het!",
   "Eén, zeker weten. Of niet.",
   "Doe maar één, voor de gezelligheid.",
   "Eén! Applaus graag.",
   "Eén, toch?"
  ],
  [
   "Twee.",
   "Twee, en nu jullie!",
   "Twee. Ik voel het!",
   "Twee, zeker weten. Of niet.",
   "Doe maar twee, voor de gezelligheid.",
   "Twee! Applaus graag.",
   "Twee, toch?"
  ],
  [
   "Drie.",
   "Drie, en nu jullie!",
   "Drie. Ik voel het!",
   "Drie, zeker weten. Of niet.",
   "Doe maar drie, voor de gezelligheid.",
   "Drie! Applaus graag.",
   "Drie, toch?"
  ],
  [
   "Vier.",
   "Vier, en nu jullie!",
   "Vier. Ik voel het!",
   "Vier, zeker weten. Of niet.",
   "Doe maar vier, voor de gezelligheid.",
   "Vier! Applaus graag.",
   "Vier, toch?"
  ],
  [
   "Vijf.",
   "Vijf, en nu jullie!",
   "Vijf. Ik voel het!",
   "Vijf, zeker weten. Of niet.",
   "Doe maar vijf, voor de gezelligheid.",
   "Vijf! Applaus graag.",
   "Vijf, toch?"
  ],
  [
   "Zes.",
   "Zes, en nu jullie!",
   "Zes. Ik voel het!",
   "Zes, zeker weten. Of niet.",
   "Doe maar zes, voor de gezelligheid.",
   "Zes! Applaus graag.",
   "Zes, toch?"
  ],
  [
   "Zeven.",
   "Zeven, en nu jullie!",
   "Zeven. Ik voel het!",
   "Zeven, zeker weten. Of niet.",
   "Doe maar zeven, voor de gezelligheid.",
   "Zeven! Applaus graag.",
   "Zeven, toch?"
  ],
  [
   "Acht.",
   "Acht, en nu jullie!",
   "Acht. Ik voel het!",
   "Acht, zeker weten. Of niet.",
   "Doe maar acht, voor de gezelligheid.",
   "Acht! Applaus graag.",
   "Acht, toch?"
  ],
  [
   "Negen.",
   "Negen, en nu jullie!",
   "Negen. Ik voel het!",
   "Negen, zeker weten. Of niet.",
   "Doe maar negen, voor de gezelligheid.",
   "Negen! Applaus graag.",
   "Negen, toch?"
  ],
  [
   "Tien.",
   "Tien, en nu jullie!",
   "Tien. Ik voel het!",
   "Tien, zeker weten. Of niet.",
   "Doe maar tien, voor de gezelligheid.",
   "Tien! Applaus graag.",
   "Tien, toch?"
  ],
  [
   "Elf.",
   "Elf, en nu jullie!",
   "Elf. Ik voel het!",
   "Elf, zeker weten. Of niet.",
   "Doe maar elf, voor de gezelligheid.",
   "Elf! Applaus graag.",
   "Elf, toch?"
  ],
  [
   "Twaalf.",
   "Twaalf, en nu jullie!",
   "Twaalf. Ik voel het!",
   "Twaalf, zeker weten. Of niet.",
   "Doe maar twaalf, voor de gezelligheid.",
   "Twaalf! Applaus graag.",
   "Twaalf, toch?"
  ],
  [
   "Dertien.",
   "Dertien, en nu jullie!",
   "Dertien. Ik voel het!",
   "Dertien, zeker weten. Of niet.",
   "Doe maar dertien, voor de gezelligheid.",
   "Dertien! Applaus graag.",
   "Dertien, toch?"
  ]
 ],
 "speler_man": [
  [
   "Nul."
  ],
  [
   "Eén."
  ],
  [
   "Twee."
  ],
  [
   "Drie."
  ],
  [
   "Vier."
  ],
  [
   "Vijf."
  ],
  [
   "Zes."
  ],
  [
   "Zeven."
  ],
  [
   "Acht."
  ],
  [
   "Negen."
  ],
  [
   "Tien."
  ],
  [
   "Elf."
  ],
  [
   "Twaalf."
  ],
  [
   "Dertien."
  ]
 ],
 "speler_vrouw": [
  [
   "Nul."
  ],
  [
   "Eén."
  ],
  [
   "Twee."
  ],
  [
   "Drie."
  ],
  [
   "Vier."
  ],
  [
   "Vijf."
  ],
  [
   "Zes."
  ],
  [
   "Zeven."
  ],
  [
   "Acht."
  ],
  [
   "Negen."
  ],
  [
   "Tien."
  ],
  [
   "Elf."
  ],
  [
   "Twaalf."
  ],
  [
   "Dertien."
  ]
 ],
 "speler_neutraal": [
  [
   "Nul."
  ],
  [
   "Eén."
  ],
  [
   "Twee."
  ],
  [
   "Drie."
  ],
  [
   "Vier."
  ],
  [
   "Vijf."
  ],
  [
   "Zes."
  ],
  [
   "Zeven."
  ],
  [
   "Acht."
  ],
  [
   "Negen."
  ],
  [
   "Tien."
  ],
  [
   "Elf."
  ],
  [
   "Twaalf."
  ],
  [
   "Dertien."
  ]
 ]
};

export const WET_LINES = {
 "henk": [
  "Pfoe.",
  "Hè, verdorie.",
  "Dat had ik niet verwacht.",
  "Zo. Daar ga ik.",
  "Tja. Jammer dan.",
  "Hmpf. Nat.",
  "Dat is balen.",
  "Ach, wat een kaarten.",
  "Daar ga ik dan.",
  "Hm. Niet best.",
  "Dat zag ik niet aankomen.",
  "Ach ja, het hoort erbij."
 ],
 "truus": [
  "Oh nee, toch!",
  "Nee hè!",
  "Dat meen je niet!",
  "Oh, wat jammer nou!",
  "Bah! Nat!",
  "Hè, wat flauw!",
  "Nou moe!",
  "Dat is nou pech!",
  "Oh, wat een drama!",
  "Nee, nee, nee!",
  "Dat is toch niet eerlijk!",
  "Help, ik zink!"
 ],
 "kees": [
  "Pfoe, zeg.",
  "Balen, man!",
  "Ach, kom op!",
  "Dat slaat nergens op.",
  "Nat. Lekker.",
  "Wat een rotkaarten!",
  "Jemig.",
  "Ja hoor. Nat.",
  "Lekker dan.",
  "Pech, gewoon pech.",
  "Kom op zeg!",
  "Die kaarten, man."
 ],
 "ria": [
  "Oei!",
  "Oh jee, daar ga ik!",
  "Nou ja zeg!",
  "Hè bah!",
  "Ach, mijn hemel.",
  "Dat valt tegen!",
  "Zucht.",
  "Dat had ik niet zien aankomen!",
  "Oh lieve hemel!",
  "Nou, daar zit ik dan.",
  "Och, och, och.",
  "Dat is jammer, lieverd."
 ],
 "bram": [
  "Echt niet!",
  "Wat? Nee!",
  "Bro, serieus?",
  "Dat is zo vaag!",
  "Oké, dat ging mis.",
  "Kansloos.",
  "Nee man, nat!",
  "Dikke pech.",
  "Huh? Hoe dan?",
  "Dat is cringe.",
  "Rip.",
  "Nou, dat was het dan."
 ],
 "gerda": [
  "Onacceptabel.",
  "Dat had niet mogen gebeuren.",
  "Verdorie nog aan toe!",
  "Dit is zeer vervelend.",
  "Grr. Nat.",
  "Dat reken ik mezelf aan.",
  "Volgende ronde beter.",
  "Hoe kan dat nou?",
  "Belachelijk.",
  "Niet goed. Helemaal niet goed.",
  "Daar baal ik van.",
  "Dat noteer ik niet graag."
 ],
 "sjef": [
  "Ach jong, nat.",
  "Hèhè, daar gaan we.",
  "Da's nou jammer.",
  "Nou moe, jong.",
  "Ach, er zijn ergere dingen.",
  "Zonde, hè.",
  "Daar heb ik een biertje op nodig.",
  "Mijn hemel, jong.",
  "Pfoeh, jong.",
  "Da's balen, hè.",
  "Nou ja, gezellig is het wel.",
  "Ach, volgende keer beter."
 ],
 "mo": [
  "Oeps!",
  "Dat was de bedoeling. Echt.",
  "Ik doe het expres, hoor.",
  "Nat? Ik? Nee joh!",
  "Even een duikje nemen.",
  "Plons!",
  "Zie je wel, ik ben een waterrat.",
  "Haha, mislukt!",
  "Dat was een test.",
  "Ik zwem wel terug.",
  "Iemand een handdoek?",
  "Hoppa, nat."
 ]
};

export const BID_MS = {"speler":[[470,888,1071],[548,966,1097],[496,966,1018],[496,862,1071],[548,966,1097],[626,1097,1227],[574,966,1175],[731,1149,1253],[470,914,1149],[705,1071,1306],[417,940,862],[496,1018,1123],[600,1044,1227],[705,1071,1201]],"henk":[[653,1515,940,2508,1829,2090,2534],[731,1358,1019,2429,1646,1985,2586],[1280,1332,914,2273,1881,1855,2560],[1567,1646,1959,2116,1620,1985,2116],[1802,1541,1228,2482,1724,2116,2429],[784,1384,1045,2194,1802,1855,2691],[1855,1620,1149,2011,1541,2090,2586],[810,2142,1097,2612,1829,2273,2273],[1384,1358,1019,2403,1437,1829,2586],[1176,1541,967,2560,2377,2116,2403],[1019,1411,940,2247,1776,1907,2351],[627,1358,1411,2116,1829,2299,2247],[1724,1750,1646,2011,2508,2011,2403],[1829,1698,1959,2847,1907,2038,2429]],"truus":[[1019,1515,1202,1646,1489,1489,2011],[549,1228,627,1593,1541,1123,2482],[679,1724,967,1254,1437,1437,1802],[836,836,836,1463,1358,1358,1593],[940,1698,1515,1515,1750,1620,2064],[836,1593,1019,1384,1646,2090,1724],[1045,1280,993,1280,1698,1567,1829],[601,1149,1071,1672,1489,1437,2508],[653,1254,731,1724,1411,1228,1802],[967,1620,940,1123,1515,1463,2011],[522,1176,1019,1384,1437,1646,1750],[679,1228,993,1437,1620,2064,1646],[940,1672,1123,2194,1776,1776,2011],[940,1358,1019,1698,1358,1254,2011]],"kees":[[496,1254,1254,1829,1724,1097,1933],[705,1254,993,1620,1176,1881,1280],[1097,1280,1176,1541,601,1149,2064],[627,679,967,1881,601,1332,1437],[1045,2011,1411,1515,1123,1228,1384],[653,967,1332,2873,1202,1045,1437],[601,862,836,1489,1463,1384,1019],[601,1254,1149,1358,1280,1228,1698],[1071,940,993,1437,627,1123,1907],[1149,940,940,1672,1384,1202,1620],[575,1332,1097,1071,1306,993,1515],[601,1202,1750,1515,1411,1176,1646],[1750,1985,1097,2064,940,1907,1176],[1123,1411,1149,1567,1045,1228,1384]],"ria":[[601,1959,888,1489,1332,1254,1332],[1776,784,1228,2769,1306,1306,1019],[496,758,888,2691,1541,2429,1045],[418,705,2900,1280,1358,1071,3056],[549,862,1176,1306,2873,2482,1829],[653,836,1411,1489,2743,1228,1071],[575,836,1306,1541,2429,2612,1593],[731,914,1071,1411,1489,1437,2795],[522,758,967,1515,1541,1280,1541],[2168,914,1228,1358,2873,1332,1358],[392,888,2873,1254,1358,1202,1620],[601,2377,2586,1280,1280,1097,1254],[2142,810,2743,1411,1437,1489,1672],[601,1933,1202,1437,1437,1384,4049]],"bram":[[2090,1202,1202,1411,2247,1698,1411],[810,1411,1176,1176,1855,1437,1437],[862,1280,1045,1228,1123,1306,1228],[392,1202,967,1489,862,1567,1463],[1228,1881,1358,1384,1019,1463,1384],[1959,1228,1176,1437,1724,1567,1358],[1149,1933,1176,1358,1071,1358,1384],[627,1254,1202,2847,2064,1698,1515],[1228,1176,1776,1384,1045,1045,1097],[784,1489,1280,1541,1045,1358,1489],[914,1149,1097,1358,1384,888,1228],[496,2664,1332,1332,1620,1280,1411],[601,1620,1176,1280,1149,1280,2638],[914,1332,3605,1515,1071,1202,1280]],"gerda":[[575,1593,2795,1776,1855,1672,1855],[810,1620,2351,1855,2038,1907,1620],[1019,1567,2116,1829,1829,1829,1724],[967,1672,2064,1750,1541,1985,1672],[575,1358,2142,2795,1829,1881,1907],[1097,1646,2116,1646,1802,1881,1933],[758,1829,2325,1620,1881,1802,1985],[705,1541,2220,2064,1829,2273,1829],[522,2064,2011,1802,1802,1515,1698],[1123,1959,2194,1515,2403,1829,1933],[418,1280,1802,1437,1776,1567,1750],[731,1646,2168,1776,1985,1750,1776],[1071,1567,2325,1776,2011,1672,1985],[601,1515,2038,1750,1881,1750,1985]],"sjef":[[993,1332,914,1123,1411,1829,1437],[2142,1202,1306,1071,1750,1776,1620],[470,1097,1646,627,1332,1620,1358],[392,940,1149,1149,1358,2534,993],[496,1071,1019,1071,1541,2429,1672],[1123,705,2038,1202,1541,1541,1228],[1280,2168,1097,862,1750,1855,1463],[627,1437,993,1176,1593,1672,1202],[522,627,1045,1228,1202,2743,1254],[1437,1019,940,862,1567,3135,1332],[810,1071,1437,496,1228,1411,1515],[575,1332,1254,575,1724,1959,1045],[1045,810,2456,1646,1698,1829,1463],[549,679,1306,1358,2011,1489,1176]],"mo":[[1672,2325,3213,3918,3056,3631,1698],[2116,2821,2717,4336,2456,2560,2717],[1411,2429,2743,3527,3056,2743,1698],[967,2168,2795,4545,3082,2325,3265],[2064,2926,3657,4180,2847,2482,2038],[2220,4023,2038,4049,3239,3109,1672],[1698,3239,3291,4153,3161,3135,1829],[1985,2299,2325,4571,3344,3030,1567],[1802,2403,3213,4101,2743,2795,2090],[1646,2638,2351,4310,2900,2978,1829],[1463,2142,2299,4075,2821,3318,1489],[2011,3187,2638,4075,2638,3527,1724],[2011,1907,2560,4702,3082,3030,1776],[1724,2638,2299,3736,3918,2821,3762]],"speler_man":[[784],[366],[705],[705],[705],[705],[940],[653],[653],[705],[758],[627],[836],[993]],"speler_vrouw":[[313],[366],[418],[862],[470],[601],[470],[549],[575],[1019],[496],[444],[549],[444]],"speler_neutraal":[[522],[418],[470],[967],[1019],[575],[522],[627],[522],[993],[940],[496],[601],[601]]};

export const WET_MS = {"henk":[1959,1802,2011,3605,3187,2612,1411,2064,1855,2403,2534,2325],"truus":[1776,1593,2560,1985,1698,1306,888,1384,2168,2351,1907,1593],"kees":[1254,1123,967,1280,1567,2456,1437,1541,653,2247,1306,1254],"ria":[1515,2064,2952,1933,1411,1620,1254,2691,1593,2142,3135,1672],"bram":[1202,1672,1411,2220,1829,862,1776,1019,1620,1802,1097,1515],"gerda":[1202,2011,1567,2011,1332,2116,1384,1149,862,2220,1228,1672],"sjef":[2873,3082,2456,3213,3762,2873,3318,3736,2691,2795,2952,3082],"mo":[1907,3056,2534,4467,2429,1907,3161,1959,2090,2403,2403,2612]};
/** Duur in ms van de ingesproken reacties van de personages (sounds/reactie_*.mp3), om het wolkje even lang te tonen. */
export const REACTION_MS = {"reactie_allenat_bram_0":2038,"reactie_allenat_bram_1":2900,"reactie_allenat_bram_2":2142,"reactie_allenat_gerda_0":2090,"reactie_allenat_gerda_1":1515,"reactie_allenat_gerda_2":2220,"reactie_allenat_henk_0":3814,"reactie_allenat_henk_1":3082,"reactie_allenat_henk_2":4180,"reactie_allenat_kees_0":1881,"reactie_allenat_kees_1":1985,"reactie_allenat_kees_2":2952,"reactie_allenat_mo_0":3109,"reactie_allenat_mo_1":2900,"reactie_allenat_mo_2":2534,"reactie_allenat_ria_0":2142,"reactie_allenat_ria_1":3344,"reactie_allenat_ria_2":2482,"reactie_allenat_sjef_0":3683,"reactie_allenat_sjef_1":3631,"reactie_allenat_sjef_2":3318,"reactie_allenat_truus_0":3422,"reactie_allenat_truus_1":2795,"reactie_allenat_truus_2":1985,"reactie_wacht_bram_0":1437,"reactie_wacht_bram_1":1620,"reactie_wacht_bram_2":1907,"reactie_wacht_gerda_0":1358,"reactie_wacht_gerda_1":1202,"reactie_wacht_gerda_2":1750,"reactie_wacht_henk_0":3788,"reactie_wacht_henk_1":2900,"reactie_wacht_henk_2":3527,"reactie_wacht_kees_0":1593,"reactie_wacht_kees_1":862,"reactie_wacht_kees_2":1985,"reactie_wacht_mo_0":3187,"reactie_wacht_mo_1":3736,"reactie_wacht_mo_2":2429,"reactie_wacht_ria_0":2482,"reactie_wacht_ria_1":3422,"reactie_wacht_ria_2":2429,"reactie_wacht_sjef_0":1541,"reactie_wacht_sjef_1":2952,"reactie_wacht_sjef_2":1306,"reactie_wacht_truus_0":2142,"reactie_wacht_truus_1":2116,"reactie_wacht_truus_2":2403};
