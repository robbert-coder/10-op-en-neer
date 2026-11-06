// Wat de spelers in het Duits zeggen bij hun voorspelling en als ze nat gaan: de Duitse tegenhanger van
// voices-en.js. Dezelfde personages, dezelfde manier van praten en evenveel varianten als in voices.js, zodat
// dezelfde loting (pickLine) werkt.
// Opnames: sounds/de/bod_<speler>_<bod>_<variant>.mp3 en sounds/de/nat_<speler>_<variant>.mp3, ingesproken met
// dezelfde ElevenLabs-stemmen (tools/elevenlabs.py). Hoe lang elke opname duurt komt in een eigen tabel naast
// deze file (gemaakt bij het inspreken).

/** De getallen 0 tot en met 13 als woord, met een hoofdletter (voor aan het begin van een zin). */
const NUMBERS = ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn", "Elf", "Zwölf", "Dreizehn"];

/**
 * Per personage zeven manieren om een bod te zeggen; {N} is het getal met hoofdletter, {n} zonder. Variant 0 is
 * alleen het getal (die wordt het vaakst gekozen), net als in het Nederlands.
 */
const BID_TEMPLATES = {
  henk: ["{N}.", "{N}, schätze ich.", "Schreib mir {n} auf.", "Sagen wir {n}.", "Hm. {N}.", "{N}, wenn ich Glück habe.", "Vorsichtig: {n}."],
  truus: ["{N}!", "Ich sage {n}!", "{N}, Schätzchen.", "Oh, {n}!", "Einfach {n}, Liebling!", "Ich geh auf {n}!", "{N}, wie aufregend!"],
  kees: ["{N}!", "Einfach {n}.", "{N}, Kumpel.", "{N}. Locker.", "Mach {n} draus.", "{N}, was dachtest du denn?", "Da kommt's: {n}."],
  ria: ["{N}.", "{N}, bitte.", "Ich wage mal {n}.", "Für mich {n}, mein Lieber.", "{N}, würde ich meinen.", "Ach, dann {n}.", "Ich sage mal {n}."],
  bram: ["{N}.", "{N}, easy.", "Ich geh auf {n}, Bro.", "{N}, los geht's!", "{N}, safe.", "{N}. Krass.", "{N}, voll."],
  gerda: ["{N}.", "{N}. Pass auf.", "{N}. Genau {n}.", "Schreib auf: {n}.", "{N}, und das schaffe ich.", "{N}. Keine Diskussion.", "Ich nehme {n}. Selbstverständlich."],
  sjef: ["{N}.", "{N}, Junge.", "Ach, mach {n} draus.", "{N}, ne.", "Hehe, {n}.", "{N}, ganz gemütlich.", "Schreib {n} auf den Deckel."],
  mo: ["{N}.", "{N}, du bist dran!", "{N}. Ich spür's!", "{N}, ganz sicher. Oder nicht.", "{N}, einfach so zum Spaß.", "{N}! Applaus, bitte.", "{N}, oder?"],
  // De stem van een mens aan tafel zegt alleen het getal
  speler_man: ["{N}."],
  speler_vrouw: ["{N}."],
  speler_neutraal: ["{N}."],
};

const fillBid = (template, n) => template.replace("{N}", NUMBERS[n]).replace("{n}", NUMBERS[n].toLowerCase());

/** Alle Duitse voorspellingen: BID_LINES_DE[stem][bod][variant], dezelfde vorm als BID_LINES. */
export const BID_LINES_DE = Object.fromEntries(Object.entries(BID_TEMPLATES).map(([who, templates]) =>
  [who, NUMBERS.map((_, n) => templates.map((tpl) => fillBid(tpl, n)))]));

/** Wat een computerspeler zegt als hij nat gaat: twaalf per personage, net als WET_LINES. */
export const WET_LINES_DE = {
  henk: ["Puh.", "Verflixt.", "Das habe ich nicht kommen sehen.", "So. Da gehe ich baden.", "Tja. Schade.", "Hm. Daneben.", "Das ist schade.",
    "Ach, was für Karten.", "Da gehe ich also baden.", "Hm. Nicht gut.", "Damit hätte ich nie gerechnet.", "Na ja, das gehört zum Spiel."],
  truus: ["Oh nein, wirklich!", "Oh, nicht schon wieder!", "Das ist doch nicht dein Ernst!", "Oh, wie schade!", "Igitt! Daneben!", "Oh, wie gemein!",
    "Na so was!", "Das ist doch Pech!", "Oh, was für ein Drama!", "Nein, nein, nein!", "Das ist einfach nicht fair!", "Hilfe, ich gehe unter!"],
  kees: ["Puh, Mann.", "Mist, Kumpel!", "Ach, komm schon!", "Das ergibt keinen Sinn.", "Daneben. Herrlich.", "Was für Mistkarten!", "Meine Güte.",
    "Ja klar. Daneben.", "Super, echt super.", "Pech, einfach nur Pech.", "Ach, hör doch auf!", "Diese Karten, Mann."],
  ria: ["Hoppla!", "Ach je, da gehe ich baden!", "Na so was!", "Ach, Mensch!", "Ach, du meine Güte.", "Wie enttäuschend!", "Seufz.",
    "Das habe ich nicht kommen sehen!", "Ach, du lieber Himmel!", "Na, da sitze ich nun.", "Ach je, ach je.", "Wie schade, mein Lieber."],
  bram: ["No way!", "Was? Nein!", "Bro, im Ernst?", "Das ist so random!", "Okay, das ging schief.", "Hoffnungslos.", "Nee Mann, daneben!",
    "Mega Pech.", "Hä? Wie?", "Das ist cringe.", "RIP.", "Tja, das war's dann."],
  gerda: ["Inakzeptabel.", "Das hätte nicht passieren dürfen.", "Verflucht!", "Das ist äußerst ärgerlich.", "Grr. Daneben.",
    "Das nehme ich mir übel.", "Nächste Runde besser.", "Wie um alles in der Welt?", "Lächerlich.", "Nicht gut. Gar nicht gut.",
    "Das ärgert mich.", "Das schreibe ich nicht gern auf."],
  sjef: ["Ach Junge, daneben.", "Hehe, da haben wir's.", "Das ist aber schade.", "Na so was, Junge.", "Ach, es gibt Schlimmeres.",
    "Schade, ne.", "Darauf brauche ich ein Bier.", "Du meine Güte, Junge.", "Puh, Junge.", "Das ist bitter, ne.",
    "Na ja, ist trotzdem ein schöner Abend.", "Ach, nächstes Mal klappt's."],
  mo: ["Hoppla!", "Das war der Plan. Ehrlich.", "Hab ich mit Absicht gemacht, weißt du.", "Daneben? Ich? Niemals!", "Ich geh nur kurz baden.",
    "Platsch!", "Siehst du, ich bin eine Wasserratte.", "Haha, versemmelt!", "Das war ein Test.", "Ich schwimm zurück.", "Hat jemand ein Handtuch?",
    "Ups, daneben."],
};

/** Truus roept je toe op het startscherm (zelfde aantal als OPENERS in speech.js). */
export const OPENERS_DE = [
  "Zehn rauf und runterrr!",
  "Jaaa! Da sind wir wieder! Zehn rauf und runter!",
  "Meine Damen und Herren... Zehn rauf und runterrr!",
  "Willkommen am Tisch! Mischt die Karten, die Party geht los!",
  "Auf, auf, auf, Karten auf den Tisch! Zehn rauf und runter!",
];
/** Als je na een spel terug bent op het startscherm (zelfde aantal als RETURNERS). */
export const RETURNERS_DE = [
  "Da bist du ja wieder! Lust auf noch eine Runde?",
  "Komm schon, noch ein Spiel! Diesmal triffst du jede Ansage!",
  "Da willst du doch mehr, oder? Misch die Karten!",
  "Revanche? Du kannst das bestimmt besser. Beweis es!",
];
