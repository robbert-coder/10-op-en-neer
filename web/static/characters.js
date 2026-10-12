// De computerspelers. Per spel worden er een paar geloot; elk heeft een eigen gezicht, stem en manier van praten.
// Wat ze zeggen bij een voorspelling en als ze nat gaan staat in voices.js (met geluid); hier staan hun
// reacties op wat er aan tafel gebeurt (alleen in een tekstballon).

export const CHARACTERS = {
  henk: { name: "Henk", about: "rustige, droge oude heer" },
  truus: { name: "Truus", about: "uitbundig en dramatisch" },
  kees: { name: "Kees", about: "nuchter en brutaal" },
  ria: { name: "Ria", about: "gezellige oma" },
  bram: { name: "Bram", about: "student, praat als een jongere" },
  gerda: { name: "Gerda", about: "fanatiek en streng" },
  sjef: { name: "Sjef", about: "gemoedelijke caféman" },
  mo: { name: "Mo", about: "grappenmaker" },
};
export const CHARACTER_IDS = Object.keys(CHARACTERS);
/** De vaste bezetting van vroeger: Henk links, Truus boven, Kees rechts, Ria als vijfde. */
export const CLASSIC_CAST = ["henk", "truus", "kees", "ria"];

/** Loot een bezetting voor de stoelen 2 t/m 5 (index 0 en 1 blijven leeg). */
export function drawCast() {
  const pool = CHARACTER_IDS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [null, null, ...pool.slice(0, 4)];
}

export const REACTIONS = {
  // Een computerspeler haalt een slag
  slag: {
    henk: ["Die is voor mij.", "Netjes.", "Zo gaat dat.", "Kijk aan.", "Rustig binnengehaald.", "Dat had ik al gezien."],
    truus: ["Hebbes!", "Joepie!", "Kijk eens aan!", "Oeh, wat fijn!", "Die is van mij, schatjes!", "Hoera!"],
    kees: ["Mooi zo.", "Pak 'm!", "Yes.", "Gewoon binnen.", "Makkie.", "Zie je wel."],
    ria: ["Oh, die is van mij!", "Kijk nou!", "Haha, hebbes!", "Och, wat leuk!", "Die neem ik mee, lieverd.", "Ja hoor!"],
    bram: ["Easy!", "Let's go!", "Hebbes, bro.", "Vet!", "Gewoon gepakt.", "Skills."],
    gerda: ["Zoals verwacht.", "Precies volgens plan.", "Genoteerd.", "Uiteraard.", "Die hoort bij mij.", "Goed zo."],
    sjef: ["Hèhè, die is binnen.", "Kijk, jong.", "Op z'n gemak.", "Proost!", "Die zet ik op de lat.", "Mooi, hè."],
    mo: ["Tadaa!", "Applaus graag!", "Per ongeluk gewonnen.", "Magie!", "Niemand zag het aankomen. Ik ook niet.", "Kassa!"],
  },
  // Iemand voorspelt veel slagen
  hoog: {
    henk: ["Zo, flink.", "Dat is veel.", "Hm, ambitieus.", "Moedig.", "We gaan het zien.", "Dat zou ik niet durven."],
    truus: ["Wauw, durf jij!", "Zo! Dat is wat!", "Nou, nou!", "Oh, wat spannend!", "Jij durft, zeg!", "Dat wordt een show!"],
    kees: ["Ja ja, tuurlijk.", "Dat geloof je zelf niet.", "Stoer hoor.", "Grote mond.", "Laat maar zien.", "Dat gaat 'm niet worden."],
    ria: ["Oh, dat is een hoop!", "Nou, succes ermee!", "Gut, zoveel?", "Och, wat dapper.", "Pas maar op, lieverd.", "Dat is niet niks!"],
    bram: ["Bro, serieus?", "Zo, vol gas!", "Dat is next level.", "Respect.", "Big brain move.", "Die durft!"],
    gerda: ["Dat is overmoedig.", "Dat gaat niet lukken.", "Ambitieus. Te ambitieus.", "Ik let op je.", "Interessant.", "Daar kijk ik naar uit."],
    sjef: ["Zo, jong!", "Hèhè, flink, hè.", "Da's niet mis.", "Proost op jouw lef.", "Op jouw gezondheid!", "Zo, die gaat ervoor."],
    mo: ["Zo, iemand heeft ontbeten!", "Rustig aan, kampioen!", "Wil je ook mijn slagen?", "Dat is veel. Ik tel mee.", "Oké, held!", "Zullen we vast klappen?"],
  },
  // Het totaal van de voorspellingen is precies het aantal kaarten
  rond: {
    henk: ["Rond. Jammer.", "Hm. Mooi rond.", "Dat is jammer.", "Rond. Opletten dus.", "Precies rond.", "Tja. Rond."],
    truus: ["Ach, rond. Saai!", "Nee hè, rond!", "Wat zonde!", "Rond! Wat flauw!", "Oh, alles klopt. Bah!", "Rond, hoe saai!"],
    kees: ["Rond? Lekker dan.", "Pff, rond.", "Flauw hoor.", "Rond. Boeiend.", "Saai, man.", "Rond, ja ja."],
    ria: ["Oh, rond. Jammer.", "Ach, rond. Nou ja.", "Dat had ik liever niet.", "Och, het klopt precies.", "Rond, lieverd.", "Nou, keurig rond."],
    bram: ["Rond? Saai.", "Meh, rond.", "Kansloos rond.", "Rond, boring.", "Iedereen happy, saai.", "Rond. Oké dan."],
    gerda: ["Rond. Dan moet iedereen opletten.", "Rond. Dat mag eigenlijk niet.", "Hm, rond.", "Dat is te makkelijk.", "Rond. Jammer.", "Keurig. Te keurig."],
    sjef: ["Ach, rond, jong.", "Rond, hè. Gezellig.", "Da's ook goed.", "Iedereen blij.", "Rond als een biertje.", "Hèhè, rond."],
    mo: ["Rond! Net als ik.", "Rond. Wat een harmonie.", "Iedereen wint! Of niet.", "Rond, net een donut.", "Perfect rond. Saai.", "Vredig, hè?"],
  },
  // Er zijn samen meer slagen voorspeld dan er zijn
  over: {
    henk: ["Te veel gevraagd. Iemand gaat nat.", "Dat past niet.", "Dat gaat niet goed.", "Iemand rekent verkeerd.", "Te veel. Spannend.", "Dat gaat schuren."],
    truus: ["Dat gaat mis, hoor!", "Te veel! Spannend!", "Oei, te veel!", "Wie gaat er zwemmen?", "Drama in de maak!", "Oh, dat wordt vechten!"],
    kees: ["Dat gaat bloeden.", "Te veel, jongens.", "Wie gaat er nat?", "Lekker hebberig.", "Iemand verliest.", "Dat wordt knokken."],
    ria: ["Oei, dat wordt dringen!", "Dat zijn er te veel!", "Daar gaat iemand nat.", "Och, dat past niet.", "Iemand krijgt natte voeten.", "Gut, te veel!"],
    bram: ["Te veel, bro.", "Dat wordt knokken.", "Iemand gaat nat, sowieso.", "Chaos!", "Dit wordt lachen.", "Te hebberig, man."],
    gerda: ["Te veel. Iemand heeft slecht geteld.", "Dat gaat mis. Niet bij mij.", "Eén van jullie gaat nat.", "Te veel. Opletten.", "Slordig.", "Ik ga het niet zijn."],
    sjef: ["Te veel, jong.", "Da's dringen aan de bar.", "Iemand gaat zwemmen, hè.", "Te veel. Hèhè.", "Wie trakteert er straks?", "Da's krap, jong."],
    mo: ["Te veel! Wie heeft er gesmokkeld?", "Iemand gaat zwemmen. Ik heb een badeend.", "Dat past niet. Net als mijn broek.", "Te veel. Popcorn erbij!", "Iemand liegt!", "Oei, chaos!"],
  },
  // Er zijn samen minder slagen voorspeld dan er zijn
  onder: {
    henk: ["Er blijven slagen over.", "Te weinig. Opletten.", "Er moet nog wat weg.", "Wie neemt de rest?", "Te bescheiden.", "Er blijft wat liggen."],
    truus: ["Er blijven er over!", "Wie neemt die extra?", "Te weinig, spannend!", "Oh, een cadeautje voor iemand!", "Wie wil er nog?", "Spannend!"],
    kees: ["Iemand krijgt een cadeautje.", "Te weinig, let op.", "Wie pakt de rest?", "Lekker zuinig.", "Er gaat iemand nat.", "Weggeven, jongens."],
    ria: ["Er is nog wat over!", "Er moet nog wat verdeeld worden.", "Wie wil er nog een?", "Och, iemand krijgt er een bij.", "Te zuinig, lieverd.", "Er blijft wat liggen."],
    bram: ["Te weinig, bro.", "Wie pakt de rest?", "Gratis slagen!", "Iemand krijgt er een, sowieso.", "Te chill.", "Zuinig, man."],
    gerda: ["Te weinig. Iemand krijgt er een te veel.", "Opletten nu.", "Er blijven slagen over. Niet voor mij.", "Te voorzichtig.", "Hm. Te weinig.", "Dat wordt weggeven."],
    sjef: ["Er blijft wat over, jong.", "Wie wil er nog een rondje?", "Te weinig, hè.", "Er is nog over, hèhè.", "Op de lat ermee.", "Zuinig, jong."],
    mo: ["Gratis slagen! Wie wil?", "Er blijft wat over. Mag ik?", "Zuinig volk, hier.", "Kom maar, kom maar.", "Een slag op overschot!", "Wie wil een cadeautje?"],
  },
  // Een mens vraagt om een tip
  tip: {
    henk: ["Een tip? Prima hoor.", "Hm, even spieken.", "Geen schande.", "Rustig nadenken helpt ook.", "Ik zag het wel.", "Tja, een tip."],
    truus: ["Oeh, een tip!", "Spieken, hè?", "Haha, ik zag het!", "Valsspeler! Grapje!", "Tip van Tineke, hè?", "Slim, hoor!"],
    kees: ["Zwak, man.", "Tip nodig, hè?", "Ik zag het.", "Zelf nadenken!", "Makkelijk zo.", "Ja ja, met hulp."],
    ria: ["Ach, een tip is goed, lieverd.", "Niks mis mee.", "Och, slim van je.", "Ik vraag ook wel eens wat.", "Goed zo, vragen mag.", "Gezellig hoor."],
    bram: ["Bro, een tip?", "Cheatcode!", "Haha, hulp nodig?", "Spieken, hè?", "Tutorial-modus.", "Oké, oké."],
    gerda: ["Een tip? Dat telt niet mee.", "Dat noteer ik.", "Zelf denken is beter.", "Hulp? Hm.", "Zo win je niks.", "Ik zag het wel."],
    sjef: ["Ach jong, een tip.", "Mag best, hè.", "Ik vraag ook wel eens de weg.", "Hèhè, slim.", "Niks mis mee, jong.", "Gezellig."],
    mo: ["Een tip? Mag ik er ook een?", "Spieken! Ik zeg niks.", "Hulplijn ingeschakeld!", "Bel een vriend!", "Een tip? Neem een tip van mij: niks.", "Ik heb het niet gezien. Echt."],
  },
};
