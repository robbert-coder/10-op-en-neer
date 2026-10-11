// Tineke: de hulp uit het originele spel. Ze legt tijdens het spelen uit wat je moet doen
// (spelhulp) en geeft af en toe commentaar. De teksten komen uit clsTineke.cls van het origineel,
// aangepast aan dit scherm (tikken in plaats van klikken, cijfers bij de spelers in plaats van rondjes).

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const SUIT_NAME = ["", "klaver", "ruiten", "schoppen", "harten"];
const suitOf = (code) => Math.floor(code / 100);

/** Wat Tineke zegt als je op haar tikt; ze wordt steeds geïrriteerder. */
export function clickTexts() {
  const h = new Date().getHours();
  const greeting = h >= 5 && h <= 11 ? "Goedemorgen." : h <= 17 && h >= 12 ? "Goedemiddag." : h >= 18 ? "Goedenavond." : "Goedenacht.";
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
export function comment(event, st, opinion = 0) {
  const me = st.players[0];
  const badGame = st.isTienOpEnNeer && st.round >= 3 && me.total / st.round <= 3;
  const goodGame = st.isTienOpEnNeer && st.round >= 7 && me.total / st.round >= 8.5;
  let t = [];
  switch (event) {
    case "weinig voorspeld":
      t = ["Lijkt mij een beetje weinig.", "Ik zou meer voorspellen.", "Dat is te weinig.", "Dat kan niet goed gaan.",
        "Je krijgt er meer.", "Pessimist.", "Dat gaat fout.", "Je bent te voorzichtig."];
      break;
    case "veel voorspeld":
      t = ["Dat lukt niet.", "Dat lijkt mij een beetje veel.", "Dat is te veel.", "Dat wordt moeilijk.", "Dat lukt vast niet.",
        "Je bent een optimist.", "Ja ja.", "Dat moet ik nog zien.", "Het zal mij benieuwen.", "Dat is behoorlijk veel."];
      break;
    case "te veel":
      t = ["Je hebt er te veel!", "Foute boel.", "Pech.", "Dat zijn er te veel.", "Wat doe je nu?", "Niet goed.", "Mis.", "Jammer."];
      if (opinion === 1) t.push("Zie je wel.", "Ik heb altijd gelijk.", "Haha.", "Dat dacht ik al.", "Eigen schuld.");
      if (opinion === 2) t.push("Vreemd.", "Dat is gek.", "Dat had ik niet gedacht.");
      if (badGame) t.push("Het gaat erg slecht.", "Jij bent hier niet goed in.", "Het gaat niet best.");
      break;
    case "te weinig":
      t = ["Dat is niet leuk.", "Jammer.", "Mis.", "Pech."];
      if (badGame) t.push("Het gaat erg slecht.", "Jij bent hier niet goed in.", "Het gaat niet best.");
      if (opinion === 1) t.push("Vreemd.", "Dat is gek.", "Dat had ik niet gedacht.");
      if (opinion === 2) t.push("Zie je wel.", "Ik heb altijd gelijk.", "Dat dacht ik al.", "Haha.", "Eigen schuld.");
      break;
    case "goed":
      t = ["Alweer goed.", "Zo hoort het.", "Zo moet dat.", "Ga zo door.", "Oké.", "Goed."];
      if (goodGame) t.push("Het gaat erg goed.", "Jij bent hier goed in.", "Fabuleus.");
      if (opinion >= 1) t.push("Je had geluk.", "Wat een toeval.", "Dat had ik niet verwacht.");
      break;
    case "kleur bekennen": {
      const lead = st.table[st.leader - 1];
      t = [`Je moet kleur bekennen. Kies een ${SUIT_NAME[suitOf(lead)]}.`, "Hela hola.", "Daar trap ik niet in.",
        "Opletten jij.", "Mafketel.", "Leuk geprobeerd.", "Niet valsspelen."];
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

function endTexts(st) {
  if (!st.isTienOpEnNeer) return ["Dat was het dan alweer.", "Het spel is uit.", "Het spel is afgelopen.", "Zo, dat was leuk."];
  const s = (19 * st.players[0].total) / st.rounds;
  const table = [
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
  for (const [limit, texts] of table) if (s < limit) return texts;
  return ["Een fabelachtige score.", "Niet te geloven!"];
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
        ? { text: `Je hebt ${st.cards === 1 ? "één kaart" : `${st.cards} kaarten`} gekregen. Je moet nu het aantal slagen voorspellen: hoeveel keer denk je deze ronde de hoogste kaart op tafel te hebben? Tik op een cijfer.`, wait: false }
        : { text: `Je moet nu het aantal slagen voorspellen. Tik op een cijfer. Mijn advies: kies ${extra.advice}.`, wait: false };
    case "voorspeld":
      if (level > 2) return null;
      return {
        text: `Je hebt ${me.bid === 1 ? "1 slag" : `${me.bid} slagen`} voorspeld. Dat zie je bij je naam onder BOD; daarnaast staat hoeveel slagen je al hebt. Zo zie je ook wat de andere spelers voorspellen. Bovenin staat of er samen slagen over zijn of te weinig.`,
        wait: true,
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
        };
      }
      if (st.hand.length === 1) {
        return { text: `De spelers voor je hebben hun kaart opgelegd. Nu moet jij ook een kaart opleggen: tik op je kaart${only}.`, wait: false };
      }
      const lead = st.table[st.leader - 1];
      const suit = SUIT_NAME[suitOf(lead)];
      const canFollow = st.hand.some((c) => suitOf(c.code) === suitOf(lead));
      return {
        text: `De eerste kaart op tafel is de ${cardName(lead, describe)}. Nu moet jij kleur bekennen (ook een ${suit} opleggen). ` +
          (canFollow ? `Tik op een ${suit}kaart; de kaarten die je mag spelen staan omhoog.` : `Je hebt geen ${suit}, dus je mag elke kaart spelen.`),
        wait: false,
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
      let t = leader === 1 ? `Je legde als eerste de ${describe(lead)} op. ` : `${who(leader)} legde als eerste de ${describe(lead)} op. `;
      const gets = winner === 1 ? "Je krijgt nu deze vier kaarten" : `${who(winner)} krijgt nu deze vier kaarten`;
      if (winner === leader) {
        t += `${gets}, omdat niemand een hogere ${SUIT_NAME[suitOf(top)]}kaart had.`;
      } else if (suitOf(top) === trumpSuit && suitOf(lead) !== trumpSuit) {
        t += `${gets}, omdat ${winner === 1 ? "je" : "deze speler"} een ${SUIT_NAME[trumpSuit]}kaart ${winner === 1 ? "hebt" : "heeft"} opgelegd, en ${SUIT_NAME[trumpSuit]} is troef (zie de troefkaart bovenin).`;
      } else {
        t += `${gets}, omdat ${winner === 1 ? "je" : "deze speler"} de hoogste ${SUIT_NAME[suitOf(top)]} had.`;
      }
      return { text: t, wait: true };
    }
    case "slag erbij": {
      if (level > 3) return null;
      const w = st.lastTrickWinner;
      const p = st.players[w - 1];
      const t = w === 1 ? `Je hebt nu ${p.tricks === 1 ? "een slag." : `${p.tricks} slagen.`}` : `${p.name} heeft nu ${p.tricks === 1 ? "een slag." : `${p.tricks} slagen.`}`;
      return { text: `${t} Je ziet het aan het cijfer onder SLAGEN.`, wait: true };
    }
    case "score": {
      if (level > 5) return null;
      const [bid, tricks, score, , good] = me.rounds[st.round - 1];
      let t = `Je had ${bid === 1 ? "1 slag" : `${bid} slagen`} voorspeld`;
      if (good) t += ` en ook gekregen. Nu krijg je ${score} punten erbij.`;
      else t += `, maar dat is niet gelukt: je hebt er ${tricks} gehaald. ${score > 0 ? `Je krijgt ${score} punten.` : "Geen punten erbij."}`;
      if (level <= 3) t += " Alle scores staan op de scorelijst (de knop rechtsboven).";
      return { text: t, wait: false };
    }
    case "hulp uit":
      return { text: "Ik zal je niet meer helpen. Je kunt mijn uitleg altijd weer aanzetten bij Instellingen.", wait: false };
  }
  return null;
}
