// Tineke: de hulp uit het originele spel. Ze legt tijdens het spelen uit wat je moet doen
// (spelhulp) en geeft af en toe commentaar. De teksten komen uit clsTineke.cls van het origineel,
// aangepast aan dit scherm (tikken in plaats van klikken, cijfers bij de spelers in plaats van rondjes).
// Ze spreekt ook: elke vaste zin heeft een opname (spokenLines). Bij teksten met een kaart, naam of
// getal zegt ze een vaste, iets algemenere versie (say); op het scherm staat de precieze tekst.

// Op het scherm staat de tekst in de taal van het spel (t, i18n.js). De opnames zijn er in het Nederlands en in
// het Engels (spokenPairs: elke Nederlandse zin met de Engelse die ze dan zegt).
import { suitWord, t } from "./i18n.js";
import EN from "./i18n-en.js";

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
  return clickList(greeting).map((s) => t(s));
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
  let lines = [];
  switch (event) {
    case "weinig voorspeld":
      lines = [...COMMENTS.weinig];
      break;
    case "veel voorspeld":
      lines = [...COMMENTS.veel];
      break;
    case "te veel":
      lines = [...COMMENTS.teVeel];
      if (opinion === 1) lines.push(...COMMENTS.gelijk);
      if (opinion === 2) lines.push(...COMMENTS.vreemd);
      if (badGame) lines.push(...COMMENTS.slecht);
      break;
    case "te weinig":
      lines = [...COMMENTS.teWeinig];
      if (badGame) lines.push(...COMMENTS.slecht);
      if (opinion === 1) lines.push(...COMMENTS.vreemd);
      if (opinion === 2) lines.push(...COMMENTS.gelijk);
      break;
    case "goed":
      lines = [...COMMENTS.goed];
      if (goodGame) lines.push(...COMMENTS.heelGoed);
      if (opinion >= 1) lines.push(...COMMENTS.geluk);
      break;
    case "kleur bekennen": {
      const lead = st.table[st.leader - 1];
      // De Nederlandse zin is de sleutel van de opname; op het scherm in de taal van het spel
      lines = [t("Je moet kleur bekennen. Kies een {suit}.", { suit: suitWord(suitOf(lead)) }), ...COMMENTS.bekennen.map((s) => t(s))];
      return pick(lines);
    }
    case "afgelopen":
      lines = endTexts(st);
      break;
    case "highscore":
      return null;
  }
  return lines.length ? t(pick(lines)) : null;
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
/** Kleur van een kaart als woord in de taal van het spel ("klaver", "clubs"). */
const suitText = (code) => suitWord(suitOf(code));

/**
 * Uitleg bij een stap in het spel (ZegHulp). Geeft { text, wait } of null als Tineke niets
 * hoeft te zeggen; bij wait=true wacht het spel tot je op Begrepen tikt.
 * [level] loopt op met elke gespeelde slag, zodat Tineke minder gaat uitleggen.
 */
export function help(event, st, level, describe, extra = {}) {
  const h = helpFor(event, st, level, describe, extra);
  // Alleen nieuwe tips: een soort uitleg die je al eens kreeg, slaat Tineke over
  if (!h) return null;
  h.keys = h.keys ?? (h.key ? [h.key] : []);
  if (h.keys.length && h.keys.every((k) => extra.seen?.(k))) return null;
  return h;
}

/** Wat je met je voorspelling moet: precies halen, anders ben je nat (verschilt per spelsoort). */
const exactText = (extra) => (extra.wrongZero !== false ? SAY.exact : SAY.exactBB);

/** Nat gegaan door deze slag? Dan de reden, anders null. Telt de slag die nog op tafel ligt mee. */
function wetReason(st, winner, wrongZero) {
  const me = st.players[0];
  if (me.bid < 0) return null;
  const before = me.tricks;
  const after = before + (winner === 1 ? 1 : 0);
  const wetBefore = before > me.bid || me.bid - before > me.cardCount + 1;
  const wetAfter = after > me.bid || me.bid - after > me.cardCount;
  if (wetBefore || !wetAfter) return null;
  const n = me.cardCount;
  const left = t(n === 0 ? "er zijn geen kaarten meer over" : n === 1 ? "er is nog maar één kaart over" : "er zijn nog maar {n} kaarten over", { n });
  const vars = { bid: me.bid, tricks: after, left };
  // Fout voorspeld: bij 10 op en neer geen punten, bij Boerenbridge minder punten
  const tienOpEnNeer = wrongZero !== false;
  if (after > me.bid) {
    return {
      key: "nat te veel",
      // Met één slag al nat kan alleen bij een bod van 0
      text: after === 1
        ? t(tienOpEnNeer
          ? "Je bent nat: je voorspelde 0, maar je hebt nu al een slag. Meer slagen dan je voorspelt is ook fout, dus deze ronde krijg je geen punten."
          : "Je bent nat: je voorspelde 0, maar je hebt nu al een slag. Meer slagen dan je voorspelt is ook fout. Elke slag verschil kost 3 punten, dus probeer er niet nog meer te halen.")
        : t(tienOpEnNeer
          ? "Je bent nat: je voorspelde {bid}, maar je hebt nu al {tricks} slagen. Meer slagen dan je voorspelt is ook fout, dus deze ronde krijg je geen punten."
          : "Je bent nat: je voorspelde {bid}, maar je hebt nu al {tricks} slagen. Meer slagen dan je voorspelt is ook fout. Elke slag verschil kost 3 punten, dus probeer er niet nog meer te halen.", vars),
      say: tienOpEnNeer ? SAY.wetMany : SAY.wetManyBB,
    };
  }
  return {
    key: "nat te weinig",
    text: t(tienOpEnNeer
      ? "Je bent nat: je voorspelde {bid} en hebt er {tricks}, maar {left}. Je kunt je voorspelling dus niet meer halen en krijgt deze ronde geen punten."
      : "Je bent nat: je voorspelde {bid} en hebt er {tricks}, maar {left}. Je kunt je voorspelling dus niet meer halen. Elke slag verschil kost 3 punten, dus haal er nog zoveel mogelijk.", vars),
    say: tienOpEnNeer ? SAY.wetFew : SAY.wetFewBB,
  };
}

function helpFor(event, st, level, describe, extra) {
  const me = st.players[0];
  switch (event) {
    case "troef": {
      // Eén keer per spel: wat troef is (of dat er deze ronde geen troef is)
      const trumpSuit = st.trump ? suitOf(st.trump) : 0;
      if (!trumpSuit) {
        return { key: "geen troef", text: t(SAY.noTrump), say: [SAY.noTrump], wait: true };
      }
      return {
        key: "troef",
        text: t("Dit is de troefkaart: {suit} is deze ronde troef. Een troefkaart is sterker dan alle kaarten van de andere kleuren, ook dan een aas. Heb je de kleur die is uitgekomen niet, dan mag je troeven: een troefkaart opleggen. Zo win je een slag, ook met een lage troef (tenzij een ander hoger troeft). Troefkaarten in je hand helpen dus om slagen te halen; tel ze mee als je voorspelt.", { suit: suitWord(trumpSuit) }),
        say: [SAY.trump(SUIT_NAME[trumpSuit])],
        card: st.trump,
        wait: true,
      };
    }
    case "welkom":
      return {
        text: t(WELCOME),
        say: [WELCOME],
        wait: true,
      };
    case "voorspellen":
      return level <= 1
        ? { text: t(st.cards === 1
          ? "Je hebt één kaart gekregen. Je moet nu het aantal slagen voorspellen: hoeveel keer denk je deze ronde de hoogste kaart op tafel te hebben? Tik op een cijfer."
          : "Je hebt {n} kaarten gekregen. Je moet nu het aantal slagen voorspellen: hoeveel keer denk je deze ronde de hoogste kaart op tafel te hebben? Tik op een cijfer.", { n: st.cards }) + ` ${t(exactText(extra))}`,
        key: "voorspellen", wait: false, say: [SAY.bidFirst, exactText(extra)] }
        : { text: t("Je moet nu het aantal slagen voorspellen. Tik op een cijfer.") + (extra.advice != null ? ` ${t("Mijn advies: kies {n}.", { n: extra.advice })}` : ""), wait: false,
          key: extra.advice != null ? null : "voorspellen kort",
          say: [SAY.bid, ...(extra.advice != null ? [adviceText(extra.advice)] : [])] };
    case "voorspeld":
      if (level > 2) return null;
      return {
        text: t(me.bid === 1
          ? "Je hebt 1 slag voorspeld. Dat zie je bij je naam onder BOD; daarnaast staat hoeveel slagen je al hebt. Zo zie je ook wat de andere spelers voorspellen. Bovenin staat of er samen slagen over zijn of te weinig."
          : "Je hebt {n} slagen voorspeld. Dat zie je bij je naam onder BOD; daarnaast staat hoeveel slagen je al hebt. Zo zie je ook wat de andere spelers voorspellen. Bovenin staat of er samen slagen over zijn of te weinig.", { n: me.bid }),
        wait: true,
        key: "voorspeld",
        say: [SAY.bidDone],
      };
    case "kies een kaart": {
      const leading = st.leader === 1;
      const first = me.cardCount === st.cards;
      const only = st.hand.length === 1 ? cardName(st.hand[0].code, describe) : "";
      const tap = only ? t("Tik op je kaart (de {card}).", { card: only }) : t("Tik op een kaart.");
      if (leading) {
        return {
          text: `${first
            ? t("Je moet nu uitkomen: als eerste een kaart opleggen. Dat zie je aan het label \"uit\" bij je naam.")
            : t("Jij moet nu een kaart opleggen, omdat je net een slag hebt gehaald.")} ${tap}`,
          wait: false,
          key: first ? "uitkomen" : "uitkomen na slag",
          say: [first ? SAY.leadFirst : SAY.leadAgain, only ? SAY.tapOnly : SAY.tapAny],
        };
      }
      if (st.hand.length === 1) {
        return { text: t("De spelers voor je hebben hun kaart opgelegd. Nu moet jij ook een kaart opleggen: tik op je kaart (de {card}).", { card: only }), wait: false, key: "laatste kaart", say: [SAY.lastCard] };
      }
      const lead = st.table[st.leader - 1];
      const suit = SUIT_NAME[suitOf(lead)];
      const shown = suitText(lead);
      const canFollow = st.hand.some((c) => suitOf(c.code) === suitOf(lead));
      return {
        text: `${t("De eerste kaart op tafel is de {card}. Nu moet jij kleur bekennen (ook een {suit} opleggen).", { card: cardName(lead, describe), suit: shown })} ${
          canFollow ? t("Tik op een {suit}kaart; de kaarten die je mag spelen staan omhoog.", { suit: shown }) : t("Je hebt geen {suit}, dus je mag elke kaart spelen.", { suit: shown })}`,
        wait: false,
        key: canFollow ? "kleur bekennen" : "niet bekennen",
        say: [SAY.follow(suit), canFollow ? SAY.canFollow(suit) : SAY.cannotFollow(suit)],
      };
    }
    case "slag naar hoogste": {
      const leader = st.leader;
      const winner = st.trickWinner;
      // Ging je door deze slag nat, dan legt Tineke uit waarom (ook als ze de slag zelf niet meer uitlegt)
      const wet = wetReason(st, winner, extra.wrongZero);
      const showWet = wet && !extra.seen?.(wet.key);
      if (level > 10 && !showWet) return null;
      const lead = st.table[leader - 1];
      const top = st.table[winner - 1];
      const trumpSuit = st.trump ? suitOf(st.trump) : 0;
      const name = (nr) => st.players[nr - 1].name;
      const card = cardName(lead, describe);
      let say;
      let key;
      let text = leader === 1 ? t("Je legde als eerste de {card} op.", { card }) : t("{name} legde als eerste de {card} op.", { name: name(leader), card });
      const vars = { name: name(winner), suit: suitText(top), trump: suitWord(trumpSuit) };
      if (winner === leader) {
        text += ` ${winner === 1
          ? t("Je krijgt nu deze vier kaarten, omdat niemand een hogere {suit}kaart had.", vars)
          : t("{name} krijgt nu deze vier kaarten, omdat niemand een hogere {suit}kaart had.", vars)}`;
        say = winner === 1 ? SAY.wonLead : SAY.otherLead;
        key = "slag uitkomer";
      } else if (suitOf(top) === trumpSuit && suitOf(lead) !== trumpSuit) {
        text += ` ${winner === 1
          ? t("Je krijgt nu deze vier kaarten, omdat je een {trump}kaart hebt opgelegd, en {trump} is troef (zie de troefkaart bovenin).", vars)
          : t("{name} krijgt nu deze vier kaarten, omdat deze speler een {trump}kaart heeft opgelegd, en {trump} is troef (zie de troefkaart bovenin).", vars)}`;
        say = winner === 1 ? SAY.wonTrump(SUIT_NAME[trumpSuit]) : SAY.otherTrump(SUIT_NAME[trumpSuit]);
        key = "slag troef";
      } else {
        text += ` ${winner === 1
          ? t("Je krijgt nu deze vier kaarten, omdat je de hoogste {suit} had.", vars)
          : t("{name} krijgt nu deze vier kaarten, omdat deze speler de hoogste {suit} had.", vars)}`;
        say = winner === 1 ? SAY.wonHigh : SAY.otherHigh;
        key = "slag hoogste";
      }
      const showTrick = level <= 10 && !extra.seen?.(key);
      if (!showWet) return { text, wait: true, key, say: [say] };
      if (!showTrick) return { text: wet.text, wait: true, key: wet.key, say: [wet.say] };
      return { text: `${text} ${wet.text}`, wait: true, keys: [key, wet.key], say: [say, wet.say] };
    }
    case "slag erbij": {
      if (level > 3) return null;
      const w = st.lastTrickWinner;
      const p = st.players[w - 1];
      const vars = { n: p.tricks, name: p.name };
      const text = w === 1
        ? t(p.tricks === 1 ? "Je hebt nu een slag." : "Je hebt nu {n} slagen.", vars)
        : t(p.tricks === 1 ? "{name} heeft nu een slag." : "{name} heeft nu {n} slagen.", vars);
      return { text: `${text} ${t("Je ziet het aan het cijfer onder SLAGEN.")}`, wait: true, key: "slag erbij", say: [SAY.trickCount] };
    }
    case "score": {
      if (level > 5) return null;
      const [bid, tricks, score, , good] = me.rounds[st.round - 1];
      const vars = { bid, tricks, score };
      let text = good
        ? t(bid === 1 ? "Je had 1 slag voorspeld en ook gekregen. Nu krijg je {score} punten erbij." : "Je had {bid} slagen voorspeld en ook gekregen. Nu krijg je {score} punten erbij.", vars)
        : `${t(bid === 1 ? "Je had 1 slag voorspeld, maar dat is niet gelukt: je hebt er {tricks} gehaald." : "Je had {bid} slagen voorspeld, maar dat is niet gelukt: je hebt er {tricks} gehaald.", vars)} ${
          score > 0 ? t("Je krijgt {score} punten.", vars) : t("Geen punten erbij.")}`;
      if (level <= 3) text += ` ${t("Alle scores staan op de scorelijst (de knop rechtsboven).")}`;
      return { text, wait: false, key: good ? "score goed" : "score fout", say: [good ? SAY.scoreGood : score > 0 ? SAY.scoreSome : SAY.scoreNone, ...(level <= 3 ? [SAY.scoreList] : [])] };
    }
    case "hulp uit":
      return { text: t(HELP_OFF), say: [HELP_OFF], wait: false };
  }
  return null;
}

const WELCOME = "Hallo, welkom bij 10 op en neer. Ik ben Tineke en ik ga je tijdens het spelen uitleggen wat je moet doen. Ken je het spel al? Tik dan op Uitleg stoppen. Met Begrepen klik je alleen mijn tekst weg.";
const HELP_OFF = "Ik zal je niet meer helpen. Je kunt mijn uitleg altijd weer aanzetten in het menu tijdens het spel of bij Instellingen.";

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
  trump: (suit) => `${suit[0].toUpperCase()}${suit.slice(1)} is deze ronde troef. Een troefkaart is sterker dan alle kaarten van de andere kleuren, ook dan een aas. Heb je de kleur die is uitgekomen niet, dan mag je troeven. Dan win je de slag, ook met een lage troef, tenzij een ander hoger troeft. Tel je troefkaarten dus mee als je voorspelt.`,
  noTrump: "Deze ronde is er geen troef. De hoogste kaart in de kleur die is uitgekomen wint altijd de slag.",
  exact: "Probeer precies zoveel slagen te halen als je voorspelt. Haal je er meer of minder, dan ben je nat en krijg je deze ronde geen punten.",
  exactBB: "Probeer precies zoveel slagen te halen als je voorspelt. Haal je er meer of minder, dan ben je nat en krijg je minder punten: 3 minder per slag verschil.",
  wetMany: "Je bent nat: je hebt meer slagen dan je voorspelde. Ook te veel slagen is fout, dus deze ronde krijg je geen punten.",
  wetFew: "Je bent nat: er zijn te weinig kaarten over om je voorspelling nog te halen. Deze ronde krijg je geen punten.",
  wetManyBB: "Je bent nat: je hebt meer slagen dan je voorspelde. Elke slag verschil kost punten, dus probeer er niet nog meer te halen.",
  wetFewBB: "Je bent nat: er zijn te weinig kaarten over om je voorspelling nog te halen. Elke slag verschil kost punten, dus haal er nog zoveel mogelijk.",
};
const adviceText = (n) => `Mijn advies: kies ${WORD[n] ?? n}.`;

// Dezelfde vaste zinnen in het Engels (de Engelse opnames), met dezelfde sleutels als SAY
const SUIT_NAME_EN = ["", "clubs", "diamonds", "spades", "hearts"];
const WORD_EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"];
const SAY_EN = {
  bidFirst: "You've got your cards. Now you have to bid how many tricks you'll take: how many times do you think you'll have the highest card on the table this round? Tap a number.",
  bid: "Now bid how many tricks you'll take. Tap a number.",
  bidDone: "Your bid is shown by your name under BID; next to it is how many tricks you have. That's also where you see the other players' bids. At the top you can see whether there are tricks left over or too few.",
  leadFirst: "You lead now: you put down the first card. You can tell by the lead label next to your name.",
  leadAgain: "You play a card now, because you just won a trick.",
  tapOnly: "Tap your card.",
  tapAny: "Tap a card.",
  lastCard: "The players before you have played their cards. Now it's your turn to play: tap your card.",
  follow: (suit) => `The first card on the table is a ${suit.slice(0, -1)}. Now you must follow suit: play ${suit} as well.`,
  canFollow: (suit) => `Tap one of your ${suit}; the cards you may play are raised.`,
  cannotFollow: (suit) => `You don't have any ${suit}, so you may play any card.`,
  wonLead: "You win this trick, because nobody had a higher card in your suit.",
  otherLead: "The player who led wins this trick, because nobody had a higher card in that suit.",
  wonTrump: (suit) => `You win this trick, because you trumped: ${suit} are trumps.`,
  otherTrump: (suit) => `This trick goes to the player who trumped: ${suit} are trumps.`,
  wonHigh: "You win this trick, because you had the highest card in the suit that was led.",
  otherHigh: "This trick goes to the player with the highest card in the suit that was led.",
  trickCount: "You can see how many tricks everyone has by the number under TRICKS.",
  scoreGood: "Your bid was right, so you get points.",
  scoreSome: "Your bid didn't work out, but you still get a few points.",
  scoreNone: "Your bid didn't work out. No points this time.",
  scoreList: "All the scores are on the score sheet, with the button at the top right.",
  trump: (suit) => `${suit[0].toUpperCase()}${suit.slice(1)} are trumps this round. A trump beats every card of the other suits, even an ace. If you don't have the suit that was led, you may play a trump. Then you win the trick, even with a low trump, unless someone plays a higher one. So count your trumps when you bid.`,
  noTrump: "There are no trumps this round. The highest card in the suit that was led always wins the trick.",
  exact: "Try to take exactly as many tricks as you bid. Take more or fewer and you've missed, and you get no points this round.",
  exactBB: "Try to take exactly as many tricks as you bid. Take more or fewer and you've missed, and you get fewer points: 3 less for every trick you're off.",
  wetMany: "You've missed: you have more tricks than you bid. Too many tricks is wrong too, so you get no points this round.",
  wetFew: "You've missed: there aren't enough cards left to make your bid. You get no points this round.",
  wetManyBB: "You've missed: you have more tricks than you bid. Every trick you're off costs points, so try not to take any more.",
  wetFewBB: "You've missed: there aren't enough cards left to make your bid. Every trick you're off costs points, so take as many as you still can.",
};
const adviceTextEn = (n) => `My advice: choose ${WORD_EN[n] ?? n}.`;
/** De Engelse zin van "kleur bekennen" precies zoals hij op het scherm staat (zie comment). */
const followTextEn = (suit) => (EN["Je moet kleur bekennen. Kies een {suit}."] ?? "").replace("{suit}", suit);

/**
 * Elke zin die Tineke hardop kan zeggen, met de Engelse zin die ze in een Engels spel zegt: [[nl, en], ...].
 * Nodig omdat de opnames per taal apart zijn; in het Engels zoekt het spel bij een Nederlandse zin (uit say) de
 * Engelse op. Een zin zonder vertaling (zoals "Haha.") blijft gelijk.
 */
export function spokenPairs() {
  const same = (list) => list.map((nl) => [nl, EN[nl] ?? nl]);
  const pairs = [
    ...same([...clickList(GREETINGS[0]), ...GREETINGS.slice(1), ...Object.values(COMMENTS).flat()]),
    ...SUITS.map((suit, i) => [followText(suit), followTextEn(SUIT_NAME_EN[i + 1])]),
    ...same([...END_OTHER, ...END_BEST, ...END_TABLE.flatMap(([, x]) => x), WELCOME, HELP_OFF]),
    ...Object.entries(SAY).flatMap(([k, v]) => (typeof v === "function"
      ? SUITS.map((suit, i) => [v(suit), SAY_EN[k](SUIT_NAME_EN[i + 1])])
      : [[v, SAY_EN[k]]])),
    ...WORD.map((_, n) => [adviceText(n), adviceTextEn(n)]),
  ];
  return [...new Map(pairs).entries()];
}

/** Alle zinnen die Tineke hardop kan zeggen; tools/elevenlabs.py maakt er de opnames van. */
export function spokenLines() {
  const all = [
    ...clickList(GREETINGS[0]), ...GREETINGS.slice(1),
    ...Object.values(COMMENTS).flat(), ...SUITS.map(followText),
    ...END_OTHER, ...END_BEST, ...END_TABLE.flatMap(([, x]) => x),
    WELCOME, HELP_OFF,
    ...Object.values(SAY).flatMap((v) => (typeof v === "function" ? SUITS.map(v) : [v])),
    ...WORD.map((_, n) => adviceText(n)),
  ];
  return [...new Set(all)];
}

/** Alle vaste zinnen die Tineke op het scherm laat zien (voor de test dat ze allemaal een Engelse vertaling hebben). */
export function shownLines() {
  return [...new Set([
    ...clickList(GREETINGS[0]), ...GREETINGS.slice(1), ...Object.values(COMMENTS).flat(),
    ...END_OTHER, ...END_BEST, ...END_TABLE.flatMap(([, x]) => x), WELCOME, HELP_OFF,
  ])];
}

/** Bestandsnaam van de opname van een zin (zonder .mp3): een korte hash, zodat tekst en opname bij elkaar blijven. */
export function speechFile(text) {
  let h = 0x811c9dc5;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return `tineke_${h.toString(16).padStart(8, "0")}`;
}
