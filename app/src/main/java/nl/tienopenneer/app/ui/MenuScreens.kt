package nl.tienopenneer.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import nl.tienopenneer.app.GameViewModel
import nl.tienopenneer.app.Screen
import nl.tienopenneer.engine.Card
import nl.tienopenneer.engine.Rules
import kotlin.math.roundToInt

@Composable
private fun Page(title: String, onBack: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    BackHandler(onBack = onBack)
    Column(
        Modifier
            .fillMaxSize()
            .background(Felt)
            .safeDrawingPadding(),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(FeltDark)
                .padding(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(onClick = onBack) { Text("‹ Terug") }
            Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
        }
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            content = content,
        )
    }
}

@Composable
fun MenuScreen(vm: GameViewModel) {
    Column(
        Modifier
            .fillMaxSize()
            .background(Felt)
            .safeDrawingPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.height(130.dp).width(200.dp)) {
            CardFace(Card(Card.CLUBS, 10), 70.dp, Modifier.align(Alignment.Center).offset(x = (-50).dp, y = 8.dp))
            CardFace(Card(Card.HEARTS, 10), 70.dp, Modifier.align(Alignment.Center).offset(y = (-4).dp))
            CardFace(Card(Card.SPADES, 14), 70.dp, Modifier.align(Alignment.Center).offset(x = 50.dp, y = 8.dp))
        }
        Spacer(Modifier.height(16.dp))
        Text("10 op en neer", fontSize = 36.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("en Boerenbridge", fontSize = 16.sp, color = Color(0xFFC8E6C9))
        Spacer(Modifier.height(32.dp))

        val buttonModifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp)
        if (vm.hasGameInProgress) {
            Button(onClick = { vm.resumeGame() }, modifier = buttonModifier) {
                Text("Doorgaan met spel", fontSize = 17.sp)
            }
        }
        if (vm.hasGameInProgress) {
            OutlinedButton(onClick = { vm.screen = Screen.NEW_GAME }, modifier = buttonModifier) {
                Text("Nieuw spel", fontSize = 17.sp)
            }
        } else {
            Button(onClick = { vm.screen = Screen.NEW_GAME }, modifier = buttonModifier) {
                Text("Nieuw spel", fontSize = 17.sp)
            }
        }
        OutlinedButton(onClick = { vm.screen = Screen.RULES }, modifier = buttonModifier) { Text("Spelregels") }
        OutlinedButton(onClick = { vm.screen = Screen.HIGHSCORES }, modifier = buttonModifier) { Text("Highscores") }
        OutlinedButton(onClick = { vm.screen = Screen.SETTINGS }, modifier = buttonModifier) { Text("Instellingen") }

        Spacer(Modifier.height(32.dp))
        Text(
            "Gebaseerd op \"10 op en neer\" van A.A. Brink\nVrije software onder de GNU GPL v3",
            fontSize = 11.sp,
            color = Color(0xFFA5D6A7),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun NewGameScreen(vm: GameViewModel) {
    var base by remember { mutableStateOf(if (vm.newGameRules.maxCards == 13) Rules.BOERENBRIDGE else Rules.TIEN_OP_EN_NEER) }
    var rounding by remember { mutableStateOf(vm.newGameRules.roundingAllowed) }
    var mustTrump by remember { mutableStateOf(vm.newGameRules.mustTrump) }
    var confirm by remember { mutableStateOf(false) }

    fun select(r: Rules) {
        base = r
        rounding = r.roundingAllowed
        mustTrump = r.mustTrump
    }

    val rules = base.copy(roundingAllowed = rounding, mustTrump = mustTrump)

    Page("Nieuw spel", onBack = { vm.screen = Screen.MENU }) {
        VariantOption(
            title = "10 op en neer",
            description = "1 tot en met 10 kaarten en weer terug (19 rondes). Goed voorspeld: 10 punten plus 1 per slag. Fout voorspeld: 0 punten.",
            selected = base.maxCards == 10,
        ) { select(Rules.TIEN_OP_EN_NEER) }
        Spacer(Modifier.height(10.dp))
        VariantOption(
            title = "Boerenbridge",
            description = "1 tot en met 13 kaarten en weer terug (25 rondes). Goed voorspeld: 10 punten plus 3 per slag. Fout: 10 punten min 3 per slag verschil.",
            selected = base.maxCards == 13,
        ) { select(Rules.BOERENBRIDGE) }

        Spacer(Modifier.height(20.dp))
        SwitchRow(
            "Rondmaken toegestaan",
            "Mag de laatste speler zo voorspellen dat het totaal gelijk is aan het aantal kaarten?",
            rounding,
        ) { rounding = it }
        SwitchRow(
            "Verplicht introeven",
            "Moet je troef spelen als je geen kleur kunt bekennen?",
            mustTrump,
        ) { mustTrump = it }
        Text("Je speelt: ${rules.variantName}", color = Gold, modifier = Modifier.padding(vertical = 8.dp))

        Spacer(Modifier.height(12.dp))
        Button(
            onClick = {
                vm.newGameRules = rules
                if (vm.hasGameInProgress) confirm = true else vm.startNewGame(rules)
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Start", fontSize = 17.sp) }
    }

    if (confirm) {
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = { Text("Nieuw spel") },
            text = { Text("Je huidige spel wordt dan beëindigd. Wil je een nieuw spel beginnen?") },
            confirmButton = {
                TextButton(onClick = {
                    confirm = false
                    vm.startNewGame(rules)
                }) { Text("Ja") }
            },
            dismissButton = { TextButton(onClick = { confirm = false }) { Text("Nee") } },
        )
    }
}

@Composable
private fun VariantOption(title: String, description: String, selected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(12.dp)
    Column(
        Modifier
            .fillMaxWidth()
            .background(if (selected) FeltLight else FeltDark, shape)
            .border(2.dp, if (selected) Gold else Color(0x44FFFFFF), shape)
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = if (selected) Gold else Color.White)
        Spacer(Modifier.height(4.dp))
        Text(description, fontSize = 13.sp, color = Color(0xFFE0E0E0))
    }
}

@Composable
private fun SwitchRow(title: String, description: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, color = Color.White, fontSize = 16.sp)
            Text(description, color = Color(0xFFC8E6C9), fontSize = 12.sp)
        }
        Spacer(Modifier.width(12.dp))
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
fun HighScoresScreen(vm: GameViewModel) {
    val variants = listOf(
        "10 op en neer" to Rules.TIEN_OP_EN_NEER,
        "Boerenbridge" to Rules.BOERENBRIDGE,
        "Hybride" to Rules.TIEN_OP_EN_NEER.copy(mustTrump = true),
    )
    var tab by remember { mutableIntStateOf(0) }
    var version by remember { mutableIntStateOf(0) }
    var confirmClear by remember { mutableStateOf(false) }
    val rules = variants[tab].second
    val scores = remember(tab, version) { vm.highScores(rules) }

    Page("Highscores", onBack = { vm.screen = Screen.MENU }) {
        TabRow(selectedTabIndex = tab, containerColor = FeltDark) {
            variants.forEachIndexed { i, (name, _) ->
                Tab(selected = tab == i, onClick = { tab = i }, text = { Text(name, fontSize = 13.sp) })
            }
        }
        Spacer(Modifier.height(12.dp))
        if (scores.isEmpty()) {
            Text("Nog geen scores. Speel een spel uit om in de lijst te komen.", color = Color(0xFFC8E6C9))
        } else {
            scores.forEachIndexed { i, s ->
                Row(Modifier.padding(vertical = 5.dp)) {
                    Text("${i + 1}.", Modifier.width(32.dp), color = Color.White)
                    Text(s.name, Modifier.weight(1f), color = Color.White)
                    Text(s.date, Modifier.width(100.dp), color = Color(0xFFC8E6C9), fontSize = 13.sp)
                    Text(s.score.toString(), fontWeight = FontWeight.Bold, color = Gold)
                }
            }
            Spacer(Modifier.height(20.dp))
            OutlinedButton(onClick = { confirmClear = true }) { Text("Highscore wissen") }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text("Highscore wissen") },
            text = { Text("Weet je zeker dat je de highscore van ${variants[tab].first} wilt wissen?") },
            confirmButton = {
                TextButton(onClick = {
                    vm.clearHighScores(rules)
                    version++
                    confirmClear = false
                }) { Text("Wissen") }
            },
            dismissButton = { TextButton(onClick = { confirmClear = false }) { Text("Annuleren") } },
        )
    }
}

@Composable
fun SettingsScreen(vm: GameViewModel) {
    var name by remember { mutableStateOf(vm.settings.playerName) }
    val back = {
        vm.updateSettings(vm.settings.copy(playerName = name.trim().ifEmpty { "Speler" }))
        vm.screen = Screen.MENU
    }
    Page("Instellingen", onBack = back) {
        OutlinedTextField(
            value = name,
            onValueChange = { name = it.take(16) },
            label = { Text("Jouw naam") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(20.dp))
        Text("Spelsnelheid", color = Color.White, fontSize = 16.sp)
        Slider(
            value = vm.settings.speed.toFloat(),
            onValueChange = { vm.updateSettings(vm.settings.copy(speed = it.roundToInt())) },
            valueRange = 1f..5f,
            steps = 3,
        )
        Row {
            Text("Langzaam", color = Color(0xFFC8E6C9), fontSize = 12.sp, modifier = Modifier.weight(1f))
            Text("Snel", color = Color(0xFFC8E6C9), fontSize = 12.sp)
        }
        Spacer(Modifier.height(12.dp))
        SwitchRow(
            "Aflopend sorteren",
            "Je kaarten van hoog naar laag sorteren (aas eerst).",
            vm.settings.sortDescending,
        ) { vm.updateSettings(vm.settings.copy(sortDescending = it)) }
    }
}

@Composable
fun RulesScreen(vm: GameViewModel) {
    Page("Spelregels", onBack = { vm.screen = Screen.MENU }) {
        RULES_TEXT.forEach { (heading, body) ->
            Text(heading, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = Gold)
            Spacer(Modifier.height(4.dp))
            Text(body, fontSize = 14.sp, color = Color.White, lineHeight = 20.sp)
            Spacer(Modifier.height(16.dp))
        }
    }
}

private val RULES_TEXT = listOf(
    "Doel van het spel" to
        "Haal zoveel mogelijk punten, en meer dan je drie tegenspelers. Het leuke van dit spel is dat je ook met slechte kaarten kunt winnen.",
    "Ronden" to
        "Ieder krijgt in de eerste ronde 1 kaart, in de volgende ronde 2, enzovoort tot en met 10 kaarten. Daarna weer 9, 8, enzovoort tot en met 1. Vandaar de naam: in totaal zijn er 19 ronden. Bij Boerenbridge gaat het tot 13 kaarten (25 ronden); in de ronde met 13 kaarten is er geen troef.",
    "Troef" to
        "Aan het begin van elke ronde wordt een kaart van de stapel omgedraaid. De kleur van die kaart is troef. Je ziet hem rechtsboven in beeld.",
    "Voorspellen" to
        "Aan het begin van elke ronde zegt iedere speler hoeveel slagen hij denkt te halen. De bolletjes bij de naam laten zien hoeveel slagen iemand voorspeld heeft en hoeveel hij er al heeft. Bovenin zie je of er in totaal slagen over zijn of te weinig.",
    "Rondmaken" to
        "Als rondmaken niet is toegestaan (zoals bij Boerenbridge), mag de laatste speler niet zo voorspellen dat het totaal van alle voorspellingen gelijk is aan het aantal kaarten. Dan haalt er altijd minstens één speler zijn voorspelling niet.",
    "Kaarten opleggen" to
        "De speler met het gele bolletje komt uit: hij legt als eerste een kaart op. Daarna legt de volgende speler (met de klok mee) een kaart bij. Je moet kleur bekennen: als je een kaart hebt van de kleur die is uitgekomen, moet je die spelen. Kun je geen kleur bekennen, dan mag je elke kaart spelen (bij verplicht introeven moet je dan troef spelen als je die hebt).",
    "Een slag halen" to
        "Als alle vier de spelers een kaart hebben opgelegd, krijgt de hoogste kaart de slag. De volgorde is 2 tot en met 10, boer, vrouw, heer, aas. Een kaart van een andere kleur dan die is uitgekomen is altijd lager, behalve troef: troef is hoger dan alle andere kleuren. Wie de slag haalt, moet daarna uitkomen.",
    "Voorbeeld" to
        "Harten is troef. Speler 1 komt uit met klaver heer. Speler 2 legt schoppen aas bij (dat mag, want hij heeft geen klaver). Speler 3 legt klaver vijf (hij heeft klaver en moet dus kleur bekennen). Speler 4 legt harten twee (een troef; dat mag, want hij heeft geen klaver). De slag gaat naar speler 4.",
    "Punten bij 10 op en neer" to
        "Haal je precies het aantal slagen dat je voorspeld hebt, dan krijg je 10 punten plus 1 punt per slag. Lukt dat niet, dan krijg je niets. Een score van 170 is zeer goed, boven de 200 is bijna niet te halen.",
    "Punten bij Boerenbridge" to
        "Goed voorspeld: 10 punten plus 3 punten per slag. Fout voorspeld: 10 punten min 3 punten per slag verschil (niet lager dan 0).",
    "Tips in de app" to
        "Tik op Tip om te zien wat de computer zou doen. Tik op de tafel om een volle slag meteen binnen te halen. Via het menu rechtsboven kun je de laatste slag nog eens bekijken.",
    "Over deze app" to
        "Deze app is gebaseerd op het Windows-spel \"10 op en neer\" van A.A. Brink (sourceforge.net/projects/tienopenneer). De computerspelers gebruiken dezelfde strategie als het origineel. Vrije software onder de GNU General Public License versie 3.",
)
