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
  // Je laat de computers lang wachten: een bijdehante opmerking
  wacht: {
    henk: ["Neem gerust de tijd. Ik word toch al oud.", "Ik ga zo even een krantje halen.", "Hm. Denk je nog, of slaap je?", "Ik heb intussen mijn pensioen aangevraagd.", "Zeg het maar als je wakker bent."],
    truus: ["Schatje, wij worden hier grijs!", "Hallo? Is daar iemand?", "Ik heb intussen mijn nagels gelakt!", "Ik verveel me dood, schatje!", "Moet ik soms gaan zingen?"],
    kees: ["Kom op, het is geen schaken.", "Vandaag nog?", "Zal ik anders een kaart voor je kiezen?", "Ik kan dit ook sneller, hoor.", "Tik tak, tik tak."],
    ria: ["Rustig aan, lieverd, ik zet wel koffie.", "Ik heb intussen een sjaal gebreid.", "Neem de tijd, hoor. Ik heb tot de kerst.", "Zal ik er een koekje bij doen?", "Geen haast, ik zit hier lekker."],
    bram: ["Bro, ben je AFK?", "Ik check intussen even mijn telefoon.", "Loading... loading...", "Bro, de server is sneller dan jij.", "Ik ben bijna in slaap gevallen."],
    gerda: ["Wij hebben niet de hele dag.", "Ik tel de seconden.", "Niet kiezen is ook een keuze.", "Dit duurt te lang.", "Kom op, beslis nou eens."],
    sjef: ["Ik haal intussen nog een rondje.", "Geen haast, jong. Nou ja, een beetje.", "Zal ik de kaarten warm houden?", "Ik bestel er nog maar een, jong.", "Kijk eens aan, de bitterballen zijn op."],
    mo: ["Ik ben intussen een jaar ouder geworden.", "Zullen we pauze nemen? O, dat doen we al.", "Spannend hoor, deze film.", "Ik heb intussen een podcast opgenomen.", "Even voor de duidelijkheid: jij bent aan de beurt."],
  },
  // Iedereen is deze ronde nat gegaan
  allenat: {
    henk: ["Zo. Allemaal nat. Gezellig.", "Dat hebben we samen mooi verprutst.", "Niemand een punt. Ook een uitslag.", "Nou, volgende ronde doen we het beter."],
    truus: ["Iedereen nat! Wat een drama!", "Nou schatjes, we zwemmen allemaal!", "Allemaal nat, haal de handdoeken!", "Wat een ramp, iedereen kopje onder!"],
    kees: ["Knap hoor, allemaal nat.", "Nou, lekker bezig, iedereen.", "Niemand? Echt niemand?", "Ik zeg niks. Nou ja, wel: slecht."],
    ria: ["Och, we zijn allemaal nat geregend.", "Iedereen nat, dan maar een kopje thee.", "Gezellig, samen nat.", "Ach, samen uit, samen thuis."],
    bram: ["Iedereen nat, epic fail.", "Bro, wij allemaal? Respect.", "Collectieve fail, lekker.", "Iedereen nat. Dit gaat viral."],
    gerda: ["Onvoldoende. Voor iedereen.", "Dit is een schande.", "Allemaal nat. Dat noteer ik.", "Ik ben teleurgesteld in jullie allemaal."],
    sjef: ["Allemaal nat, dan maar een rondje van de zaak!", "Proost, op het natte pak!", "Hèhè, iedereen doornat.", "Allemaal nat, zand erover en proost!"],
    mo: ["Iedereen nat? Ik haal de paraplu.", "Synchroonzwemmen, mensen!", "Dit was zo gepland. Echt.", "Applaus voor onszelf, mensen!"],
  },
  // Een computerspeler haalt een slag terwijl hij zijn bod al heeft: nu mag hij niets meer halen
  oei: {
    henk: ["O jee.", "Hm, dat was er een te veel bijna.", "Nu moet ik oppassen.", "Dat was niet slim.", "Hm, nu niks meer."],
    truus: ["O nee, o nee!", "Help, die wilde ik niet!", "O jee, schatjes!", "Oh, wat een pech!", "Nee toch, schatjes!"],
    kees: ["Oeps.", "Die had ik niet nodig.", "Nu geen slag meer, hè.", "Verkeerde slag.", "Dat was dom."],
    ria: ["O jee, lieverd.", "Och, nu moet ik oppassen.", "Die hoefde ik niet.", "Och, wat vervelend.", "Die geef ik zo terug."],
    bram: ["Oei, bro.", "Niet de bedoeling.", "Nu niks meer pakken.", "Bro, nee!", "Dat ging mis."],
    gerda: ["Dat was niet de bedoeling.", "Nu geen fouten meer.", "Hm. Opletten.", "Dat was een rekenfout.", "Dit klopt niet."],
    sjef: ["O jee, jong.", "Die had ik laten liggen.", "Nu rustig aan.", "Die was te veel, jong.", "Nou ja, zand erover."],
    mo: ["O jee, o jee.", "Wie heeft die bij mij gelegd?", "Ik wil 'm terugbrengen.", "Kan iemand deze terugnemen?", "Ik zag hem niet aankomen."],
  },
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
    henk: ["Zo, flink.", "Dat is veel.", "Hm, ambitieus.", "Moedig.", "We gaan het zien.", "Dat zou ik niet durven.", "Dat wordt hard werken."],
    truus: ["Wauw, durf jij!", "Zo! Dat is wat!", "Nou, nou!", "Oh, wat spannend!", "Jij durft, zeg!", "Dat wordt een show!", "Oh, ik krijg er kippenvel van!"],
    kees: ["Ja ja, tuurlijk.", "Dat geloof je zelf niet.", "Stoer hoor.", "Grote mond.", "Laat maar zien.", "Dat gaat 'm niet worden.", "Dat ga je nooit halen."],
    ria: ["Oh, dat is een hoop!", "Nou, succes ermee!", "Gut, zoveel?", "Och, wat dapper.", "Pas maar op, lieverd.", "Dat is niet niks!", "Nou, dat is moedig, lieverd."],
    bram: ["Bro, serieus?", "Zo, vol gas!", "Dat is next level.", "Respect.", "Big brain move.", "Die durft!", "Zo, all-in!"],
    gerda: ["Dat is overmoedig.", "Dat gaat niet lukken.", "Ambitieus. Te ambitieus.", "Ik let op je.", "Interessant.", "Daar kijk ik naar uit.", "Dat ga ik nauwkeurig volgen."],
    sjef: ["Zo, jong!", "Hèhè, flink, hè.", "Da's niet mis.", "Proost op jouw lef.", "Op jouw gezondheid!", "Zo, die gaat ervoor.", "Daar drink ik op, jong!"],
    mo: ["Zo, iemand heeft ontbeten!", "Rustig aan, kampioen!", "Wil je ook mijn slagen?", "Dat is veel. Ik tel mee.", "Oké, held!", "Zullen we vast klappen?", "Iemand voelt zich vandaag heel sterk!"],
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
    henk: ["Te veel gevraagd. Iemand gaat nat.", "Dat past niet.", "Dat gaat niet goed.", "Iemand rekent verkeerd.", "Te veel. Spannend.", "Dat gaat schuren.", "Dat gaat niet voor iedereen goed."],
    truus: ["Dat gaat mis, hoor!", "Te veel! Spannend!", "Oei, te veel!", "Wie gaat er zwemmen?", "Drama in de maak!", "Oh, dat wordt vechten!", "Oh, wie gaat er kopje onder?"],
    kees: ["Dat gaat bloeden.", "Te veel, jongens.", "Wie gaat er nat?", "Lekker hebberig.", "Iemand verliest.", "Dat wordt knokken.", "Er gaat iemand hard onderuit."],
    ria: ["Oei, dat wordt dringen!", "Dat zijn er te veel!", "Daar gaat iemand nat.", "Och, dat past niet.", "Iemand krijgt natte voeten.", "Gut, te veel!", "Dat wordt een gedrang, lieverd."],
    bram: ["Te veel, bro.", "Dat wordt knokken.", "Iemand gaat nat, sowieso.", "Chaos!", "Dit wordt lachen.", "Te hebberig, man.", "Te veel, dit wordt drama."],
    gerda: ["Te veel. Iemand heeft slecht geteld.", "Dat gaat mis. Niet bij mij.", "Eén van jullie gaat nat.", "Te veel. Opletten.", "Slordig.", "Ik ga het niet zijn.", "Dat klopt niet. Iemand gaat nat."],
    sjef: ["Te veel, jong.", "Da's dringen aan de bar.", "Iemand gaat zwemmen, hè.", "Te veel. Hèhè.", "Wie trakteert er straks?", "Da's krap, jong.", "Te veel gasten aan de bar, jong."],
    mo: ["Te veel! Wie heeft er gesmokkeld?", "Iemand gaat zwemmen. Ik heb een badeend.", "Dat past niet. Net als mijn broek.", "Te veel. Popcorn erbij!", "Iemand liegt!", "Oei, chaos!", "Te veel! Ik pak alvast een reddingsboei."],
  },
  // Er zijn samen minder slagen voorspeld dan er zijn
  onder: {
    henk: ["Er blijven slagen over.", "Te weinig. Opletten.", "Er moet nog wat weg.", "Wie neemt de rest?", "Te bescheiden.", "Er blijft wat liggen.", "Er ligt nog een slag voor het oprapen."],
    truus: ["Er blijven er over!", "Wie neemt die extra?", "Te weinig, spannend!", "Oh, een cadeautje voor iemand!", "Wie wil er nog?", "Spannend!", "Ooh, wie krijgt het cadeautje?"],
    kees: ["Iemand krijgt een cadeautje.", "Te weinig, let op.", "Wie pakt de rest?", "Lekker zuinig.", "Er gaat iemand nat.", "Weggeven, jongens.", "Te zuinig. Iemand gaat nat."],
    ria: ["Er is nog wat over!", "Er moet nog wat verdeeld worden.", "Wie wil er nog een?", "Och, iemand krijgt er een bij.", "Te zuinig, lieverd.", "Er blijft wat liggen.", "Er is nog genoeg voor iedereen."],
    bram: ["Te weinig, bro.", "Wie pakt de rest?", "Gratis slagen!", "Iemand krijgt er een, sowieso.", "Te chill.", "Zuinig, man.", "Te weinig, wie pakt de bonus?"],
    gerda: ["Te weinig. Iemand krijgt er een te veel.", "Opletten nu.", "Er blijven slagen over. Niet voor mij.", "Te voorzichtig.", "Hm. Te weinig.", "Dat wordt weggeven.", "Te weinig. Ik houd het in de gaten."],
    sjef: ["Er blijft wat over, jong.", "Wie wil er nog een rondje?", "Te weinig, hè.", "Er is nog over, hèhè.", "Op de lat ermee.", "Zuinig, jong.", "Er staat nog een rondje open, jong."],
    mo: ["Gratis slagen! Wie wil?", "Er blijft wat over. Mag ik?", "Zuinig volk, hier.", "Kom maar, kom maar.", "Een slag op overschot!", "Wie wil een cadeautje?", "Er blijft een slag over. Wie wil hem adopteren?"],
  },
  // Een mens vraagt om een tip
  tip: {
    henk: ["Een tip? Prima hoor.", "Hm, even spieken.", "Geen schande.", "Rustig nadenken helpt ook.", "Ik zag het wel.", "Tja, een tip.", "Vragen staat vrij."],
    truus: ["Oeh, een tip!", "Spieken, hè?", "Haha, ik zag het!", "Valsspeler! Grapje!", "Tip van Tineke, hè?", "Slim, hoor!", "Tineke weet alles, hè!"],
    kees: ["Zwak, man.", "Tip nodig, hè?", "Ik zag het.", "Zelf nadenken!", "Makkelijk zo.", "Ja ja, met hulp.", "Zonder hulp lukt het niet, hè?"],
    ria: ["Ach, een tip is goed, lieverd.", "Niks mis mee.", "Och, slim van je.", "Ik vraag ook wel eens wat.", "Goed zo, vragen mag.", "Gezellig hoor.", "Slim om even te vragen, lieverd."],
    bram: ["Bro, een tip?", "Cheatcode!", "Haha, hulp nodig?", "Spieken, hè?", "Tutorial-modus.", "Oké, oké.", "Bro gebruikt een walkthrough."],
    gerda: ["Een tip? Dat telt niet mee.", "Dat noteer ik.", "Zelf denken is beter.", "Hulp? Hm.", "Zo win je niks.", "Ik zag het wel.", "Hulp gevraagd. Genoteerd."],
    sjef: ["Ach jong, een tip.", "Mag best, hè.", "Ik vraag ook wel eens de weg.", "Hèhè, slim.", "Niks mis mee, jong.", "Gezellig.", "Een tip van de zaak, jong."],
    mo: ["Een tip? Mag ik er ook een?", "Spieken! Ik zeg niks.", "Hulplijn ingeschakeld!", "Bel een vriend!", "Een tip? Neem een tip van mij: niks.", "Ik heb het niet gezien. Echt.", "Een tip! Ik geef ook graag tips. Slechte."],
  },
};

/** Dezelfde reacties in het Engels (zelfde soorten, karakters en aantallen), als het spel in het Engels draait. */
export const REACTIONS_EN = {
  wacht: {
    henk: ["Take your time. I'm getting old anyway.", "I'll just go and fetch a newspaper.", "Hm. Still thinking, or asleep?", "I've applied for my pension in the meantime.", "Let me know when you're awake."],
    truus: ["Darling, we're going grey here!", "Hello? Anybody there?", "I've done my nails in the meantime!", "I'm bored to death, darling!", "Shall I start singing?"],
    kees: ["Come on, it's not chess.", "Today, maybe?", "Shall I pick a card for you?", "I could do this faster, you know.", "Tick tock, tick tock."],
    ria: ["Easy, dear, I'll put the kettle on.", "I've knitted a scarf in the meantime.", "Take your time. I've got till Christmas.", "Shall I fetch a biscuit with it?", "No rush, I'm quite comfy here."],
    bram: ["Bro, are you AFK?", "I'll just check my phone then.", "Loading... loading...", "Bro, the server's faster than you.", "I almost fell asleep."],
    gerda: ["We don't have all day.", "I'm counting the seconds.", "Not choosing is a choice too.", "This is taking too long.", "Come on, make a decision."],
    sjef: ["I'll get another round in.", "No rush, lad. Well, a bit.", "Shall I keep the cards warm?", "I'll order another one then, lad.", "Look at that, the snacks are gone."],
    mo: ["I've aged a year in the meantime.", "Shall we take a break? Oh, we already are.", "Thrilling film, this.", "I've recorded a podcast in the meantime.", "Just to be clear: it's your turn."],
  },
  allenat: {
    henk: ["Well. Everyone missed. Lovely.", "We've botched that together nicely.", "Nobody scores. That's a result too.", "Well, we'll do better next round."],
    truus: ["Everybody missed! What a drama!", "Well darlings, we're all sunk!", "All of us! Fetch the tissues!", "What a disaster, everyone's sunk!"],
    kees: ["Impressive, all of us missed.", "Well done, everyone.", "Nobody? Really nobody?", "I'm saying nothing. Well, okay: rubbish."],
    ria: ["Oh, we all came a cropper.", "Everyone missed, time for a cup of tea.", "How cosy, missing together.", "Oh well, we're all in the same boat."],
    bram: ["Everyone missed, epic fail.", "Bro, all of us? Respect.", "Group fail, nice.", "Everyone missed. This is going viral."],
    gerda: ["Unsatisfactory. For everyone.", "This is a disgrace.", "Everyone missed. I'm noting that.", "I am disappointed in all of you."],
    sjef: ["All missed, drinks on the house!", "Cheers, to a round of nothing!", "Heh, everyone sunk.", "All missed, forget it and cheers!"],
    mo: ["Everyone missed? I'll get the umbrella.", "Synchronised failing, people!", "That was the plan. Honestly.", "A round of applause for ourselves, people!"],
  },
  oei: {
    henk: ["Oh dear.", "Hm, that's my lot now.", "Careful now.", "That wasn't clever.", "Hm, nothing more now."],
    truus: ["Oh no, oh no!", "Help, I didn't want that one!", "Oh dear, darlings!", "Oh, what bad luck!", "Oh no, darlings!"],
    kees: ["Oops.", "Didn't need that one.", "No more tricks for me.", "Wrong trick.", "That was stupid."],
    ria: ["Oh dear, love.", "Oh, now I must be careful.", "I didn't need that one.", "Oh, how annoying.", "I'll give that one back."],
    bram: ["Yikes, bro.", "Not the plan.", "Gotta take nothing now.", "Bro, no!", "That went wrong."],
    gerda: ["That was not the plan.", "No more mistakes now.", "Hm. Concentrate.", "That was a miscalculation.", "This isn't right."],
    sjef: ["Oh dear, mate.", "Should've let that one go.", "Easy does it now.", "That one was too many, lad.", "Oh well, never mind."],
    mo: ["Oh dear, oh dear.", "Who put that one on me?", "Can I return it?", "Can someone take this back?", "Didn't see that coming."],
  },
  slag: {
    henk: ["That one's mine.", "Neat.", "That's how it's done.", "Well, well.", "Calmly taken.", "Saw that coming."],
    truus: ["Gotcha!", "Woohoo!", "Look at that!", "Ooh, lovely!", "That's mine, darlings!", "Hooray!"],
    kees: ["Nice.", "Take that!", "Yes.", "In the bag.", "Easy.", "Told you."],
    ria: ["Oh, that one's mine!", "Would you look at that!", "Haha, got it!", "Oh, how nice!", "I'll take that, dear.", "Oh yes!"],
    bram: ["Easy!", "Let's go!", "Got it, bro.", "Sick!", "Just took it.", "Skills."],
    gerda: ["As expected.", "Exactly to plan.", "Noted.", "Naturally.", "That one belongs to me.", "Good."],
    sjef: ["Heh, that's in.", "There you go, lad.", "Nice and easy.", "Cheers!", "Put that on my tab.", "Lovely, eh."],
    mo: ["Ta-da!", "Applause, please!", "Won it by accident.", "Magic!", "Nobody saw that coming. Me neither.", "Ka-ching!"],
  },
  hoog: {
    henk: ["My, that's bold.", "That's a lot.", "Hm, ambitious.", "Brave.", "We'll see.", "I wouldn't dare.", "That'll be hard work."],
    truus: ["Wow, you're brave!", "Ooh! That's something!", "Well, well!", "Oh, how exciting!", "You've got nerve!", "This'll be a show!", "Oh, I've got goosebumps!"],
    kees: ["Yeah, sure.", "You don't believe that yourself.", "Very tough.", "Big talk.", "Go on, show me.", "Not going to happen.", "You'll never make that."],
    ria: ["Oh, that's a lot!", "Well, good luck with that!", "Goodness, that many?", "Oh, how brave.", "Careful now, dear.", "That's quite something!", "Well, that's brave, dear."],
    bram: ["Bro, seriously?", "Full throttle!", "That's next level.", "Respect.", "Big brain move.", "Bold!", "Whoa, all in!"],
    gerda: ["Overconfident.", "That won't work.", "Ambitious. Too ambitious.", "I'm watching you.", "Interesting.", "I look forward to this.", "I'll be watching that closely."],
    sjef: ["Blimey, lad!", "Heh, that's a lot, eh.", "Not bad at all.", "Here's to your nerve.", "Your good health!", "Going for it, then.", "I'll drink to that, lad!"],
    mo: ["Someone had a big breakfast!", "Easy, champ!", "Want my tricks too?", "That's a lot. I'm counting.", "Okay, hero!", "Shall we clap already?", "Someone's feeling very strong today!"],
  },
  rond: {
    henk: ["Exact. Pity.", "Hm. Nicely even.", "That's a shame.", "Even. Pay attention, then.", "Exactly even.", "Well. Even."],
    truus: ["Oh, it adds up. Boring!", "Oh no, it adds up!", "What a waste!", "It adds up! How dull!", "Oh, it all fits. Yuck!", "Even, how boring!"],
    kees: ["Even? Great.", "Pff, even.", "Lame.", "Even. Whatever.", "Boring, mate.", "Even, yeah yeah."],
    ria: ["Oh, it adds up. Shame.", "Oh well, it adds up.", "I'd rather it didn't.", "Oh, it fits exactly.", "All even, dear.", "Well, neatly even."],
    bram: ["Even? Boring.", "Meh, even.", "Hopelessly even.", "Even, boring.", "Everyone happy, yawn.", "Even. Okay then."],
    gerda: ["It adds up. Everyone pay attention.", "Even. That really shouldn't be allowed.", "Hm, even.", "That's too easy.", "Even. Pity.", "Neat. Too neat."],
    sjef: ["Ah well, it adds up, lad.", "All even, eh. Cosy.", "That's fine too.", "Everyone's happy.", "Round as a beer mat.", "Heh, even."],
    mo: ["It adds up! Just like me.", "Even. Such harmony.", "Everyone wins! Or not.", "Round, like a doughnut.", "Perfectly even. Boring.", "Peaceful, isn't it?"],
  },
  over: {
    henk: ["Too many bid. Someone will miss.", "That doesn't fit.", "That won't end well.", "Someone can't count.", "Too many. Exciting.", "That'll be tight.", "That won't work out for everyone."],
    truus: ["That's going wrong, mind!", "Too many! Exciting!", "Oops, too many!", "Who's going to sink?", "Drama in the making!", "Ooh, that'll be a fight!", "Oh, who's going under?"],
    kees: ["Someone's going to bleed.", "Too many, folks.", "Who's going to miss?", "Bit greedy.", "Someone loses.", "That'll be a scrap.", "Someone's going down hard."],
    ria: ["Oops, that'll be a squeeze!", "That's too many!", "Someone's going to miss.", "Oh, that doesn't fit.", "Someone will get wet feet.", "Goodness, too many!", "That'll be a squeeze, dear."],
    bram: ["Too many, bro.", "That'll be a fight.", "Someone's missing, for sure.", "Chaos!", "This'll be fun.", "Too greedy, man.", "Too many, this'll be drama."],
    gerda: ["Too many. Someone counted badly.", "That'll go wrong. Not for me.", "One of you will miss.", "Too many. Pay attention.", "Sloppy.", "It won't be me.", "That doesn't add up. Someone will miss."],
    sjef: ["Too many, lad.", "Crowded at the bar.", "Someone's going for a swim, eh.", "Too many. Heh.", "Who's buying the next round?", "That's tight, lad.", "Too many folk at the bar, lad."],
    mo: ["Too many! Who's been smuggling?", "Someone's going under. I've got a rubber duck.", "That doesn't fit. Like my trousers.", "Too many. Get the popcorn!", "Someone's lying!", "Oops, chaos!", "Too many! I'll grab a lifebuoy."],
  },
  onder: {
    henk: ["There are tricks to spare.", "Too few. Careful.", "Some still need to go.", "Who takes the rest?", "Too modest.", "Something's left over.", "There's a trick up for grabs."],
    truus: ["There are some left!", "Who'll take the extra?", "Too few, exciting!", "Ooh, a present for someone!", "Who wants more?", "Exciting!", "Ooh, who gets the present?"],
    kees: ["Someone gets a present.", "Too few, watch out.", "Who takes the rest?", "Bit stingy.", "Someone's going to miss.", "Giving them away, folks.", "Too stingy. Someone will miss."],
    ria: ["There's some left over!", "Still something to share out.", "Who wants another?", "Oh, someone gets an extra one.", "Too stingy, dear.", "Something's left on the table.", "There's plenty left for everyone."],
    bram: ["Too few, bro.", "Who takes the rest?", "Free tricks!", "Someone's getting one, for sure.", "Too chill.", "Stingy, man.", "Too few, who grabs the bonus?"],
    gerda: ["Too few. Someone will get one too many.", "Pay attention now.", "Tricks to spare. Not for me.", "Too cautious.", "Hm. Too few.", "Someone will have to take one.", "Too few. I'm keeping an eye on it."],
    sjef: ["Some left over, lad.", "Who fancies another round?", "Too few, eh.", "Still some left, heh.", "Put it on the tab.", "Stingy, lad.", "There's still a round to pay for, lad."],
    mo: ["Free tricks! Who wants one?", "Some left over. Can I have it?", "Stingy bunch, this.", "Come on, come on.", "A trick going spare!", "Who wants a present?", "There's a trick left over. Who wants to adopt it?"],
  },
  tip: {
    henk: ["A tip? Fine by me.", "Hm, a quick peek.", "No shame in that.", "Thinking calmly helps too.", "I noticed.", "Well, a tip.", "No harm in asking."],
    truus: ["Ooh, a tip!", "Peeking, eh?", "Haha, I saw that!", "Cheat! Only joking!", "A tip from Tineke, eh?", "Clever, that!", "Tineke knows everything!"],
    kees: ["Weak, mate.", "Needed a tip, eh?", "I saw that.", "Think for yourself!", "Easy that way.", "Sure, with help.", "Can't do it without help, eh?"],
    ria: ["Oh, a tip is fine, dear.", "Nothing wrong with that.", "Oh, clever of you.", "I ask now and then too.", "Good, asking is allowed.", "How nice.", "Smart to ask, dear."],
    bram: ["Bro, a tip?", "Cheat code!", "Haha, need help?", "Peeking, eh?", "Tutorial mode.", "Okay, okay.", "Bro's using a walkthrough."],
    gerda: ["A tip? That doesn't count.", "I'm noting that.", "Thinking for yourself is better.", "Help? Hm.", "That's no way to win.", "I noticed.", "Help requested. Noted."],
    sjef: ["Ah lad, a tip.", "That's allowed, eh.", "I ask for directions too.", "Heh, clever.", "Nothing wrong with it, lad.", "Cosy.", "A tip on the house, lad."],
    mo: ["A tip? Can I have one too?", "Peeking! I won't tell.", "Lifeline activated!", "Phone a friend!", "A tip? Here's mine: nothing.", "I didn't see a thing. Honestly.", "A tip! I like giving tips too. Bad ones."],
  },
};

/** Dezelfde reacties in het Duits (zelfde soorten, karakters en aantallen als REACTIONS_EN), als het spel in het Duits draait. */
export const REACTIONS_DE = {
  // Je laat de computers lang wachten: een bijdehante opmerking
  wacht: {
    henk: ["Lass dir ruhig Zeit. Ich werde sowieso alt.", "Ich hole mir gleich mal eine Zeitung.", "Hm. Denkst du noch, oder schläfst du?", "Ich habe inzwischen meine Rente beantragt.", "Sag Bescheid, wenn du wach bist."],
    truus: ["Schätzchen, wir werden hier grau!", "Hallo? Ist da jemand?", "Ich hab mir inzwischen die Nägel lackiert!", "Ich langweile mich zu Tode, Schätzchen!", "Soll ich etwa singen?"],
    kees: ["Komm schon, das ist kein Schach.", "Heute noch?", "Soll ich dir eine Karte aussuchen?", "Das geht auch schneller, weißt du.", "Tick tack, tick tack."],
    ria: ["Immer mit der Ruhe, mein Lieber, ich koche Kaffee.", "Ich habe inzwischen einen Schal gestrickt.", "Lass dir Zeit. Ich hab bis Weihnachten.", "Soll ich noch ein Plätzchen dazu holen?", "Keine Eile, ich sitze hier gemütlich."],
    bram: ["Bro, bist du AFK?", "Ich check dann mal mein Handy.", "Loading... loading...", "Bro, der Server ist schneller als du.", "Ich bin fast eingeschlafen."],
    gerda: ["Wir haben nicht den ganzen Tag.", "Ich zähle die Sekunden.", "Nicht wählen ist auch eine Wahl.", "Das dauert zu lange.", "Komm schon, entscheide dich endlich."],
    sjef: ["Ich hol inzwischen noch eine Runde.", "Keine Eile, Junge. Na ja, ein bisschen.", "Soll ich die Karten warm halten?", "Dann bestell ich noch eins, Junge.", "Sieh mal an, die Frikadellen sind alle."],
    mo: ["Ich bin inzwischen ein Jahr älter geworden.", "Machen wir Pause? Ach, machen wir ja schon.", "Spannender Film, das hier.", "Ich habe inzwischen einen Podcast aufgenommen.", "Nur zur Info: Du bist dran."],
  },
  // Iedereen is deze ronde nat gegaan
  allenat: {
    henk: ["So. Alle daneben. Gemütlich.", "Das haben wir zusammen schön vermasselt.", "Keiner punktet. Auch ein Ergebnis.", "Na, nächste Runde machen wir es besser."],
    truus: ["Alle daneben! Was für ein Drama!", "Na, ihr Lieben, wir gehen alle baden!", "Alle zusammen! Holt die Taschentücher!", "Was für eine Katastrophe, alle gehen unter!"],
    kees: ["Respekt, alle daneben.", "Na, gut gemacht, alle.", "Keiner? Echt keiner?", "Ich sag nichts. Na gut: schlecht."],
    ria: ["Ach, wir sind alle baden gegangen.", "Alle daneben, dann erst mal ein Tässchen Tee.", "Gemütlich, zusammen daneben.", "Ach, mitgegangen, mitgefangen."],
    bram: ["Alle daneben, epic fail.", "Bro, wir alle? Respekt.", "Gruppen-Fail, nice.", "Alle daneben. Das geht viral."],
    gerda: ["Ungenügend. Für alle.", "Das ist eine Schande.", "Alle daneben. Das notiere ich.", "Ich bin von euch allen enttäuscht."],
    sjef: ["Alle daneben, die Runde geht aufs Haus!", "Prost, auf die Nullrunde!", "Hehe, alle baden gegangen.", "Alle daneben, Schwamm drüber und Prost!"],
    mo: ["Alle daneben? Ich hol den Regenschirm.", "Synchronbaden, Leute!", "Das war so geplant. Ehrlich.", "Applaus für uns selbst, Leute!"],
  },
  // Een computerspeler haalt een slag terwijl hij zijn bod al heeft: nu mag hij niets meer halen
  oei: {
    henk: ["Oje.", "Hm, jetzt habe ich genug.", "Jetzt vorsichtig.", "Das war nicht klug.", "Hm, jetzt nichts mehr."],
    truus: ["Oh nein, oh nein!", "Hilfe, den wollte ich nicht!", "Oje, ihr Lieben!", "Oh, so ein Pech!", "Nein, doch nicht, ihr Lieben!"],
    kees: ["Ups.", "Den brauchte ich nicht.", "Jetzt keinen Stich mehr.", "Falscher Stich.", "Das war dumm."],
    ria: ["Oje, mein Lieber.", "Ach, jetzt muss ich aufpassen.", "Den brauchte ich nicht.", "Ach, wie ärgerlich.", "Den gebe ich gleich zurück."],
    bram: ["Uff, Bro.", "Nicht der Plan.", "Jetzt nix mehr nehmen.", "Bro, nein!", "Das ging schief."],
    gerda: ["Das war nicht der Plan.", "Jetzt keine Fehler mehr.", "Hm. Konzentration.", "Das war ein Rechenfehler.", "Das stimmt nicht."],
    sjef: ["Oje, Junge.", "Den hätte ich liegen lassen sollen.", "Jetzt ganz ruhig.", "Der war zu viel, Junge.", "Na ja, Schwamm drüber."],
    mo: ["Oje, oje.", "Wer hat mir den untergejubelt?", "Kann ich den umtauschen?", "Kann den jemand zurücknehmen?", "Den hab ich nicht kommen sehen."],
  },
  // Een computerspeler haalt een slag
  slag: {
    henk: ["Der gehört mir.", "Ordentlich.", "So macht man das.", "Sieh mal an.", "Ganz ruhig geholt.", "Hab ich kommen sehen."],
    truus: ["Hab ich dich!", "Juhu!", "Schau dir das an!", "Oh, wie schön!", "Der ist meiner, ihr Lieben!", "Hurra!"],
    kees: ["Schön.", "Nimm das!", "Yes.", "Im Sack.", "Locker.", "Hab ich doch gesagt."],
    ria: ["Oh, der ist meiner!", "Schau mal einer an!", "Haha, erwischt!", "Ach, wie nett!", "Den nehme ich mit, mein Lieber.", "Oh ja!"],
    bram: ["Easy!", "Let's go!", "Hab ihn, Bro.", "Krass!", "Einfach genommen.", "Skills."],
    gerda: ["Wie erwartet.", "Genau nach Plan.", "Notiert.", "Selbstverständlich.", "Der gehört mir.", "Gut."],
    sjef: ["Hehe, der ist drin.", "Siehst du, Junge.", "Ganz gemütlich.", "Prost!", "Schreib ihn auf meinen Deckel.", "Schön, ne."],
    mo: ["Tadaa!", "Applaus, bitte!", "Aus Versehen gewonnen.", "Magie!", "Keiner hat's kommen sehen. Ich auch nicht.", "Kaching!"],
  },
  // Iemand voorspelt veel slagen
  hoog: {
    henk: ["Na, das ist kühn.", "Das ist viel.", "Hm, ehrgeizig.", "Mutig.", "Wir werden sehen.", "Das würde ich mich nicht trauen.", "Das wird harte Arbeit."],
    truus: ["Wow, du traust dich was!", "Oh! Das ist ja was!", "Na, na!", "Oh, wie aufregend!", "Du hast vielleicht Nerven!", "Das wird eine Show!", "Oh, ich krieg Gänsehaut!"],
    kees: ["Ja, klar.", "Das glaubst du doch selbst nicht.", "Sehr tough.", "Große Klappe.", "Na los, zeig mal.", "Wird nichts.", "Das schaffst du nie."],
    ria: ["Oh, das ist aber viel!", "Na, viel Glück damit!", "Meine Güte, so viele?", "Ach, wie tapfer.", "Pass bloß auf, mein Lieber.", "Das ist ja allerhand!", "Na, das ist mutig, mein Lieber."],
    bram: ["Bro, im Ernst?", "Vollgas!", "Das ist next level.", "Respekt.", "Big brain move.", "Mutig!", "Wow, all in!"],
    gerda: ["Übermütig.", "Das klappt nicht.", "Ehrgeizig. Zu ehrgeizig.", "Ich behalte dich im Auge.", "Interessant.", "Darauf freue ich mich.", "Das beobachte ich genau."],
    sjef: ["Donnerwetter, Junge!", "Hehe, das ist viel, ne.", "Gar nicht schlecht.", "Prost auf deinen Mut.", "Auf deine Gesundheit!", "Na, der zieht's durch.", "Darauf trink ich, Junge!"],
    mo: ["Da hat jemand gut gefrühstückt!", "Langsam, Champion!", "Willst du meine Stiche auch?", "Das ist viel. Ich zähl mit.", "Okay, Held!", "Sollen wir schon mal klatschen?", "Da fühlt sich heute jemand sehr stark!"],
  },
  // Het totaal van de voorspellingen is precies het aantal kaarten
  rond: {
    henk: ["Geht auf. Schade.", "Hm. Schön glatt.", "Das ist schade.", "Geht auf. Also aufpassen.", "Geht genau auf.", "Tja. Geht auf."],
    truus: ["Ach, geht auf. Langweilig!", "Oh nein, geht auf!", "Wie schade!", "Geht auf! Wie öde!", "Oh, alles passt. Bäh!", "Geht auf, wie langweilig!"],
    kees: ["Geht auf? Na toll.", "Pff, geht auf.", "Lahm.", "Geht auf. Egal.", "Langweilig, Mann.", "Geht auf, ja ja."],
    ria: ["Oh, geht auf. Schade.", "Na ja, geht auf.", "Das wäre mir lieber nicht.", "Ach, es passt genau.", "Geht auf, mein Lieber.", "Na, schön glatt."],
    bram: ["Geht auf? Langweilig.", "Meh, geht auf.", "Hoffnungslos glatt.", "Geht auf, boring.", "Alle happy, gähn.", "Geht auf. Okay dann."],
    gerda: ["Geht auf. Alle aufpassen.", "Geht auf. Das dürfte eigentlich nicht sein.", "Hm, geht auf.", "Das ist zu einfach.", "Geht auf. Schade.", "Ordentlich. Zu ordentlich."],
    sjef: ["Ach, geht auf, Junge.", "Geht auf, ne. Gemütlich.", "Ist auch gut.", "Alle zufrieden.", "Rund wie ein Bierdeckel.", "Hehe, geht auf."],
    mo: ["Geht auf! Genau wie ich.", "Geht auf. Welche Harmonie.", "Alle gewinnen! Oder nicht.", "Rund wie ein Donut.", "Perfekt glatt. Langweilig.", "Friedlich, oder?"],
  },
  // Er zijn samen meer slagen voorspeld dan er zijn
  over: {
    henk: ["Zu viel angesagt. Jemand geht baden.", "Das passt nicht.", "Das geht nicht gut aus.", "Jemand kann nicht rechnen.", "Zu viele. Spannend.", "Das wird eng.", "Das geht nicht für alle gut aus."],
    truus: ["Das geht schief, sag ich dir!", "Zu viele! Spannend!", "Hoppla, zu viele!", "Wer geht baden?", "Ein Drama bahnt sich an!", "Oh, das wird ein Kampf!", "Oh, wer geht hier unter?"],
    kees: ["Da wird jemand bluten.", "Zu viele, Leute.", "Wer geht baden?", "Ganz schön gierig.", "Einer verliert.", "Das wird eine Rauferei.", "Da fällt gleich jemand auf die Nase."],
    ria: ["Hoppla, das wird ein Gedränge!", "Das sind zu viele!", "Da geht jemand baden.", "Ach, das passt nicht.", "Da kriegt jemand nasse Füße.", "Meine Güte, zu viele!", "Das wird ein Gedränge, mein Lieber."],
    bram: ["Zu viele, Bro.", "Das wird ein Fight.", "Einer geht baden, safe.", "Chaos!", "Das wird lustig.", "Zu gierig, Mann.", "Zu viele, das gibt Drama."],
    gerda: ["Zu viele. Jemand hat schlecht gezählt.", "Das geht schief. Nicht bei mir.", "Einer von euch geht baden.", "Zu viele. Aufpassen.", "Schlampig.", "Ich werde es nicht sein.", "Das geht nicht auf. Jemand liegt daneben."],
    sjef: ["Zu viele, Junge.", "Gedränge an der Theke.", "Da geht einer schwimmen, ne.", "Zu viele. Hehe.", "Wer gibt die nächste Runde aus?", "Das wird knapp, Junge.", "Zu viele Gäste an der Theke, Junge."],
    mo: ["Zu viele! Wer hat geschmuggelt?", "Einer geht unter. Ich hab eine Quietscheente.", "Das passt nicht. Wie meine Hose.", "Zu viele. Popcorn her!", "Jemand lügt!", "Hoppla, Chaos!", "Zu viele! Ich hol schon mal den Rettungsring."],
  },
  // Er zijn samen minder slagen voorspeld dan er zijn
  onder: {
    henk: ["Da bleiben Stiche übrig.", "Zu wenige. Vorsicht.", "Da muss noch was weg.", "Wer nimmt den Rest?", "Zu bescheiden.", "Da bleibt was liegen.", "Da liegt noch ein Stich herum."],
    truus: ["Da bleiben welche übrig!", "Wer nimmt den Extra?", "Zu wenige, spannend!", "Oh, ein Geschenk für jemanden!", "Wer will noch?", "Spannend!", "Ooh, wer kriegt das Geschenk?"],
    kees: ["Jemand kriegt ein Geschenk.", "Zu wenige, aufpassen.", "Wer nimmt den Rest?", "Ganz schön geizig.", "Da geht jemand baden.", "Verschenken, Leute.", "Zu knauserig. Einer liegt daneben."],
    ria: ["Da ist noch was übrig!", "Da muss noch was verteilt werden.", "Wer möchte noch einen?", "Ach, jemand kriegt einen dazu.", "Zu sparsam, mein Lieber.", "Da bleibt was auf dem Tisch.", "Es ist noch genug für alle da."],
    bram: ["Zu wenige, Bro.", "Wer nimmt den Rest?", "Gratis Stiche!", "Einer kriegt einen, safe.", "Zu chillig.", "Geizig, Mann.", "Zu wenig, wer holt sich den Bonus?"],
    gerda: ["Zu wenige. Jemand kriegt einen zu viel.", "Jetzt aufpassen.", "Stiche übrig. Nicht für mich.", "Zu vorsichtig.", "Hm. Zu wenige.", "Da muss einer einen schlucken.", "Zu wenig. Ich behalte das im Auge."],
    sjef: ["Da bleibt was übrig, Junge.", "Wer will noch eine Runde?", "Zu wenige, ne.", "Ist noch was übrig, hehe.", "Schreib's auf den Deckel.", "Sparsam, Junge.", "Da ist noch eine Runde offen, Junge."],
    mo: ["Gratis Stiche! Wer will?", "Da bleibt was übrig. Darf ich?", "Geiziges Volk hier.", "Komm schon, komm schon.", "Ein Stich übrig!", "Wer will ein Geschenk?", "Da bleibt ein Stich übrig. Wer will ihn adoptieren?"],
  },
  // Een mens vraagt om een tip
  tip: {
    henk: ["Ein Tipp? Meinetwegen.", "Hm, kurz mal spicken.", "Keine Schande.", "Ruhig nachdenken hilft auch.", "Hab ich gesehen.", "Tja, ein Tipp.", "Fragen kostet nichts."],
    truus: ["Oh, ein Tipp!", "Gespickt, was?", "Haha, hab ich gesehen!", "Schummler! War nur Spaß!", "Ein Tipp von Tineke, was?", "Schlau, das!", "Tineke weiß einfach alles!"],
    kees: ["Schwach, Mann.", "Tipp gebraucht, was?", "Hab ich gesehen.", "Selber denken!", "So ist's leicht.", "Klar, mit Hilfe.", "Ohne Hilfe geht's nicht, was?"],
    ria: ["Ach, ein Tipp ist schon gut, mein Lieber.", "Nichts dabei.", "Ach, schlau von dir.", "Ich frage auch mal.", "Gut so, fragen ist erlaubt.", "Wie nett.", "Klug, mal zu fragen, mein Lieber."],
    bram: ["Bro, ein Tipp?", "Cheatcode!", "Haha, brauchst du Hilfe?", "Gespickt, was?", "Tutorial-Modus.", "Okay, okay.", "Bro benutzt eine Komplettlösung."],
    gerda: ["Ein Tipp? Das zählt nicht.", "Das notiere ich.", "Selber denken ist besser.", "Hilfe? Hm.", "So gewinnt man nicht.", "Hab ich gesehen.", "Hilfe geholt. Notiert."],
    sjef: ["Ach Junge, ein Tipp.", "Ist erlaubt, ne.", "Ich frag auch mal nach dem Weg.", "Hehe, schlau.", "Nichts dabei, Junge.", "Gemütlich.", "Ein Tipp aufs Haus, Junge."],
    mo: ["Ein Tipp? Krieg ich auch einen?", "Gespickt! Ich sag nichts.", "Joker eingesetzt!", "Telefonjoker!", "Ein Tipp? Hier ist meiner: nichts.", "Ich hab nichts gesehen. Ehrlich.", "Ein Tipp! Ich gebe auch gern Tipps. Schlechte."],
  },
};

/**
 * Of iedereen deze (afgelopen) ronde nat ging. Nodig voor de opmerking van een computerspeler als niemand zijn
 * bod haalde; alleen bij twee of meer spelers die allemaal voorspeld hebben.
 */
export function everyoneMissed(players) {
  if (!Array.isArray(players) || players.length < 2) return false;
  return players.every((p) => Number.isInteger(p?.bid) && p.bid >= 0 && Number.isInteger(p.tricks) && p.tricks !== p.bid);
}

/**
 * Wie de volgende opmerking maakt, op de beurt rond: de eerste stoel na [last] in [seats], of de eerste.
 * Nodig zodat niet steeds dezelfde computerspeler moppert als ze op je wachten.
 */
export function nextSpeaker(seats, last) {
  if (!Array.isArray(seats) || !seats.length) return 0;
  return seats.find((nr) => nr > last) ?? seats[0];
}
