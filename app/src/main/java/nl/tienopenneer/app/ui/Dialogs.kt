package nl.tienopenneer.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import nl.tienopenneer.app.GameUi
import nl.tienopenneer.app.GameViewModel
import nl.tienopenneer.app.ScoreCell
import nl.tienopenneer.app.Screen

@Composable
fun RoundResultDialog(ui: GameUi, vm: GameViewModel) {
    val row = ui.scoreRows[ui.round - 1]
    AlertDialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false),
        title = { Text("Ronde ${ui.round} is afgelopen") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row {
                    Text("", Modifier.weight(1.6f))
                    HeaderCell("Gezegd")
                    HeaderCell("Gehaald")
                    HeaderCell("Punten")
                    HeaderCell("Totaal")
                }
                ui.seats.forEachIndexed { i, seat ->
                    val cell = row.cells[i]
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            seat.name,
                            Modifier.weight(1.6f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontWeight = if (i == 0) FontWeight.Bold else FontWeight.Normal,
                        )
                        ValueCell(cell?.bid?.toString() ?: "")
                        ValueCell(cell?.tricks?.toString() ?: "")
                        ValueCell(
                            if (cell == null) "" else if (cell.good) "+${cell.score}" else if (cell.crossed) "0" else "+${cell.score}",
                            color = if (cell?.good == true) GoodGreen else BadRed,
                        )
                        ValueCell(seat.total.toString(), bold = true)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { vm.continueAfterRound() }) {
                Text(if (ui.round == ui.rounds) "Uitslag" else "Volgende ronde")
            }
        },
        dismissButton = {
            TextButton(onClick = { vm.showScores = true }) { Text("Scorelijst") }
        },
    )
}

@Composable
fun GameOverDialog(ui: GameUi, vm: GameViewModel) {
    val ranking = ui.seats.sortedBy { it.rank }
    val me = ui.seats[0]
    AlertDialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false),
        title = {
            Text(
                when (me.rank) {
                    1 -> "Gewonnen!"
                    2 -> "Tweede plaats"
                    3 -> "Derde plaats"
                    else -> "Vierde plaats"
                },
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                ranking.forEach { seat ->
                    Row {
                        Text("${seat.rank}.", Modifier.width(28.dp))
                        Text(
                            seat.name,
                            Modifier.weight(1f),
                            fontWeight = if (seat.number == 1) FontWeight.Bold else FontWeight.Normal,
                        )
                        Text("${seat.total}", fontWeight = FontWeight.Bold)
                    }
                }
                if (vm.highScorePlace > 0) {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Je staat op plaats ${vm.highScorePlace} in de highscore van ${ui.variantName}.",
                        color = Gold,
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { vm.screen = Screen.NEW_GAME }) { Text("Nieuw spel") }
        },
        dismissButton = {
            Row {
                TextButton(onClick = { vm.showScores = true }) { Text("Scorelijst") }
                TextButton(onClick = { vm.leaveGame() }) { Text("Menu") }
            }
        },
    )
}

@Composable
fun ScoreSheetDialog(ui: GameUi, onClose: () -> Unit) {
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = FeltDark,
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
        ) {
            Column(Modifier.padding(12.dp)) {
                Text("Scorelijst · ${ui.variantName}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                Spacer(Modifier.height(8.dp))
                Row {
                    Text("Rnd", Modifier.weight(0.8f), color = Color(0xFFC8E6C9), fontSize = 12.sp)
                    ui.seats.forEach {
                        Text(
                            it.name,
                            Modifier.weight(1f),
                            textAlign = TextAlign.Center,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                        )
                    }
                }
                HorizontalDivider(color = Color(0x55FFFFFF))
                LazyColumn(Modifier.weight(1f)) {
                    items(ui.scoreRows) { row ->
                        val current = row.round == ui.round
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .background(if (current) Color(0x22FFD54F) else Color.Transparent)
                                .padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                "${row.round} (${row.cards})",
                                Modifier.weight(0.8f),
                                color = Color(0xFFC8E6C9),
                                fontSize = 12.sp,
                            )
                            row.cells.forEach { ScoreSheetCell(it, Modifier.weight(1f)) }
                        }
                    }
                }
                HorizontalDivider(color = Color(0x55FFFFFF))
                Row(Modifier.padding(vertical = 6.dp)) {
                    Text("Totaal", Modifier.weight(0.8f), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    ui.seats.forEach {
                        Text(
                            it.total.toString(),
                            Modifier.weight(1f),
                            textAlign = TextAlign.Center,
                            color = Gold,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
                Text(
                    "Klein getal: voorspelling. Doorgestreept: fout voorspeld.",
                    color = Color(0xFFC8E6C9),
                    fontSize = 11.sp,
                )
                TextButton(onClick = onClose, modifier = Modifier.align(Alignment.End)) { Text("Sluiten") }
            }
        }
    }
}

@Composable
private fun ScoreSheetCell(cell: ScoreCell?, modifier: Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.Bottom) {
        if (cell == null) return@Row
        Text(
            cell.bid.toString(),
            fontSize = 11.sp,
            color = if (cell.score < 0) Gold else if (cell.good) GoodGreen else BadRed,
            textDecoration = if (cell.score >= 0 && !cell.good) TextDecoration.LineThrough else null,
        )
        if (cell.score >= 0 && !cell.crossed) {
            Spacer(Modifier.width(4.dp))
            Text(cell.score.toString(), fontSize = 14.sp, color = Color.White)
        }
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.HeaderCell(text: String) {
    Text(text, Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 11.sp, color = Color(0xFFC8E6C9))
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.ValueCell(
    text: String,
    color: Color = Color.Unspecified,
    bold: Boolean = false,
) {
    Text(
        text,
        Modifier.weight(1f),
        textAlign = TextAlign.Center,
        color = color,
        fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
    )
}
