// Tineke: de hulp uit het originele spel. Ze legt tijdens het spelen uit wat je moet doen
// (spelhulp) en geeft af en toe commentaar. De teksten komen uit clsTineke.cls van het origineel,
// aangepast aan dit scherm (tikken in plaats van klikken, cijfers bij de spelers in plaats van rondjes).
// Ze spreekt ook: elke vaste zin heeft een opname (spokenLines). Bij teksten met een kaart, naam of
// getal zegt ze een vaste, iets algemenere versie (say); op het scherm staat de precieze tekst.

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const SUIT_NAME = ["", "klaver", "ruiten", "schoppen", "harten"];
const SUITS = SUIT_NAME.slice(1);
const WORD = ["nul", "één", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf", "dertien"];
const GREETINGS = ["Goedemorgen.", "Goedemiddag.", "Goedenavond.", "Goedenacht."];
const suitOf = (code) => Math.floor(code / 100);

/** Wat Tineke zegt als je op haar tikt; ze wordt steeds geïrriteerder. */
export function clickTexts() {
  const h = new Date().getHours();
  const greeting = GREETINGS[h >= 5 && h <= 11 ? 0 : h <= 17 && h >= 12 ? 1 : h >= 18 ? 2 : 3];
  return clickList(greeting);
}
function clickList(greeting) {
  return [
    "Hallo!", "Hoe gaat het ermee?", "Hoe maak je het?", greeting, "Wat kan ik voor je betekenen?",
    "Ja zeg het maar.", "Wat is er nou?", "Ga eens ergens anders op tikken.", "Hou eens op zeg.",
    "Ga nou maar kaarten.", "Heb je niks beters te doen?", "Ik zit toch ook niet de hele tijd in jouw gezicht te tikken?",
    "Je zit mijn tijd te verdoen.", "Ik zit hier ook niet voor mijn lol!",
    "Denk je dat het leuk is om de hele tijd maar in een hoekje te zitten?", "Nee dat is niet leuk.",
    "Daar is helemaal niks aan.", "Dus doe ons allebei een plezier en ga kaarten.", "Hup",
    "Ik begin er genoeg van te krijgen.", "Hou op!", "Ik word boos!", "GRRRRRRRR!!!",
  ];
}

/**
 * Commentaar bij een gebeurtenis. [opinion] is wat Tineke van je voorspelling vond:
 * 0 = mee eens, 1 = te weinig voorspeld, 2 = te veel voorspeld.
 */
const COMMENTS = {
  weinig: ["Lijkt mij een beetje weinig.", "Ik zou meer voorspellen.", "Dat is te weinig.", "Dat kan niet goed gaan.",
    "Je krijgt er meer.", "Pessimist.", "Dat gaat fout.", "Je bent te voorzichtig."],
  veel: ["Dat lukt niet.", "Dat lijkt mij een beetje veel.", "Dat is te veel.", "Dat wordt moeilijk.", "Dat lukt vast niet.",
    "Je bent een optimist.", "Ja ja.", "Dat moet ik nog zien.", "Het zal mij benieuwen.", "Dat is behoorlijk veel."],
  teVeel: ["Je hebt er te veel!", "Foute boel.", "Pech.", "Dat zijn er te veel.", "Wat doe je nu?", "Niet goed.", "Mis.", "Jammer."],
  teWeinig: ["Dat is niet leuk.", "Jammer.", "Mis.", "Pech."],
  gelijk: ["Zie je wel.", "Ik heb altijd gelijk.", "Haha.", "Dat dacht ik al.", "Eigen schuld."],
  vreemd: ["Vreemd.", "Dat is gek.", "Dat had ik niet gedacht."],
  slecht: ["Het gaat erg slecht.", "Jij bent hier niet goed in.", "Het gaat niet best."],
  goed: ["Alweer goed.", "Zo hoort het.", "Zo moet dat.", "Ga zo door.", "Oké.", "Goed."],
  heelGoed: ["Het gaat erg goed.", "Jij bent hier goed in.", "Fabuleus."],
  geluk: ["Je had geluk.", "Wat een toeval.", "Dat had ik niet verwacht."],
  bekennen: ["Hela hola.", "Daar trap ik niet in.", "Opletten jij.", "Mafketel.", "Leuk geprobeerd.", "Niet valsspelen."],
};
const followText = (suit) => `Je moet kleur bekennen. Kies een ${suit}.`;

export function comment(event, st, opinion = 0) {
  const me = st.players[0];
  const badGame = st.isTienOpEnNeer && st.round >= 3 && me.total / st.round <= 3;
  const goodGame = st.isTienOpEnNeer && st.round >= 7 && me.total / st.round >= 8.5;
  let t = [];
  switch (event) {
    case "weinig voorspeld":
      t = [...COMMENTS.weinig];
      break;
    case "veel voorspeld":
      t = [...COMMENTS.veel];
      break;
    case "te veel":
      t = [...COMMENTS.teVeel];
      if (opinion === 1) t.push(...COMMENTS.gelijk);
      if (opinion === 2) t.push(...COMMENTS.vreemd);
      if (badGame) t.push(...COMMENTS.slecht);
      break;
    case "te weinig":
      t = [...COMMENTS.teWeinig];
      if (badGame) t.push(...COMMENTS.slecht);
      if (opinion === 1) t.push(...COMMENTS.vreemd);
      if (opinion === 2) t.push(...COMMENTS.gelijk);
      break;
    case "goed":
      t = [...COMMENTS.goed];
      if (goodGame) t.push(...COMMENTS.heelGoed);
      if (opinion >= 1) t.push(...COMMENTS.geluk);
      break;
    case "kleur bekennen": {
      const lead = st.table[st.leader - 1];
      t = [followText(SUIT_NAME[suitOf(lead)]), ...COMMENTS.bekennen];
      break;
    }
    case "afgelopen":
      t = endTexts(st);
      break;
    case "highscore":
      return null;
  }
  return t.length ? pick(t) : null;
}

const END_OTHER = ["Dat was het dan alweer.", "Het spel is uit.", "Het spel is afgelopen.", "Zo, dat was leuk."];
const END_BEST = ["Een fabelachtige score.", "Niet te geloven!"];
const END_TABLE = [
    [50, ["Wat ben je slecht!", "Je kunt het niet."]],
    [80, ["Je moet nog flink oefenen.", "Slecht."]],
    [90, ["Goed, voor een beginner.", "Beter je best doen."]],
    [100, ["Een magere score.", "Matig gespeeld."]],
    [110, ["Het kon erger.", "Het kan beter."]],
    [120, ["Niet geweldig.", "Het kan beter."]],
    [130, ["Redelijk goed gespeeld.", "Een aardige score."]],
    [140, ["Goed gespeeld.", "Een goede score."]],
    [150, ["Een mooie score.", "Een prima score."]],
    [160, ["Je weet hoe dit spel gaat.", "Goed gespeeld."]],
    [170, ["Heel goed gedaan.", "Zeer goed."]],
    [180, ["Uitstekend gespeeld.", "Je bent hier goed in!"]],
    [190, ["Je bent een expert.", "Uitmuntend."]],
    [200, ["Excellent gespeeld.", "Bijzonder goed."]],
    [210, ["Reden voor feest!", "Uitzonderlijk goed."]],
    [220, ["Bel de krant!", "Fabuleus!"]],
];
function endTexts(st) {
  if (!st.isTienOpEnNeer) return END_OTHER;
  const s = (19 * st.players[0].total) / st.rounds;
  for (const [limit, texts] of END_TABLE) if (s < limit) return texts;
  return END_BEST;
}

const cardName = (code, describe) => `${describe(code)}`;

/**
 * Uitleg bij een stap in het spel (ZegHulp). Geeft { text, wait } of null als Tineke niets
 * hoeft te zeggen; bij wait=true wacht het spel tot je op Doorgaan tikt.
 * [level] loopt op met elke gespeelde slag, zodat Tineke minder gaat uitleggen.
 */
export function help(event, st, level, describe, extra = {}) {
  const me = st.players[0];
  switch (event) {
    case "welkom":
      return {
        text: "Hallo, welkom bij 10 op en neer. Ik ben Tineke en ik ga je tijdens het spelen uitleggen wat je moet doen. Ken je het spel al? Tik dan op Overslaan.",
        wait: true,
      };
    case "voorspellen":
      return level <= 1
        ? { text: `Je hebt ${st.cards === 1 ? "één kaart" : `${st.cards} kaarten`} gekregen. Je moet nu het aantal slagen voorspellen: hoeveel keer denk je deze ronde de hoogste kaart op tafel te hebben? Tik op een cijfer.`, wait: false, say: [SAY.bidFirst] }
        : { text: `Je moet nu het aantal slagen voorspellen. Tik op een cijfer.${extra.advice != null ? ` Mijn advies: kies ${extra.advice}.` : ""}`, wait: false,
          say: [SAY.bid, ...(extra.advice != null ? [adviceText(extra.advice)] : [])] };
    case "voorspeld":
      if (level > 2) return null;
      return {
        text: `Je hebt ${me.bid === 1 ? "1 slag" : `${me.bid} slagen`} voorspeld. Dat zie je bij je naam onder BOD; daarnaast staat hoeveel slagen je al hebt. Zo zie je ook wat de andere spelers voorspellen. Bovenin staat of er samen slagen over zijn of te weinig.`,
        wait: true,
        say: [SAY.bidDone],
      };
    case "kies een kaart": {
      const leading = st.leader === 1;
      const first = me.cardCount === st.cards;
      const only = st.hand.length === 1 ? ` (de ${cardName(st.hand[0].code, describe)})` : "";
      if (leading) {
        return {
          text: first
            ? `Je moet nu uitkomen: als eerste een kaart opleggen. Dat zie je aan het label "uit" bij je naam. Tik op ${only ? `je kaart${only}` : "een kaart"}.`
            : `Jij moet nu een kaart opleggen, omdat je net een slag hebt gehaald. Tik op ${only ? `je kaart${only}` : "een kaart"}.`,
          wait: false,
          say: [first ? SAY.leadFirst : SAY.leadAgain, only ? SAY.tapOnly : SAY.tapAny],
        };
      }
      if (st.hand.length === 1) {
        return { text: `De spelers voor je hebben hun kaart opgelegd. Nu moet jij ook een kaart opleggen: tik op je kaart${only}.`, wait: false, say: [SAY.lastCard] };
      }
      const lead = st.table[st.leader - 1];
      const suit = SUIT_NAME[suitOf(lead)];
      const canFollow = st.hand.some((c) => suitOf(c.code) === suitOf(lead));
      return {
        text: `De eerste kaart op tafel is de ${cardName(lead, describe)}. Nu moet jij kleur bekennen (ook een ${suit} opleggen). ` +
          (canFollow ? `Tik op een ${suit}kaart; de kaarten die je mag spelen staan omhoog.` : `Je hebt geen ${suit}, dus je mag elke kaart spelen.`),
        wait: false,
        say: [SAY.follow(suit), canFollow ? SAY.canFollow(suit) : SAY.cannotFollow(suit)],
      };
    }
    case "slag naar hoogste": {
      if (level > 10) return null;
      const leader = st.leader;
      const winner = st.trickWinner;
      const lead = st.table[leader - 1];
      const top = st.table[winner - 1];
      const trumpSuit = st.trump ? suitOf(st.trump) : 0;
      const who = (nr, capital) => (nr === 1 ? (capital ? "Je" : "je") : st.players[nr - 1].name);
      let say;
      let t = leader === 1 ? `Je legde als eerste de ${describe(lead)} op. ` : `${who(leader)} legde als eerste de ${describe(lead)} op. `;
      const gets = winner === 1 ? "Je krijgt nu deze vier kaarten" : `${who(winner)} krijgt nu deze vier kaarten`;
      if (winner === leader) {
        t += `${gets}, omdat niemand een hogere ${SUIT_NAME[suitOf(top)]}kaart had.`;
        say = winner === 1 ? SAY.wonLead : SAY.otherLead;
      } else if (suitOf(top) === trumpSuit && suitOf(lead) !== trumpSuit) {
        t += `${gets}, omdat ${winner === 1 ? "je" : "deze speler"} een ${SUIT_NAME[trumpSuit]}kaart ${winner === 1 ? "hebt" : "heeft"} opgelegd, en ${SUIT_NAME[trumpSuit]} is troef (zie de troefkaart bovenin).`;
        say = winner === 1 ? SAY.wonTrump(SUIT_NAME[trumpSuit]) : SAY.otherTrump(SUIT_NAME[trumpSuit]);
      } else {
        t += `${gets}, omdat ${winner === 1 ? "je" : "deze speler"} de hoogste ${SUIT_NAME[suitOf(top)]} had.`;
        say = winner === 1 ? SAY.wonHigh : SAY.otherHigh;
      }
      return { text: t, wait: true, say: [say] };
    }
    case "slag erbij": {
      if (level > 3) return null;
      const w = st.lastTrickWinner;
      const p = st.players[w - 1];
      const t = w === 1 ? `Je hebt nu ${p.tricks === 1 ? "een slag." : `${p.tricks} slagen.`}` : `${p.name} heeft nu ${p.tricks === 1 ? "een slag." : `${p.tricks} slagen.`}`;
      return { text: `${t} Je ziet het aan het cijfer onder SLAGEN.`, wait: true, say: [SAY.trickCount] };
    }
    case "score": {
      if (level > 5) return null;
      const [bid, tricks, score, , good] = me.rounds[st.round - 1];
      let t = `Je had ${bid === 1 ? "1 slag" : `${bid} slagen`} voorspeld`;
      if (good) t += ` en ook gekregen. Nu krijg je ${score} punten erbij.`;
      else t += `, maar dat is niet gelukt: je hebt er ${tricks} gehaald. ${score > 0 ? `Je krijgt ${score} punten.` : "Geen punten erbij."}`;
      if (level <= 3) t += " Alle scores staan op de scorelijst (de knop rechtsboven).";
      return { text: t, wait: false, say: [good ? SAY.scoreGood : score > 0 ? SAY.scoreSome : SAY.scoreNone, ...(level <= 3 ? [SAY.scoreList] : [])] };
    }
    case "hulp uit":
      return { text: "Ik zal je niet meer helpen. Je kunt mijn uitleg altijd weer aanzetten bij Instellingen.", wait: false };
  }
  return null;
}

// Wat Tineke hardop zegt bij uitleg met een kaart, naam of getal erin: vaste zinnen, zodat er een opname van is
const SAY = {
  bidFirst: "Je hebt je kaarten gekregen. Je moet nu het aantal slagen voorspellen: hoeveel keer denk je deze ronde de hoogste kaart op tafel te hebben? Tik op een cijfer.",
  bid: "Je moet nu het aantal slagen voorspellen. Tik op een cijfer.",
  bidDone: "Je voorspelling zie je bij je naam onder BOD; daarnaast staat hoeveel slagen je al hebt. Zo zie je ook wat de andere spelers voorspellen. Bovenin staat of er samen slagen over zijn of te weinig.",
  leadFirst: "Je moet nu uitkomen: als eerste een kaart opleggen. Dat zie je aan het label uit bij je naam.",
  leadAgain: "Jij moet nu een kaart opleggen, omdat je net een slag hebt gehaald.",
  tapOnly: "Tik op je kaart.",
  tapAny: "Tik op een kaart.",
  lastCard: "De spelers voor je hebben hun kaart opgelegd. Nu moet jij ook een kaart opleggen: tik op je kaart.",
  follow: (suit) => `De eerste kaart op tafel is een ${suit}. Nu moet jij kleur bekennen: ook een ${suit} opleggen.`,
  canFollow: (suit) => `Tik op een ${suit}kaart; de kaarten die je mag spelen staan omhoog.`,
  cannotFollow: (suit) => `Je hebt geen ${suit}, dus je mag elke kaart spelen.`,
  wonLead: "Jij krijgt deze slag, omdat niemand een hogere kaart in jouw kleur had.",
  otherLead: "De speler die uitkwam krijgt deze slag, omdat niemand een hogere kaart in die kleur had.",
  wonTrump: (suit) => `Jij krijgt deze slag, omdat je hebt getroefd: ${suit} is troef.`,
  otherTrump: (suit) => `Deze slag gaat naar de speler die troefde: ${suit} is troef.`,
  wonHigh: "Jij krijgt deze slag, omdat je de hoogste kaart in de gevraagde kleur had.",
  otherHigh: "Deze slag gaat naar de speler met de hoogste kaart in de gevraagde kleur.",
  trickCount: "Hoeveel slagen iedereen heeft, zie je aan het cijfer onder SLAGEN.",
  scoreGood: "Je had het goed voorspeld, dus je krijgt er punten bij.",
  scoreSome: "Je voorspelling is niet gelukt, maar je krijgt nog wel wat punten.",
  scoreNone: "Je voorspelling is niet gelukt. Geen punten erbij.",
  scoreList: "Alle scores staan op de scorelijst, met de knop rechtsboven.",
};
const adviceText = (n) => `Mijn advies: kies ${WORD[n] ?? n}.`;

/** Alle zinnen die Tineke hardop kan zeggen; tools/elevenlabs.py maakt er de opnames van. */
export function spokenLines() {
  const all = [
    ...clickList(GREETINGS[0]), ...GREETINGS.slice(1),
    ...Object.values(COMMENTS).flat(), ...SUITS.map(followText),
    ...END_OTHER, ...END_BEST, ...END_TABLE.flatMap(([, t]) => t),
    help("welkom", { players: [] }).text, help("hulp uit", { players: [] }).text,
    ...Object.values(SAY).flatMap((v) => (typeof v === "function" ? SUITS.map(v) : [v])),
    ...WORD.map((_, n) => adviceText(n)),
  ];
  return [...new Set(all)];
}

/** Bestandsnaam van de opname van een zin (zonder .mp3): een korte hash, zodat tekst en opname bij elkaar blijven. */
export function speechFile(text) {
  let h = 0x811c9dc5;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return `tineke_${h.toString(16).padStart(8, "0")}`;
}
