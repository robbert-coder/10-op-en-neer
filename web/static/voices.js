// Wat de spelers zeggen bij hun voorspelling en als ze nat gaan. Bij elke tekst hoort een geluid:
// sounds/bod_<speler>_<bod>_<variant>.mp3 en sounds/nat_<speler>_<variant>.mp3, ingesproken met ElevenLabs-stemmen (tools/elevenlabs.py); alleen "speler" (niet meer
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

export const BID_MS = {"speler":[[470,888,1071],[548,966,1097],[496,966,1018],[496,862,1071],[548,966,1097],[626,1097,1227],[574,966,1175],[731,1149,1253],[470,914,1149],[705,1071,1306],[417,940,862],[496,1018,1123],[600,1044,1227],[705,1071,1201]],"henk":[[1254,1176,993,1959,1515,1907,2142],[1228,1202,653,2116,1411,1881,1985],[549,1332,731,1855,1228,2116,2220],[1306,1306,705,1959,1489,1855,2429],[627,1176,967,1776,1384,1802,2429],[1437,1176,967,2194,1593,1985,2220],[653,1541,1123,2403,1593,1959,2273],[1620,1463,967,2142,2482,1907,2351],[1071,1097,1045,2090,2038,1985,2560],[1567,1646,993,2194,2090,1985,2664],[522,940,679,1907,1541,1829,2142],[1071,1097,967,2194,1332,1802,2064],[1254,1593,1123,2247,1750,2273,2717],[758,1280,1045,2090,2142,2011,2429]],"truus":[[522,1437,627,1332,1254,914,1306],[575,1071,653,1358,1123,1123,1541],[549,1019,627,1541,1228,967,1855],[444,940,705,914,1045,1593,1332],[705,1045,993,1149,1176,2064,1593],[601,1149,705,1489,1358,1437,1802],[601,1306,653,1358,1045,1019,1489],[653,1176,679,1202,1358,1306,1384],[575,940,627,1202,1254,1045,1776],[627,1515,862,1280,1489,1698,1567],[418,862,627,888,1411,1202,1802],[522,1228,575,1620,1306,1437,1489],[836,1515,862,1855,1698,1123,1541],[705,1176,731,1228,1202,1646,1358]],"kees":[[549,627,705,2377,705,967,1437],[392,653,627,1254,784,1071,1646],[418,653,653,1176,627,914,1202],[679,705,653,1097,679,1228,2090],[627,1202,705,1515,653,1202,1672],[522,940,731,1045,679,1176,1306],[496,836,627,1358,653,1149,2090],[522,862,758,1254,784,1097,1071],[418,627,836,1019,705,1045,1515],[627,653,731,1933,627,1071,1620],[340,784,705,1332,705,940,1907],[627,888,705,1202,653,914,1750],[653,967,784,1437,705,1071,1437],[601,1280,1071,1202,1019,1123,1541]],"ria":[[392,731,784,1097,1489,1228,888],[313,758,836,1202,1358,1176,967],[392,758,758,1176,1149,1176,940],[418,549,705,1149,888,1332,862],[392,601,836,1202,1254,1437,967],[313,810,967,1254,1384,1541,940],[522,601,836,1202,1254,1097,914],[575,888,836,1280,1306,1489,1019],[470,575,914,1228,1280,1123,914],[470,836,836,1280,1332,1149,1045],[470,679,731,1254,1489,1071,914],[470,731,888,1280,1411,1149,1019],[653,862,914,1332,1437,1176,1097],[549,914,862,1384,1202,1202,1071]],"bram":[[392,836,1149,940,810,1646,1123],[313,862,1202,967,862,836,1045],[418,1071,1097,993,810,1019,1123],[366,1176,1045,967,810,888,1254],[496,993,1123,1097,993,1176,1176],[601,1071,1045,1202,993,1071,1097],[549,731,1123,888,914,940,1045],[496,1071,1097,1071,862,967,1280],[392,940,1149,1202,836,914,1176],[418,1045,1149,1176,888,1384,1228],[444,888,1123,1019,862,1593,1176],[444,705,1123,967,888,862,1254],[549,1097,1176,1123,993,1123,1358],[758,1071,1123,967,862,1802,1202]],"gerda":[[418,1620,1855,1724,1384,1646,1698],[888,1437,2168,1750,1567,1959,1620],[444,1202,1698,1593,1489,1776,1802],[522,1541,1881,1515,1776,2116,1672],[575,1620,1620,1985,1672,1672,1776],[601,1907,2011,1776,2011,1776,1881],[1149,1724,1620,1776,1567,1829,1567],[601,1750,2429,2403,1593,2142,1829],[575,1489,2194,1672,1593,1750,1750],[1071,1463,1620,1698,1855,1933,1750],[444,1672,1881,1698,1750,1541,1567],[1019,1620,1776,1907,1750,1829,1881],[601,1672,1750,1672,1672,1907,2064],[575,1672,1698,1515,1541,1855,1646]],"sjef":[[496,810,784,627,810,1228,1202],[366,784,1123,653,836,967,1097],[444,810,888,705,705,1123,1071],[444,993,1332,705,810,1306,914],[418,731,862,679,967,1176,1045],[444,784,810,810,967,1306,1045],[470,862,888,679,914,1045,1071],[522,914,914,810,888,1176,1097],[287,967,1149,731,758,1280,1097],[522,862,1045,731,784,1176,1097],[418,888,784,575,679,1176,1019],[418,862,836,705,888,1097,1045],[549,967,1202,784,862,1332,1202],[627,836,914,810,810,1097,1097]],"mo":[[575,1149,1384,1776,2090,1489,784],[601,1306,1280,1724,1933,1672,758],[470,1123,1280,1698,1985,1437,679],[575,1437,1411,1750,1985,1620,862],[444,1176,1228,1672,2038,1384,627],[549,1280,1437,1776,2064,1515,810],[522,1176,1332,1672,1881,1411,679],[496,1358,1358,1855,2168,1515,888],[496,1280,1567,1776,2038,1698,810],[627,1437,1411,1829,2090,1567,758],[653,1149,1228,1698,1933,1358,627],[522,1384,1437,1750,2064,1593,784],[653,1176,1463,1776,2168,1541,967],[810,1254,1437,1959,2011,1489,940]],"speler_man":[[418],[836],[862],[601],[496],[862],[549],[549],[496],[810],[470],[444],[940],[653]],"speler_vrouw":[[418],[444],[340],[470],[418],[549],[522],[549],[444],[470],[470],[444],[549],[679]],"speler_neutraal":[[470],[392],[366],[313],[366],[418],[549],[496],[444],[496],[496],[392],[470],[575]]};

export const WET_MS = {"henk":[601,1228,1620,1829,1881,1411,1411,1489,1176,1750,1646,2011],"truus":[1097,627,862,1437,1620,1045,810,1071,1332,1228,1515,1567],"kees":[862,914,836,1149,940,1384,601,1228,653,1123,862,1071],"ria":[340,1358,705,470,940,810,549,1515,940,940,1071,1149],"bram":[575,862,1019,914,1280,705,967,784,1097,758,470,1202],"gerda":[940,1515,1384,1437,1384,1437,1202,940,679,1907,940,1881],"sjef":[888,1176,705,967,1176,705,1411,1045,967,1045,1254,1149],"mo":[496,1593,1384,1567,1332,627,1776,1071,1019,1176,1149,784]};
