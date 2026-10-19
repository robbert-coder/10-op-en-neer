// Wat de spelers in het Engels zeggen bij hun voorspelling en als ze nat gaan: dezelfde personages, dezelfde
// manier van praten en evenveel varianten als in voices.js, zodat dezelfde loting (pickLine) werkt.
// Opnames: sounds/en/bod_<speler>_<bod>_<variant>.mp3 en sounds/en/nat_<speler>_<variant>.mp3, ingesproken met
// dezelfde ElevenLabs-stemmen (tools/elevenlabs.py, stap "engels"). Hoe lang elke opname duurt staat in EN_MS
// (voices-en-ms.js, gemaakt bij het inspreken).

/** De getallen 0 tot en met 13 als woord, met een hoofdletter (voor aan het begin van een zin). */
const NUMBERS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"];

/**
 * Per personage zeven manieren om een bod te zeggen; {N} is het getal met hoofdletter, {n} zonder. Variant 0 is
 * alleen het getal (die wordt het vaakst gekozen), net als in het Nederlands.
 */
const BID_TEMPLATES = {
  henk: ["{N}.", "{N}, I reckon.", "Put me down for {n}.", "Let's say {n}.", "Hm. {N}.", "{N}, if I'm lucky.", "Carefully: {n}."],
  truus: ["{N}!", "I say {n}!", "{N}, darling.", "Ooh, {n}!", "Just {n}, love!", "I'm going for {n}!", "{N}, how exciting!"],
  kees: ["{N}!", "Just {n}.", "{N}, mate.", "{N}. Easy.", "Make it {n}.", "{N}, what did you think?", "Here it comes: {n}."],
  ria: ["{N}.", "{N}, please.", "I'll risk {n}.", "Make mine {n}, dear.", "{N}, I should think.", "Oh, {n} then.", "Let me say {n}."],
  bram: ["{N}.", "{N}, easy.", "Going for {n}, bro.", "{N}, let's go!", "{N}, for sure.", "{N}. Sick.", "{N}, totally."],
  gerda: ["{N}.", "{N}. Watch me.", "{N}. Exactly {n}.", "Write it down: {n}.", "{N}, and I'll make it.", "{N}. No discussion.", "I'll take {n}. Naturally."],
  sjef: ["{N}.", "{N}, lad.", "Ah, make it {n}.", "{N}, eh.", "Heh, {n}.", "{N}, nice and easy.", "Put {n} on the tab."],
  mo: ["{N}.", "{N}, over to you!", "{N}. I can feel it!", "{N}, definitely. Or not.", "{N}, just for fun.", "{N}! Applause, please.", "{N}, right?"],
  // De stem van een mens aan tafel zegt alleen het getal
  speler_man: ["{N}."],
  speler_vrouw: ["{N}."],
  speler_neutraal: ["{N}."],
};

const fillBid = (template, n) => template.replace("{N}", NUMBERS[n]).replace("{n}", NUMBERS[n].toLowerCase());

/** Alle Engelse voorspellingen: BID_LINES_EN[stem][bod][variant], dezelfde vorm als BID_LINES. */
export const BID_LINES_EN = Object.fromEntries(Object.entries(BID_TEMPLATES).map(([who, templates]) =>
  [who, NUMBERS.map((_, n) => templates.map((tpl) => fillBid(tpl, n)))]));

/** Wat een computerspeler zegt als hij nat gaat: twaalf per personage, net als WET_LINES. */
export const WET_LINES_EN = {
  henk: ["Phew.", "Blast it.", "Didn't see that coming.", "Right. There I go.", "Well. Pity.", "Hmph. Missed.", "That's a shame.",
    "Oh, what cards.", "There I go, then.", "Hm. Not great.", "Never saw that one coming.", "Ah well, part of the game."],
  truus: ["Oh no, really!", "Oh, not again!", "You can't be serious!", "Oh, what a shame!", "Ugh! Missed it!", "Oh, how mean!",
    "Well I never!", "Now that's bad luck!", "Oh, what a drama!", "No, no, no!", "That's just not fair!", "Help, I'm sinking!"],
  kees: ["Phew, man.", "Gutted, mate!", "Oh, come on!", "That makes no sense.", "Missed. Lovely.", "What rubbish cards!", "Blimey.",
    "Yeah, right. Missed.", "Great, just great.", "Bad luck, plain bad luck.", "Oh, give me a break!", "Those cards, man."],
  ria: ["Oops!", "Oh dear, there I go!", "Well, really!", "Oh, bother!", "Oh, my goodness.", "That's disappointing!", "Sigh.",
    "I didn't see that coming!", "Oh, good heavens!", "Well, there I am, then.", "Oh dear, oh dear.", "That's a pity, love."],
  bram: ["No way!", "What? No!", "Bro, seriously?", "That's so random!", "Okay, that went wrong.", "Hopeless.", "Nah man, missed!",
    "Massive bad luck.", "Huh? How?", "That's cringe.", "RIP.", "Well, that's that, then."],
  gerda: ["Unacceptable.", "That should not have happened.", "Confound it!", "This is most annoying.", "Grr. Missed.",
    "I blame myself for that.", "Better next round.", "How on earth?", "Ridiculous.", "Not good. Not good at all.",
    "That annoys me.", "I don't like writing that down."],
  sjef: ["Ah lad, missed.", "Heh, there we go.", "Now that's a pity.", "Well I never, lad.", "Ah, there are worse things.",
    "Shame, eh.", "I'll need a beer after that.", "Good heavens, lad.", "Phew, lad.", "That's a bummer, eh.",
    "Oh well, it's still a good night.", "Ah, better luck next time."],
  mo: ["Oops!", "That was the plan. Honestly.", "I did it on purpose, you know.", "Missed? Me? No way!", "Just taking a dip.",
    "Splash!", "See, I'm a water rat.", "Haha, failed!", "That was a test.", "I'll swim back.", "Anyone got a towel?",
    "Whoops, missed."],
};

/** Truus roept je toe op het startscherm (zelfde aantal als OPENERS in speech.js). */
export const OPENERS_EN = [
  "Ten up and dooown!",
  "Yesss! Here we go again! Ten up and down!",
  "Ladies and gentlemen... ten up and dooown!",
  "Welcome to the table! Shuffle those cards, the party's about to start!",
  "Come on, come on, cards on the table! Ten up and down!",
];
/** Als je na een spel terug bent op het startscherm (zelfde aantal als RETURNERS). */
export const RETURNERS_EN = [
  "There you are again! Fancy another game?",
  "Come on, one more game! This time you'll get every bid right!",
  "That left you wanting more, didn't it? Shuffle those cards!",
  "Rematch? I'm sure you can do better. Prove it!",
];
