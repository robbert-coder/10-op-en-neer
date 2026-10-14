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
  // Een computerspeler haalt een slag terwijl hij zijn bod al heeft: nu mag hij niets meer halen
  oei: {
    henk: ["O jee.", "Hm, dat was er een te veel bijna.", "Nu moet ik oppassen."],
    truus: ["O nee, o nee!", "Help, die wilde ik niet!", "O jee, schatjes!"],
    kees: ["Oeps.", "Die had ik niet nodig.", "Nu geen slag meer, hè."],
    ria: ["O jee, lieverd.", "Och, nu moet ik oppassen.", "Die hoefde ik niet."],
    bram: ["Oei, bro.", "Niet de bedoeling.", "Nu niks meer pakken."],
    gerda: ["Dat was niet de bedoeling.", "Nu geen fouten meer.", "Hm. Opletten."],
    sjef: ["O jee, jong.", "Die had ik laten liggen.", "Nu rustig aan."],
    mo: ["O jee, o jee.", "Wie heeft die bij mij gelegd?", "Ik wil 'm terugbrengen."],
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

/** Dezelfde reacties in het Engels (zelfde soorten, karakters en aantallen), als het spel in het Engels draait. */
export const REACTIONS_EN = {
  oei: {
    henk: ["Oh dear.", "Hm, that's my lot now.", "Careful now."],
    truus: ["Oh no, oh no!", "Help, I didn't want that one!", "Oh dear, darlings!"],
    kees: ["Oops.", "Didn't need that one.", "No more tricks for me."],
    ria: ["Oh dear, love.", "Oh, now I must be careful.", "I didn't need that one."],
    bram: ["Yikes, bro.", "Not the plan.", "Gotta take nothing now."],
    gerda: ["That was not the plan.", "No more mistakes now.", "Hm. Concentrate."],
    sjef: ["Oh dear, mate.", "Should've let that one go.", "Easy does it now."],
    mo: ["Oh dear, oh dear.", "Who put that one on me?", "Can I return it?"],
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
    henk: ["My, that's bold.", "That's a lot.", "Hm, ambitious.", "Brave.", "We'll see.", "I wouldn't dare."],
    truus: ["Wow, you're brave!", "Ooh! That's something!", "Well, well!", "Oh, how exciting!", "You've got nerve!", "This'll be a show!"],
    kees: ["Yeah, sure.", "You don't believe that yourself.", "Very tough.", "Big talk.", "Go on, show me.", "Not going to happen."],
    ria: ["Oh, that's a lot!", "Well, good luck with that!", "Goodness, that many?", "Oh, how brave.", "Careful now, dear.", "That's quite something!"],
    bram: ["Bro, seriously?", "Full throttle!", "That's next level.", "Respect.", "Big brain move.", "Bold!"],
    gerda: ["Overconfident.", "That won't work.", "Ambitious. Too ambitious.", "I'm watching you.", "Interesting.", "I look forward to this."],
    sjef: ["Blimey, lad!", "Heh, that's a lot, eh.", "Not bad at all.", "Here's to your nerve.", "Your good health!", "Going for it, then."],
    mo: ["Someone had a big breakfast!", "Easy, champ!", "Want my tricks too?", "That's a lot. I'm counting.", "Okay, hero!", "Shall we clap already?"],
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
    henk: ["Too many bid. Someone will miss.", "That doesn't fit.", "That won't end well.", "Someone can't count.", "Too many. Exciting.", "That'll be tight."],
    truus: ["That's going wrong, mind!", "Too many! Exciting!", "Oops, too many!", "Who's going to sink?", "Drama in the making!", "Ooh, that'll be a fight!"],
    kees: ["Someone's going to bleed.", "Too many, folks.", "Who's going to miss?", "Bit greedy.", "Someone loses.", "That'll be a scrap."],
    ria: ["Oops, that'll be a squeeze!", "That's too many!", "Someone's going to miss.", "Oh, that doesn't fit.", "Someone will get wet feet.", "Goodness, too many!"],
    bram: ["Too many, bro.", "That'll be a fight.", "Someone's missing, for sure.", "Chaos!", "This'll be fun.", "Too greedy, man."],
    gerda: ["Too many. Someone counted badly.", "That'll go wrong. Not for me.", "One of you will miss.", "Too many. Pay attention.", "Sloppy.", "It won't be me."],
    sjef: ["Too many, lad.", "Crowded at the bar.", "Someone's going for a swim, eh.", "Too many. Heh.", "Who's buying the next round?", "That's tight, lad."],
    mo: ["Too many! Who's been smuggling?", "Someone's going under. I've got a rubber duck.", "That doesn't fit. Like my trousers.", "Too many. Get the popcorn!", "Someone's lying!", "Oops, chaos!"],
  },
  onder: {
    henk: ["There are tricks to spare.", "Too few. Careful.", "Some still need to go.", "Who takes the rest?", "Too modest.", "Something's left over."],
    truus: ["There are some left!", "Who'll take the extra?", "Too few, exciting!", "Ooh, a present for someone!", "Who wants more?", "Exciting!"],
    kees: ["Someone gets a present.", "Too few, watch out.", "Who takes the rest?", "Bit stingy.", "Someone's going to miss.", "Giving them away, folks."],
    ria: ["There's some left over!", "Still something to share out.", "Who wants another?", "Oh, someone gets an extra one.", "Too stingy, dear.", "Something's left on the table."],
    bram: ["Too few, bro.", "Who takes the rest?", "Free tricks!", "Someone's getting one, for sure.", "Too chill.", "Stingy, man."],
    gerda: ["Too few. Someone will get one too many.", "Pay attention now.", "Tricks to spare. Not for me.", "Too cautious.", "Hm. Too few.", "Someone will have to take one."],
    sjef: ["Some left over, lad.", "Who fancies another round?", "Too few, eh.", "Still some left, heh.", "Put it on the tab.", "Stingy, lad."],
    mo: ["Free tricks! Who wants one?", "Some left over. Can I have it?", "Stingy bunch, this.", "Come on, come on.", "A trick going spare!", "Who wants a present?"],
  },
  tip: {
    henk: ["A tip? Fine by me.", "Hm, a quick peek.", "No shame in that.", "Thinking calmly helps too.", "I noticed.", "Well, a tip."],
    truus: ["Ooh, a tip!", "Peeking, eh?", "Haha, I saw that!", "Cheat! Only joking!", "A tip from Tineke, eh?", "Clever, that!"],
    kees: ["Weak, mate.", "Needed a tip, eh?", "I saw that.", "Think for yourself!", "Easy that way.", "Sure, with help."],
    ria: ["Oh, a tip is fine, dear.", "Nothing wrong with that.", "Oh, clever of you.", "I ask now and then too.", "Good, asking is allowed.", "How nice."],
    bram: ["Bro, a tip?", "Cheat code!", "Haha, need help?", "Peeking, eh?", "Tutorial mode.", "Okay, okay."],
    gerda: ["A tip? That doesn't count.", "I'm noting that.", "Thinking for yourself is better.", "Help? Hm.", "That's no way to win.", "I noticed."],
    sjef: ["Ah lad, a tip.", "That's allowed, eh.", "I ask for directions too.", "Heh, clever.", "Nothing wrong with it, lad.", "Cosy."],
    mo: ["A tip? Can I have one too?", "Peeking! I won't tell.", "Lifeline activated!", "Phone a friend!", "A tip? Here's mine: nothing.", "I didn't see a thing. Honestly."],
  },
};
