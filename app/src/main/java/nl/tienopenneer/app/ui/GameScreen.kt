package nl.tienopenneer.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp
import nl.tienopenneer.app.GameUi
import nl.tienopenneer.app.GameViewModel
import nl.tienopenneer.app.Screen
import nl.tienopenneer.app.SeatUi
import nl.tienopenneer.engine.Phase

private val SideSeatWidth = 78.dp

@Composable
fun GameScreen(vm: GameViewModel) {
    val ui = vm.ui ?: return
    BackHandler { vm.leaveGame() }

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(Felt)
            .safeDrawingPadding(),
    ) {
        val screenWidth = maxWidth

        Column(Modifier.fillMaxSize()) {
            TopBar(ui, vm)
            SeatView(ui.seats[2], Modifier.align(Alignment.CenterHorizontally))
            BoxWithConstraints(
                Modifier
                    .weight(1f)
                    .fillMaxWidth(),
            ) {
                // De tafel moet zowel in de breedte (naast de zijspelers) als in de hoogte passen
                val tableCardWidth = min(
                    min(76.dp, (maxWidth - SideSeatWidth * 2 - 16.dp) / 3.3f),
                    maxHeight / (CARD_RATIO * 2.35f),
                )
                SeatView(
                    ui.seats[1],
                    Modifier
                        .align(Alignment.CenterStart)
                        .width(SideSeatWidth),
                )
                SeatView(
                    ui.seats[3],
                    Modifier
                        .align(Alignment.CenterEnd)
                        .width(SideSeatWidth),
                )
                TableView(ui, vm, tableCardWidth, Modifier.align(Alignment.Center))
            }
            StatusLine(ui, vm)
            if (ui.humanBidding) {
                BidPanel(ui, vm)
            }
            SeatView(ui.seats[0], Modifier.align(Alignment.CenterHorizontally), compact = true)
            HandView(ui, vm, screenWidth - 16.dp)
        }

        if (ui.phase == Phase.ROUND_COMPLETE) RoundResultDialog(ui, vm)
        if (ui.phase == Phase.GAME_OVER) GameOverDialog(ui, vm)
        if (vm.showScores) ScoreSheetDialog(ui) { vm.showScores = false }
    }
}

@Composable
private fun TopBar(ui: GameUi, vm: GameViewModel) {
    var menuOpen by remember { mutableStateOf(false) }
    Row(
        Modifier
            .fillMaxWidth()
            .background(FeltDark)
            .padding(start = 12.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(
                "Ronde ${ui.round} van ${ui.rounds}",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 16.sp,
            )
            Text(
                "${ui.cardsThisRound} ${if (ui.cardsThisRound == 1) "kaart" else "kaarten"} · ${ui.variantName}",
                color = Color(0xFFC8E6C9),
                fontSize = 12.sp,
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Slagen", color = Color(0xFFC8E6C9), fontSize = 11.sp)
            Text(ui.tricksOverText, color = Gold, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (ui.trump.isNone) {
                Box(
                    Modifier
                        .size(30.dp, 42.dp)
                        .border(1.dp, Color(0x88FFFFFF), RoundedCornerShape(3.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("–", color = Color.White)
                }
                Text("Geen troef", color = Color(0xFFC8E6C9), fontSize = 10.sp)
            } else {
                CardFace(ui.trump, 30.dp)
                Text("Troef", color = Color(0xFFC8E6C9), fontSize = 10.sp)
            }
        }
        Spacer(Modifier.width(4.dp))
        TextButton(onClick = { vm.showScores = true }) { Text("Scores") }
        Box {
            IconButton(onClick = { menuOpen = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = Color.White)
            }
            DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                DropdownMenuItem(
                    text = { Text(if (vm.showLastTrick) "Huidige slag tonen" else "Laatste slag tonen") },
                    enabled = ui.lastTrickWinner != 0,
                    onClick = {
                        menuOpen = false
                        vm.toggleLastTrick()
                    },
                )
                DropdownMenuItem(
                    text = { Text("Spelregels") },
                    onClick = {
                        menuOpen = false
                        vm.leaveGame()
                        vm.screen = Screen.RULES
                    },
                )
                DropdownMenuItem(
                    text = { Text("Naar het hoofdmenu") },
                    onClick = {
                        menuOpen = false
                        vm.leaveGame()
                    },
                )
            }
        }
    }
}

@Composable
private fun SeatView(seat: SeatUi, modifier: Modifier = Modifier, compact: Boolean = false) {
    Column(
        modifier.padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (seat.isLeader) {
                Box(
                    Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Gold),
                )
                Spacer(Modifier.width(4.dp))
            }
            Text(
                seat.name,
                color = if (seat.isActive) Gold else Color.White,
                fontWeight = if (seat.isActive) FontWeight.Bold else FontWeight.Normal,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (compact) {
                Spacer(Modifier.width(8.dp))
                Text("${seat.total} pt", color = Color(0xFFC8E6C9), fontSize = 12.sp)
                Spacer(Modifier.width(8.dp))
                TrickDots(seat.bid, seat.tricks, seat.cardCount)
            }
        }
        if (!compact) {
            Text("${seat.total} pt", color = Color(0xFFC8E6C9), fontSize = 12.sp)
            Spacer(Modifier.height(2.dp))
            TrickDots(seat.bid, seat.tricks, seat.cardCount)
            Spacer(Modifier.height(4.dp))
            if (seat.cardCount > 0) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CardBack(22.dp)
                    Text(" × ${seat.cardCount}", color = Color.White, fontSize = 12.sp)
                }
            }
        }
    }
}

/**
 * De rondjes uit het origineel: een rondje per voorspelde slag, gevuld als de slag binnen is,
 * rood als het een onvoorspelde slag is of als de voorspelde slag niet meer te halen is.
 */
@Composable
private fun TrickDots(bid: Int, tricks: Int, cardsLeft: Int) {
    if (bid < 0) {
        Text("…", color = Color(0xFFC8E6C9), fontSize = 12.sp)
        return
    }
    if (bid == 0 && tricks == 0) {
        Text("0 slagen", color = Color(0xFFC8E6C9), fontSize = 11.sp)
        return
    }
    val n = maxOf(bid, tricks)
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        for (row in (1..n).chunked(7)) {
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                for (i in row) {
                    val (fill, ring) = when {
                        i <= bid && i <= tricks -> Gold to Gold
                        i <= bid && i - tricks <= cardsLeft -> Color.Transparent to Gold
                        i <= bid -> Color.Transparent to BadRed
                        else -> BadRed to BadRed
                    }
                    Box(
                        Modifier
                            .size(9.dp)
                            .clip(CircleShape)
                            .background(fill)
                            .border(1.5.dp, ring, CircleShape),
                    )
                }
            }
        }
    }
}

@Composable
private fun TableView(ui: GameUi, vm: GameViewModel, cardWidth: Dp, modifier: Modifier) {
    val showLast = vm.showLastTrick && ui.lastTrickWinner != 0
    val cards = if (showLast) ui.lastTrick else ui.table
    val winner = if (showLast) ui.lastTrickWinner else ui.trickWinner
    val cardHeight = cardWidth * CARD_RATIO
    Box(
        modifier
            .size(cardWidth * 3.3f, cardHeight * 2.35f)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            ) { vm.onTableTap() },
    ) {
        if (showLast) {
            Text(
                "Laatste slag",
                color = Gold,
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.TopStart),
            )
        }
        val alignments = listOf(
            Alignment.BottomCenter,
            Alignment.CenterStart,
            Alignment.TopCenter,
            Alignment.CenterEnd,
        )
        for (i in 0..3) {
            val card = cards[i]
            Box(Modifier.align(alignments[i])) {
                if (card.isNone) {
                    CardSlot(cardWidth)
                } else {
                    key(card) {
                        var appeared by remember { mutableStateOf(false) }
                        LaunchedEffect(Unit) { appeared = true }
                        val scale by animateFloatAsState(if (appeared) 1f else 0.7f, label = "kaart")
                        CardFace(
                            card,
                            cardWidth,
                            modifier = Modifier.graphicsLayer {
                                scaleX = scale
                                scaleY = scale
                            },
                            highlight = if (winner == i + 1) Gold else null,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusLine(ui: GameUi, vm: GameViewModel) {
    val text = vm.message ?: when {
        ui.humanBidding -> "Hoeveel slagen denk je te halen?"
        ui.humanPlaying -> "Kies een kaart."
        ui.phase == Phase.TRICK_COMPLETE -> ui.status + " Tik op tafel om door te gaan."
        else -> ui.status
    }
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text,
            color = if (vm.message != null) Gold else Color.White,
            fontSize = 14.sp,
            modifier = Modifier.weight(1f),
        )
        if (ui.humanBidding || ui.humanPlaying) {
            TextButton(onClick = { vm.onTip() }) { Text("Tip") }
        }
    }
}

@Composable
private fun BidPanel(ui: GameUi, vm: GameViewModel) {
    val options = (0..ui.cardsThisRound).toList()
    Column(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        for (row in options.chunked(7)) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(vertical = 3.dp)) {
                for (n in row) {
                    val forbidden = n == ui.forbiddenBid
                    val hinted = n == vm.hintBid
                    Box(
                        Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (forbidden) Color(0x33000000) else FeltLight)
                            .border(2.dp, if (hinted) Gold else Color(0x66FFFFFF), RoundedCornerShape(10.dp))
                            .clickable(enabled = !forbidden) { vm.onBid(n) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            n.toString(),
                            color = if (forbidden) Color(0x88FFFFFF) else Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            textDecoration = if (forbidden) TextDecoration.LineThrough else null,
                        )
                    }
                }
            }
        }
        if (ui.forbiddenBid != null) {
            Text(
                "Rondmaken is niet toegestaan: je mag geen ${ui.forbiddenBid} zeggen.",
                color = Color(0xFFC8E6C9),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun HandView(ui: GameUi, vm: GameViewModel, available: Dp) {
    val n = ui.hand.size
    val cardWidth = if (n <= 1) 72.dp else min(72.dp, available / (0.56f * (n - 1) + 1f))
    val spacing = if (n <= 1) 0.dp else min(cardWidth + 4.dp, (available - cardWidth) / (n - 1))
    val totalWidth = if (n == 0) 0.dp else cardWidth + spacing * (n - 1)
    val lift = 12.dp
    Box(
        Modifier
            .fillMaxWidth()
            .height(cardWidth * CARD_RATIO + lift + 8.dp)
            .padding(bottom = 6.dp),
        contentAlignment = Alignment.BottomCenter,
    ) {
        Box(Modifier.width(totalWidth).height(cardWidth * CARD_RATIO + lift)) {
            ui.hand.forEachIndexed { i, card ->
                val legal = card in ui.legal
                val raised = ui.humanPlaying && legal
                CardFace(
                    card,
                    cardWidth,
                    modifier = Modifier
                        .offset(x = spacing * i, y = if (raised) 0.dp else lift)
                        .clickable { vm.onCardTap(card) },
                    dimmed = ui.humanPlaying && !legal,
                    highlight = if (card == vm.hintCard) Gold else null,
                )
            }
        }
    }
}
